import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { MainView, Memo, Bookmark, Notebook, Task, EisenhowerQuadrant, BrowserHistoryEntry, LinkPreviewData } from './types';
import { isSameDay } from './utils';
import * as db from './services/db';

import { IconSidebar } from './components/IconSidebar';
import { Calendar } from './components/Calendar';
import { DashboardStream } from './components/DashboardStream';
import { MemoInput } from './components/MemoInput';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { ImageEditorModal } from './components/ImageEditorModal';
import { TagsView } from './components/TagsView';
import { GalleryView } from './components/GalleryView';
import { ToolboxView } from './components/ToolboxView';
import { NotebookView } from './components/NotebookView';
import { BookmarkView } from './components/BookmarkView';
import { AiNotesView } from './components/AiNotesView';
import { SettingsModal } from './components/SettingsModal';
import { SidebarCalendarWidget } from './components/SidebarCalendarWidget';
import { EventModal } from './components/EventModal';
import { MonthlyCalendar as FullCalendarPage } from './components/MonthlyCalendar';
import KnowledgeGraphView from './components/KnowledgeGraphView'; // New
import GlobalSearchBar from './components/GlobalSearchBar'; // New
import QuickScrollButtons from './components/QuickScrollButtons'; // New
import MainStreamToggle from './components/MainStreamToggle'; // New toggle for main stream
import { AIConversationStream } from './components/AIConversationStream'; // New AI Stream Component
import { AIInput } from './components/AIInput'; // New AI Input Component
import type { AIConversationItem } from './types'; // Import AI Conversation Item Type

