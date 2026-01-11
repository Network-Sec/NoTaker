import './style.css'; // This must be the very first import

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { MainView, Memo, Bookmark, Notebook, Task, EisenhowerQuadrant, BrowserHistoryEntry, LinkPreviewData, ToolboxItem } from './types';
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
import SettingsView from './components/SettingsView'; // Changed from { SettingsView }
import { SidebarCalendarWidget } from './components/SidebarCalendarWidget';
import { EventModal } from './components/EventModal';
import { MonthlyCalendar as FullCalendarPage } from './components/MonthlyCalendar';
import KnowledgeGraphView from './components/KnowledgeGraphView'; // New
import GlobalSearchBar from './components/GlobalSearchBar'; // New
import QuickScrollButtons from './components/QuickScrollButtons'; // New
import { AIConversationStream } from './components/AIConversationStream'; // New AI Stream Component
import { AIInput } from './components/AIInput'; // New AI Input Component
import { IdentityOverview } from './components/IdentityOverview'; // New IdentityOverview Component
import type { AIConversationItem } from './types'; // Import AI Conversation Item Type
import { DailyCounterFullView } from './components/DailyCounterFullView'; // Import DailyCounterFullView
import { DailyCounterSidebarWidget } from './components/DailyCounterSidebarWidget'; // Import DailyCounterSidebarWidget

const SEARCH_BAR_HEIGHT_OFFSET = 100; // Define this constant once at the module level