const App = () => {
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [mainStreamViewMode, setMainStreamViewMode] = useState<'memo' | 'ai_conv'>('memo'); // Controls Memo/AI switch in main content

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [memos, setMemos] = useState<Memo[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<BrowserHistoryEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [aiConversations, setAiConversations] = useState<AIConversationItem[]>([]); // New AI Conversations state
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [newMemoTimestamp, setNewMemoTimestamp] = useState<string>(new Date().toISOString());
  const [continueTimestamp, setContinueTimestamp] = useState(false);
  const [scrollToMemoId, setScrollToMemoId] = useState<number | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const dashboardStreamRef = useRef<HTMLDivElement>(null);
  const aiConversationStreamRef = useRef<HTMLDivElement>(null); // Ref for AI conversation stream
  const prevSelectedDateRef = useRef<Date | null>(null);
  const SEARCH_BAR_HEIGHT_OFFSET = 60; // Estimated height of fixed GlobalSearchBar and any padding

  // Effect to keep track of the previous selectedDate
  useEffect(() => {
      prevSelectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // --- Handlers for Settings ---
  const handleImportIntervalChange = useCallback((interval: number) => { console.log(interval); }, []);
  const handleBrowserPathsConfigChange = useCallback((config: any) => { console.log(config); }, []);

  // --- Load Data ---
  useEffect(() => {
      Promise.all([
          db.getMemos(), db.getNotebooks(), db.getBookmarks(), db.getHistory(), db.getEvents(), db.getAIConversations()
      ]).then(([m, n, b, h, e, a]) => {
          setMemos(m); setNotebooks(n); setBookmarks(b); setHistory(h); setEvents(e); setAiConversations(a); 
      }).catch(console.error);
  }, []);

  // --- Comprehensive Auto-Scrolling Effect for Memo Stream ---
  useEffect(() => {
    const streamElement = dashboardStreamRef.current;
    if (streamElement && mainView === 'dashboard' && mainStreamViewMode === 'memo') { // Only auto-scroll memo stream when active
      const isScrolledToBottom = streamElement.scrollHeight - streamElement.clientHeight <= streamElement.scrollTop + 1; // +1 for buffer
      
      // Scroll to bottom on initial load, view change to dashboard, new memos if already at bottom, or on date change,
      // but NOT if we are continuing a timestamp, as that means a specific scroll will follow.
      if (
        memos.length === 0 || 
        isScrolledToBottom || 
        (prevSelectedDateRef.current?.toDateString() !== selectedDate.toDateString() && !continueTimestamp)
      ) {
        streamElement.scrollTop = streamElement.scrollHeight;
      }
    }
  }, [memos.length, mainView, selectedDate, continueTimestamp, mainStreamViewMode]);

  // Auto-scrolling effect for AI conversation stream
  useEffect(() => {
    if (aiConversationStreamRef.current && mainStreamViewMode === 'ai_conv') { // Only scroll when AI is active
      aiConversationStreamRef.current.scrollTop = aiConversationStreamRef.current.scrollHeight;
    }
  }, [aiConversations, mainStreamViewMode]);


  useEffect(() => {
    setTasksLoaded(false);
    // Correctly format dateString to avoid timezone issues (YYYY-MM-DD)
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    console.log(`[Frontend] Calling db.getTasks for ${dateString}`);
    db.getTasks(dateString).then(fetchedTasks => {
        console.log(`[Tasks Effect] Fetched tasks for ${dateString}:`, fetchedTasks);
        setTasks(fetchedTasks);
        setTasksLoaded(true);
    }).catch(console.error);
  }, [selectedDate]);

  useEffect(() => {
    console.log('Scroll Effect Triggered. scrollToMemoId:', scrollToMemoId);
    if (scrollToMemoId && mainStreamViewMode === 'memo') { // Only scroll memo stream
      const performScroll = () => {
        const memoElement = document.querySelector(`[data-memo-id="${scrollToMemoId}"]`);
        console.log('Memo Element found:', memoElement);
        if (memoElement && dashboardStreamRef.current) {
          const targetScrollTop = Math.max(0, memoElement.offsetTop - SEARCH_BAR_HEIGHT_OFFSET);
          dashboardStreamRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
          setScrollToMemoId(null); // Reset after scrolling
        }
      };

      // Try immediately, and then again after a short delay in case of async rendering
      performScroll();
      const timer = setTimeout(performScroll, 100); 
      return () => clearTimeout(timer); // Cleanup timeout if component unmounts
    }
  }, [memos, scrollToMemoId, mainStreamViewMode]);

  // Effect to save notebooks whenever the notebooks state changes
  useEffect(() => {
    console.log('[Notebooks Effect] Saving notebooks:', notebooks);
    db.saveNotebooks(notebooks);
  }, [notebooks]);

  // --- Memo Handlers ---
  const addMemo = useCallback(async (type: 'text' | 'image' | 'link', content: string, tags: string[]): Promise<number> => {
    const finalTimestamp = continueTimestamp ? newMemoTimestamp : new Date().toISOString();
    const tempId = Date.now();
    // Only set scrollToMemoId if continueTimestamp is true, otherwise let general auto-scroll handle it
    if (continueTimestamp) {
        setScrollToMemoId(tempId); 
    }
    const newMemo: Memo = { 
        id: tempId, 
        timestamp: finalTimestamp, 
        type, 
        content, 
        tags: [...new Set([...tags, ...(type === 'text' ? (content.match(/#\w+/g) || []).map(t => t.substring(1)) : [])])],
        // linkPreview will be added by updateMemoLinkPreview
    };
    
    setMemos(prev => [...prev, newMemo].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    
    try {
        const realId = await db.createMemo({ timestamp: finalTimestamp, type, content, tags: newMemo.tags });
        setMemos(prev => prev.map(m => m.id === tempId ? { ...m, id: realId } : m));
        if (continueTimestamp) {
            setScrollToMemoId(realId); // Seteamos el ID real para el scroll
        }
        return realId;
    } catch (e) { 
        console.error(e); 
        return tempId; // Return tempId on error
    }

    // setSelectedDate(new Date(finalTimestamp)); // Moved outside if block if needed
  }, [newMemoTimestamp, continueTimestamp]);

  const updateMemo = useCallback((id: number, content: string, tags: string[]) => { 
      setMemos(prev => prev.map(m => m.id === id ? { ...m, content, tags } : m)); 
      db.updateMemo(id, content, tags);
  }, []);

  const updateMemoLinkPreview = useCallback((memoId: number, linkPreview: db.LinkPreviewData) => {
    setMemos(prev => prev.map(m => m.id === memoId ? { ...m, linkPreview } : m));
    // Also update in DB
    db.updateMemoLinkPreview(memoId, linkPreview);
  }, []);

  const deleteMemo = useCallback((id: number) => { 
      setMemos(prev => prev.filter(m => m.id !== id)); 
      db.deleteMemo(id);
  }, []);

  // --- AI Conversation Handlers ---
  const onAddAIConversation = useCallback(async (item: Omit<AIConversationItem, 'id'>) => {
    const tempId = Date.now(); // Using Date.now() for temporary ID for optimistic update
    const newAIConversation: AIConversationItem = { ...item, id: tempId };
    
    setAiConversations(prev => [...prev, newAIConversation].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

    try {
        const savedItem = await db.createAIConversation({ ...item, tags: item.tags || [], model: item.model || '' }); 
        setAiConversations(prev => prev.map(conv => conv.id === tempId ? savedItem : conv));

    } catch (error) {
        console.error("Error saving AI conversation:", error);
        setAiConversations(prev => prev.filter(conv => conv.id !== tempId)); // Remove optimistic update on error
    }
  }, []);

  // --- Other Handlers (Simplified) ---
  const handleOpenImageEditor = useCallback((m: Memo) => setEditingMemo(m), []);
  const handleCloseImageEditor = useCallback(() => setEditingMemo(null), []);
  const handleSaveCroppedImage = useCallback((id: number, content: string) => {
      const original = memos.find(m => m.id === id);
      if (original) {
          updateMemo(id, content, original.tags);
      }
      setEditingMemo(null);
  }, [memos, updateMemo]);

  const addNotebook = useCallback(() => setNotebooks(prev => [{id: Date.now(), timestamp: new Date().toISOString(), title:'Untitled', blocks:[]}, ...prev]), []);
  const updateNotebook = useCallback((id: number, u: Partial<Notebook>) => setNotebooks(prev => prev.map(n => n.id === id ? { ...n, ...u } : n)), []);
  const deleteNotebook = useCallback((id: number) => setNotebooks(prev => prev.filter(n => n.id !== id)), []);
  
  const addBookmark = useCallback((url: string, title: string) => setBookmarks(prev => [...prev, {id:`bm-${Date.now()}`, url, title, description:'', timestamp: new Date().toISOString()}]), []);
  const deleteBookmark = useCallback((id: string) => setBookmarks(prev => prev.filter(b => b.id !== id)), []);

  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    try {
      const realId = await db.createEvent(event);
      setEvents(prev => [...prev, { ...event, id: realId }]);
    } catch (e) { console.error(e); }
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    setEditingEvent(event);
    setSelectedDateForModal(new Date(event.date)); // Set selectedDateForModal to the event's date
    setIsEventModalOpen(true);
  }, []);



  const addTask = useCallback((c: string, q: EisenhowerQuadrant) => {
    setTasks(prev => {
      const newTasks = [...prev, {id:`t-${Date.now()}`, content:c, quadrant:q, completed: false }]; // Initialize completed as false
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log(`[Frontend] addTask called for ${dateString}. Saving tasks:`, newTasks);
      db.saveTasks(dateString, newTasks); // Explicit save
      return newTasks;
    });
  }, [selectedDate]);

  const toggleTaskCompleted = useCallback((id: string) => {
    setTasks(prev => {
      const newTasks = prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log(`[Frontend] toggleTaskCompleted called for ${dateString}. Saving tasks:`, newTasks);
      db.saveTasks(dateString, newTasks); // Explicit save
      return newTasks;
    });
  }, [selectedDate]);

  const updateTask = useCallback((id: string, c: string) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? {...t, content:c}:t);
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log(`[Frontend] updateTask called for ${dateString}. Saving tasks:`, newTasks);
      db.saveTasks(dateString, newTasks); // Explicit save
      return newTasks;
    });
  }, [selectedDate]);
  const moveTask = useCallback((id: string, q: EisenhowerQuadrant) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? {...t, quadrant:q}:t);
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log(`[Frontend] moveTask called for ${dateString}. Saving tasks:`, newTasks);
      db.saveTasks(dateString, newTasks); // Explicit save
      return newTasks;
    });
  }, [selectedDate]);
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const newTasks = prev.filter(t => t.id !== id);
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log(`[Frontend] deleteTask called for ${dateString}. Saving tasks:`, newTasks);
      db.saveTasks(dateString, newTasks); // Explicit save
      return newTasks;
    });
  }, [selectedDate]);

  const handleTagSelect = useCallback((t: string) => setActiveTag(t), []);
  const handleDateSelect = useCallback((d: Date) => setSelectedDate(d), []);

  const filteredMemos = useMemo(() => {
    if (activeTag) return memos.filter(m => m.tags.includes(activeTag));
    return memos.filter(m => isSameDay(new Date(m.timestamp), selectedDate));
  }, [memos, selectedDate, activeTag]);

  const allBookmarksAndHistory = useMemo(() => {
    return [...bookmarks, ...history];
  }, [bookmarks, history]);

  const filteredAIConversations = useMemo(() => {
    return aiConversations.filter(conv => isSameDay(new Date(conv.timestamp), selectedDate));
  }, [aiConversations, selectedDate]);

  const renderMainView = () => {
    console.log('Current mainView:', mainView);
    switch (mainView) {
      case 'dashboard':
        return (
          <div className="main-content-wrapper">
            <aside className="secondary-sidebar">
                <MainStreamToggle mainStreamViewMode={mainStreamViewMode} setMainStreamViewMode={setMainStreamViewMode} />
                <Calendar memos={memos} selectedDate={selectedDate} setSelectedDate={handleDateSelect} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} activeTag={activeTag} />
                <EisenhowerMatrix 
                    tasks={tasks} 
                    onAddTask={addTask} 
                    onUpdateTask={updateTask} 
                    onMoveTask={moveTask} 
                    onDeleteTask={deleteTask}
                    onToggleTaskCompleted={toggleTaskCompleted} // New prop
                />
                <SidebarCalendarWidget 
                    events={events} 
                    onAddEvent={addEvent} 
                    onDayClick={(date) => {console.log('Day clicked:', date); setSelectedDateForModal(date); setIsEventModalOpen(true); setEditingEvent(undefined);}} 
                    onEventClick={handleEventClick}
                />
                <QuickScrollButtons streamRef={dashboardStreamRef} />
            </aside>
            <main className="main-content">
                  <GlobalSearchBar 
                    setMainView={setMainView} 
                    setSelectedDate={setSelectedDate} 
                    setScrollToMemoId={setScrollToMemoId} 
                  />
                  {mainStreamViewMode === 'memo' ? (
                    <>
                      {activeTag && <div className="filter-status"><span>Filtering by: <strong>#{activeTag}</strong></span><button className="clear-filter-button" onClick={() => setActiveTag(null)}>Clear</button></div>}
                      <DashboardStream 
                        ref={dashboardStreamRef}
                        memos={filteredMemos} bookmarks={bookmarks} history={history} 
                        onTagSelect={handleTagSelect} selectedDate={selectedDate} 
                        onUpdateMemo={updateMemo} onDeleteMemo={deleteMemo} onOpenImageEditor={handleOpenImageEditor}
                        onTimestampClick={(time) => { setNewMemoTimestamp(time); setContinueTimestamp(true); }}
                      />
                      <MemoInput 
                        onAddMemo={addMemo} 
                        timestamp={newMemoTimestamp} 
                        onTimestampChange={setNewMemoTimestamp}
                        continueTimestamp={continueTimestamp}
                        onContinueTimestampChange={setContinueTimestamp}
                        onUpdateMemoLinkPreview={updateMemoLinkPreview}
                      />
                    </>
                  ) : (
                    <>
                      <AIConversationStream 
                        ref={aiConversationStreamRef} 
                        aiConversations={filteredAIConversations} 
                        bookmarks={bookmarks} 
                        history={history} 
                        selectedDate={selectedDate} // Pass selectedDate
                      />
                      <AIInput 
                        onAddAIConversation={onAddAIConversation} 
                        timestamp={newMemoTimestamp}
                        onTimestampChange={setNewMemoTimestamp}
                        continueTimestamp={continueTimestamp}
                        onContinueTimestampChange={setContinueTimestamp}
                      />
                    </>
                  )}
            </main>
          </div>
        );
      case 'gallery': return <GalleryView memos={memos} onImageSelect={d => { setSelectedDate(d); setMainView('dashboard'); }} />;
      case 'notebooks': return <NotebookView notebooks={notebooks} onAddNotebook={addNotebook} onUpdateNotebook={updateNotebook} onDeleteNotebook={deleteNotebook} />;
      case 'bookmarks': return <BookmarkView allBookmarksAndHistory={allBookmarksAndHistory} onAddBookmark={addBookmark} onDeleteBookmark={deleteBookmark} />;
      case 'ai-notes': return <AiNotesView onAddMemo={addMemo} />;
      case 'toolbox': return <ToolboxView />;
      case 'full-calendar': return (
        <main className="main-content">
          <FullCalendarPage events={events} onAddEvent={addEvent} onEventClick={handleEventClick} />
        </main>
      );
      case 'knowledge-graph': return (
        <main className="main-content">
          <KnowledgeGraphView />
        </main>
      );
      default: return null;
    }
  };

  return (
    <>
      <IconSidebar mainView={mainView} setMainView={setMainView} />
      {renderMainView()}
      {editingMemo && <ImageEditorModal memo={editingMemo} onSave={handleSaveCroppedImage} onClose={handleCloseImageEditor} />}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setEditingEvent(undefined); }}
        onSave={addEvent}
        initialEvent={editingEvent}
        selectedDate={selectedDateForModal}
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        importInterval={30} 
        onImportIntervalChange={handleImportIntervalChange} 
        browserPathsConfig={{}} 
        onBrowserPathsConfigChange={handleBrowserPathsConfigChange} 
      />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);