const App = () => {
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [mainStreamViewMode, setMainStreamViewMode] = useState<'memo' | 'ai_conv'>('memo'); // Controls Memo/AI switch in main content

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [memos, setMemos] = useState<Memo[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<BrowserHistoryEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [toolboxItems, setToolboxItems] = useState<ToolboxItem[]>([]);
  const [aiConversations, setAiConversations] = useState<AIConversationItem[]>([]); // New AI Conversations state
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  // const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // REMOVED
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false); // New state for initial data load
  const [newMemoTimestamp, setNewMemoTimestamp] = useState<string>(new Date().toISOString());
  const [continueTimestamp, setContinueTimestamp] = useState(false);
  const [scrollToMemoId, setScrollToMemoId] = useState<number | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const dashboardStreamRef = useRef<HTMLDivElement>(null);
  const aiConversationStreamRef = useRef<HTMLDivElement>(null); // Ref for AI conversation stream
  const prevSelectedDateRef = useRef<Date>(selectedDate);
  const prevMainStreamViewModeRef = useRef<string>(mainStreamViewMode);
  const prevMemosLength = useRef(0); // Add this ref
  const initialScrollDoneRef = useRef(false); // New ref for initial scroll
  
  // New state for consolidated app settings
  const [appSettings, setAppSettings] = useState<any>({
    firefox: {},
    chrome: {},
    ai: {},
    general: { importInterval: 30, darkMode: false, autoScroll: true },
    generic: {}
  });

  // Consolidated handler for all settings changes
  const onUpdateAppSettings = useCallback((newConfig: any) => {
    setAppSettings(newConfig);
    // TODO: Persist newConfig to DB
  }, []);

  // --- Task Refresh Helper ---
  const refreshTasks = useCallback(async () => {
    setTasksLoaded(false);
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const fetchedTasks = await db.getTasks(dateString);
    setTasks(fetchedTasks);
    setTasksLoaded(true);
  }, [selectedDate]);

  // --- Handlers for Settings --- (REMOVED: handleImportIntervalChange, handleBrowserPathsConfigChange)
  // const handleImportIntervalChange = useCallback((interval: number) => { console.log(interval); }, []);
  // const handleBrowserPathsConfigChange = useCallback((config: any) => { console.log(config); }, []);

  // --- Load Data with Retry & Polling ---
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const fetchAllData = async () => {
        try {
            const [m, b, h, e, a, s, t] = await Promise.all([
                db.getMemos(), 
                db.getBookmarks(), 
                db.getHistory(), 
                db.getEvents(), 
                db.getAIConversations(), 
                db.getSettings(), 
                db.getToolboxItems() 
            ]);

            if (isMounted) {
                setMemos(m); 
                setBookmarks(b); 
                setHistory(h); 
                setEvents(e); 
                setAiConversations(a); 
                setAppSettings(s || { 
                  firefox: {}, chrome: {}, ai: {}, general: { importInterval: 30, darkMode: false, autoScroll: true }, generic: {}
                });
                setToolboxItems(t || []);
                setInitialDataLoaded(true);
                sessionStorage.setItem('initialLoadDone', 'true');
                
                // Reset retry count on success
                retryCount = 0;
            }
            return true;
        } catch (error) {
            console.warn("[Frontend] Backend not ready, retrying...", error);
            return false;
        }
    };

    const attemptLoad = async () => {
        const success = await fetchAllData();
        if (!success && isMounted && retryCount < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000);
            retryCount++;
            setTimeout(attemptLoad, delay);
        }
    };

    // Initial Load
    attemptLoad();

    // Polling for updates (every 60s) to keep history/memos fresh without reload
    const pollInterval = setInterval(() => {
        if (initialDataLoaded) {
            db.getHistory().then(h => { if(isMounted) setHistory(h); }).catch(console.error);
            db.getMemos().then(m => { if(isMounted) setMemos(m); }).catch(console.error);
        }
    }, 60000);

    return () => { 
        isMounted = false; 
        clearInterval(pollInterval);
    };
  }, []);

  // Effect to save appSettings whenever they change
  useEffect(() => {
    db.saveSettings(appSettings);
  }, [appSettings]);

  // --- Comprehensive Auto-Scrolling Effect for Memo Stream ---
  useEffect(() => {
    const streamElement = dashboardStreamRef.current;
    
    // Only proceed if we are in the dashboard memo view
    if (streamElement && mainView === 'dashboard' && mainStreamViewMode === 'memo') {
      const isScrolledToBottom = streamElement.scrollHeight - streamElement.clientHeight <= streamElement.scrollTop + 50; // Tolerance of 50px
      
      // Determine triggers
      const isInitialLoadScroll = initialDataLoaded && !initialScrollDoneRef.current;
      const isDateChange = !isSameDay(prevSelectedDateRef.current, selectedDate) && !continueTimestamp;
      const isViewChange = prevMainStreamViewModeRef.current !== mainStreamViewMode;
      const hasNewMemosAndUserAtBottom = memos.length > prevMemosLength.current && isScrolledToBottom;

      if (isInitialLoadScroll || isDateChange || isViewChange || hasNewMemosAndUserAtBottom) {
        setTimeout(() => {
            if (streamElement) {
                streamElement.scrollTop = streamElement.scrollHeight;
            }
        }, 50); // Small delay to allow DOM paint
        
        if (isInitialLoadScroll) {
            initialScrollDoneRef.current = true;
        }
      }
      
      // Update refs for next run
      prevMemosLength.current = memos.length;
      prevSelectedDateRef.current = selectedDate;
      prevMainStreamViewModeRef.current = mainStreamViewMode;

    } else {
        // Even if not scrolling, keep refs updated to prevent stale comparisons when switching back
        prevMemosLength.current = memos.length;
        prevSelectedDateRef.current = selectedDate;
        prevMainStreamViewModeRef.current = mainStreamViewMode;
    }
  }, [memos, mainView, selectedDate, continueTimestamp, mainStreamViewMode, initialDataLoaded]);

  // Auto-scrolling effect for AI conversation stream
  useEffect(() => {
    if (aiConversationStreamRef.current && mainStreamViewMode === 'ai_conv') { // Only scroll when AI is active
      aiConversationStreamRef.current.scrollTop = aiConversationStreamRef.current.scrollHeight;
    }
  }, [aiConversations, mainStreamViewMode]);


  useEffect(() => {
    refreshTasks();
  }, [selectedDate, refreshTasks]);

  useEffect(() => {
    if (scrollToMemoId && mainStreamViewMode === 'memo') { // Only scroll memo stream
      const performScroll = () => {
        const memoElement = document.querySelector(`[data-memo-id="${scrollToMemoId}"]`);
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
  
  const addBookmark = useCallback((url: string, title: string) => setBookmarks(prev => [...prev, {id:`bm-${Date.now()}`, url, title, description:'', timestamp: new Date().toISOString()}]), []);
  const deleteBookmark = useCallback((id: string) => setBookmarks(prev => prev.filter(b => b.id !== id)), []);
  
  const addToolboxItem = useCallback(async (item: { url: string; title?: string }) => {
      try {
          const newItem = await db.createToolboxItem(item);
                    setToolboxItems(prev => [newItem, ...prev]);
                } catch (e) {
                    console.error("Error in addToolboxItem:", e); 
                    throw e; // Re-throw the error so MemoItem can catch it
                }  }, []);

  const deleteToolboxItem = useCallback(async (id: number) => {
      if(window.confirm('Are you sure you want to delete this tool?')) {
          setToolboxItems(prev => prev.filter(i => i.id !== id));
          await db.deleteToolboxItem(id);
      }
  }, []);

  const updateToolboxItem = useCallback(async (item: ToolboxItem) => {
      try {
          await db.updateToolboxItem(item.id, item);
          setToolboxItems(prev => prev.map(i => i.id === item.id ? item : i));
      } catch (e) {
          console.error(e);
      }
  }, []);

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



  const addTask = useCallback(async (c: string, q: EisenhowerQuadrant) => { // Made async
    const dateString = selectedDate.toISOString().split('T')[0];
    // Create new task, ensuring date property is set for filtering
    const newTasks = [...tasks, {id:`t-${Date.now()}`, content:c, quadrant:q, completed: false, date: dateString }]; 
    await db.saveTasks(dateString, newTasks);
    refreshTasks(); // Refresh after save
  }, [selectedDate, tasks, refreshTasks]); // Added tasks and refreshTasks to dependencies

  const toggleTaskCompleted = useCallback(async (id: string) => { // Made async
    const dateString = selectedDate.toISOString().split('T')[0];
    // Use the current 'tasks' state from closure, which is the latest fetched list
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await db.saveTasks(dateString, newTasks);
    refreshTasks(); // Refresh after save
  }, [selectedDate, tasks, refreshTasks]); // Added tasks and refreshTasks to dependencies

  const updateTask = useCallback(async (updatedTask: Task) => { // Made async
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await db.saveTasks(dateString, newTasks);
    refreshTasks(); // Refresh after save
  }, [selectedDate, tasks, refreshTasks]); // Added tasks and refreshTasks to dependencies
  const moveTask = useCallback(async (updatedTask: Task) => { // Made async
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await db.saveTasks(dateString, newTasks);
    refreshTasks(); // Refresh after save
  }, [selectedDate, tasks, refreshTasks]); // Added tasks and refreshTasks to dependencies
  const deleteTask = useCallback(async (id: string) => { // Made async
    const dateString = selectedDate.toISOString().split('T')[0];
    // Use current 'tasks' state, which is the latest fetched list
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, deletedOn: dateString } : t
    );
    await db.saveTasks(dateString, newTasks); // Save with deletedOn
    refreshTasks(); // Refresh after save
  }, [selectedDate, tasks, refreshTasks]); // Added tasks and refreshTasks to dependencies

  const handleTagSelect = useCallback((t: string) => setActiveTag(t), []);
  const handleDateSelect = useCallback((d: Date) => setSelectedDate(d), []);

  const allBookmarksAndHistory = useMemo(() => {
    return [...bookmarks, ...history];
  }, [bookmarks, history]);

  const filteredAIConversations = useMemo(() => {
    return aiConversations.filter(conv => isSameDay(new Date(conv.timestamp), selectedDate));
  }, [aiConversations, selectedDate]);

      const renderMainView = () => {
      switch (mainView) {      case 'dashboard':
        return (
          <div className="main-content-wrapper">
            <aside className="secondary-sidebar">
                <Calendar memos={memos} selectedDate={selectedDate} setSelectedDate={handleDateSelect} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} activeTag={activeTag} />
                <EisenhowerMatrix 
                    tasks={tasks} 
                    onAddTask={addTask} 
                    onUpdateTask={task => updateTask(task)} 
                    onMoveTask={task => moveTask(task)} 
                    onDeleteTask={task => deleteTask(task.id)}
                    onToggleTaskCompleted={toggleTaskCompleted} 
                    selectedDate={selectedDate} 
                />
                <SidebarCalendarWidget 
                    events={events} 
                    onAddEvent={addEvent} 
                    onDayClick={(date) => { setSelectedDateForModal(date); setIsEventModalOpen(true); setEditingEvent(undefined);}} 
                    onEventClick={handleEventClick}
                />
                <QuickScrollButtons streamRef={dashboardStreamRef} />
                <DailyCounterSidebarWidget setMainView={setMainView} />
            </aside>
            <main className="main-content">
                  <GlobalSearchBar 
                    setMainView={setMainView} 
                    setSelectedDate={setSelectedDate} 
                    setScrollToMemoId={setScrollToMemoId}
                    mainStreamViewMode={mainStreamViewMode} // Pass mainStreamViewMode
                    setMainStreamViewMode={setMainStreamViewMode} // Pass setMainStreamViewMode
                  />
                  {mainStreamViewMode === 'memo' ? (
                    <>
                      {activeTag && <div className="filter-status"><span>Filtering by: <strong>#{activeTag}</strong></span><button className="clear-filter-button" onClick={() => setActiveTag(null)}>Clear</button></div>}
                                            <DashboardStream 
                                              ref={dashboardStreamRef}
                                              memos={memos} bookmarks={bookmarks} history={history} 
                                              onTagSelect={handleTagSelect} selectedDate={selectedDate} 
                                              onUpdateMemo={updateMemo} onDeleteMemo={deleteMemo} onOpenImageEditor={handleOpenImageEditor}
                                              onTimestampClick={(time) => { 
                                                setNewMemoTimestamp(time); 
                                                setContinueTimestamp(true); 
                                              }}
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
      case 'notebooks': return <NotebookView />;
      case 'bookmarks': return <BookmarkView allBookmarksAndHistory={allBookmarksAndHistory} onAddBookmark={addBookmark} onDeleteBookmark={deleteBookmark} onAddToToolbox={addToolboxItem} />;
      case 'ai-notes': return <AiNotesView onAddMemo={addMemo} />;
      case 'toolbox': return <ToolboxView key={toolboxItems.length} items={toolboxItems} onDelete={deleteToolboxItem} onEdit={updateToolboxItem} />;
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
      case 'settings': return (
        <main className="main-content">
          <SettingsView config={appSettings} onConfigChange={onUpdateAppSettings} />
        </main>
      );
      case 'identity-overview': return (
        <main className="main-content">
          <IdentityOverview />
        </main>
      );
      case 'daily-counter-full': return (
        <main className="main-content">
          <DailyCounterFullView setMainView={setMainView} />
        </main>
      );
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full"> {/* New flex container */}
      <IconSidebar mainView={mainView} setMainView={setMainView} />
      <main className="flex-grow overflow-hidden"> {/* main tag to take remaining space, overflow-hidden for good measure */}
        {renderMainView()}
      </main>
      {editingMemo && <ImageEditorModal memo={editingMemo} onSave={handleSaveCroppedImage} onClose={handleCloseImageEditor} />}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setEditingEvent(undefined); }}
        onSave={addEvent}
        initialEvent={editingEvent}
        selectedDate={selectedDateForModal}
      />
      {/* <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModal(false)} 
        importInterval={30} 
        onImportIntervalChange={handleImportIntervalChange} 
        browserPathsConfig={{}} 
        onBrowserPathsConfigChange={handleBrowserPathsConfigChange} 
      /> */ /* REMOVED */}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);