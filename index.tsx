import './style.css'; 

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { MainView, Memo, Bookmark, Notebook, Task, EisenhowerQuadrant, BrowserHistoryEntry, LinkPreviewData, ToolboxItem } from './types';
import { isSameDay } from './utils';
import * as db from './services/db';
import { useAppData } from './hooks/useAppData';
import { useNavigationState } from './hooks/useNavigationState';
import { useAppActions } from './hooks/useAppActions';

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
import SettingsView from './components/SettingsView';
import { SidebarCalendarWidget } from './components/SidebarCalendarWidget';
import { EventModal } from './components/EventModal';
import { MonthlyCalendar as FullCalendarPage } from './components/MonthlyCalendar';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import GlobalSearchBar from './components/GlobalSearchBar';
import QuickScrollButtons from './components/QuickScrollButtons';
import { AIConversationStream } from './components/AIConversationStream';
import { AIInput } from './components/AIInput';
import { IdentityOverview } from './components/IdentityOverview';
import { DailyCounterFullView } from './components/DailyCounterFullView';
import { DailyCounterSidebarWidget } from './components/DailyCounterSidebarWidget';

const SEARCH_BAR_HEIGHT_OFFSET = 100;

const App = () => {
  // 1. Data Hook
  const { 
    memos, setMemos, addMemo: addMemoAction, updateMemo, deleteMemo, onUpdateMemoLinkPreview,
    bookmarks, setBookmarks, history, setHistory,
    tasks, setTasks, events, setEvents, toolboxItems, setToolboxItems,
    aiConversations, setAiConversations, appSettings, setAppSettings,
    onUpdateAppSettings, refreshTasks,
    initialDataLoaded, tasksLoaded
  } = useAppData();

  // 2. Navigation & UI State Hook
  const {
    mainView, setMainView,
    mainStreamViewMode, setMainStreamViewMode,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    activeTag, setActiveTag,
    editingMemo, setEditingMemo,
    newMemoTimestamp, setNewMemoTimestamp,
    continueTimestamp, setContinueTimestamp,
    scrollToMemoId, setScrollToMemoId,
    isEventModalOpen, setIsEventModalOpen,
    selectedDateForModal, setSelectedDateForModal,
    editingEvent, setEditingEvent
  } = useNavigationState();
  
  // 3. App Actions Hook
  const {
      handleOpenImageEditor,
      handleCloseImageEditor,
      handleSaveCroppedImage,
      addBookmark,
      deleteBookmark,
      addToolboxItem,
      deleteToolboxItem,
      updateToolboxItem,
      addEvent,
      handleEventClick
  } = useAppActions(
      memos, setMemos, updateMemo, setEditingMemo, setBookmarks, setToolboxItems, setEvents, setEditingEvent, setIsEventModalOpen, setSelectedDateForModal
  );
  
  // Refs
  const dashboardStreamRef = useRef<HTMLDivElement>(null);
  const aiConversationStreamRef = useRef<HTMLDivElement>(null);
  const prevSelectedDateRef = useRef<Date>(selectedDate);
  const prevMainStreamViewModeRef = useRef<string>(mainStreamViewMode);
  const prevMemosLength = useRef(0);
  const initialScrollDoneRef = useRef(false);
  
  // --- Loading Spinner Logic ---
  const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(false);

  useEffect(() => {
      const timer = setTimeout(() => {
          setMinLoadTimeElapsed(true);
      }, 5000); // 5 seconds delay
      return () => clearTimeout(timer);
  }, []);

  const showLoadingScreen = !initialDataLoaded || !minLoadTimeElapsed;

  // Refresh tasks when selectedDate changes
  useEffect(() => {
    refreshTasks(selectedDate);
  }, [selectedDate, refreshTasks]);

  // --- Comprehensive Auto-Scrolling Effect for Memo Stream ---
  useEffect(() => {
    const streamElement = dashboardStreamRef.current;
    
    // Only proceed if we are in the dashboard memo view and NOT loading
    if (!showLoadingScreen && streamElement && mainView === 'dashboard' && mainStreamViewMode === 'memo') {
      const isScrolledToBottom = streamElement.scrollHeight - streamElement.clientHeight <= streamElement.scrollTop + 50; // Tolerance of 50px
      
      // Determine triggers
      const isInitialLoadScroll = initialDataLoaded && minLoadTimeElapsed && !initialScrollDoneRef.current;
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
  }, [memos, mainView, selectedDate, continueTimestamp, mainStreamViewMode, initialDataLoaded, showLoadingScreen, minLoadTimeElapsed]);

  // Auto-scrolling effect for AI conversation stream
  useEffect(() => {
    if (!showLoadingScreen && aiConversationStreamRef.current && mainStreamViewMode === 'ai_conv') { // Only scroll when AI is active
      aiConversationStreamRef.current.scrollTop = aiConversationStreamRef.current.scrollHeight;
    }
  }, [aiConversations, mainStreamViewMode, showLoadingScreen]);

  useEffect(() => {
    if (!showLoadingScreen && scrollToMemoId && mainStreamViewMode === 'memo') { // Only scroll memo stream
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
  }, [memos, scrollToMemoId, mainStreamViewMode, showLoadingScreen]);


  // --- Memo Handlers ---
  const addMemo = useCallback(async (type: 'text' | 'image' | 'link', content: string, tags: string[]): Promise<number> => {
    const getComputedTimestamp = () => {
        if (continueTimestamp) return newMemoTimestamp;
        // Combine selectedDate date with current wall-clock time
        const now = new Date();
        const target = new Date(selectedDate);
        target.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        return target.toISOString();
    };
    const finalTimestamp = getComputedTimestamp();

    const id = await addMemoAction(type, content, tags, finalTimestamp);
    
    if (continueTimestamp) {
        setScrollToMemoId(id); 
    }
    return id;
  }, [newMemoTimestamp, continueTimestamp, selectedDate, addMemoAction]);

  // --- AI Conversation Handlers ---
  const onAddAIConversation = useCallback(async (item: Omit<AIConversationItem, 'id'>) => {
    const tempId = Date.now(); // Using Date.now() for temporary ID for optimistic update
    
    // Optimistic update
    setAiConversations(prev => [...prev, { ...item, id: tempId }].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

    try {
        const savedItem = await db.createAIConversation({ ...item, tags: item.tags || [], model: item.model || '' }); 
        setAiConversations(prev => prev.map(conv => conv.id === tempId ? savedItem : conv));
    } catch (error) {
        console.error("Error saving AI conversation:", error);
        setAiConversations(prev => prev.filter(conv => conv.id !== tempId)); // Remove optimistic update on error
    }
  }, [setAiConversations]);

  // --- Task Handlers (To be refactored in TODO 13) ---
  const addTask = useCallback(async (c: string, q: EisenhowerQuadrant) => { 
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = [...tasks, {id:`t-${Date.now()}`, content:c, quadrant:q, completed: false, date: dateString }]; 
    await db.saveTasks(dateString, newTasks);
    refreshTasks(selectedDate);
  }, [selectedDate, tasks, refreshTasks]);

  const toggleTaskCompleted = useCallback(async (id: string) => { 
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await db.saveTasks(dateString, newTasks);
    refreshTasks(selectedDate);
  }, [selectedDate, tasks, refreshTasks]);

  const updateTask = useCallback(async (updatedTask: Task) => { 
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await db.saveTasks(dateString, newTasks);
    refreshTasks(selectedDate);
  }, [selectedDate, tasks, refreshTasks]);

  const moveTask = useCallback(async (updatedTask: Task) => { 
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    await db.saveTasks(dateString, newTasks);
    refreshTasks(selectedDate);
  }, [selectedDate, tasks, refreshTasks]);

  const deleteTask = useCallback(async (id: string) => { 
    const dateString = selectedDate.toISOString().split('T')[0];
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, deletedOn: dateString } : t
    );
    await db.saveTasks(dateString, newTasks);
    refreshTasks(selectedDate);
  }, [selectedDate, tasks, refreshTasks]);

  // Derived state
  const handleTagSelect = useCallback((t: string) => setActiveTag(t), [setActiveTag]);
  const handleDateSelect = useCallback((d: Date) => setSelectedDate(d), [setSelectedDate]);
  
  const allBookmarksAndHistory = useMemo(() => [...bookmarks, ...history], [bookmarks, history]);
  const filteredAIConversations = useMemo(() => aiConversations.filter(conv => isSameDay(new Date(conv.timestamp), selectedDate)), [aiConversations, selectedDate]);

  const renderMainView = () => {
      switch (mainView) {      case 'dashboard':
        return (
          <div className="main-content-wrapper">
            <aside className="secondary-sidebar">
                <Calendar memos={memos} selectedDate={selectedDate} setSelectedDate={handleDateSelect} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} activeTag={activeTag} />
                <EisenhowerMatrix 
                    tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onMoveTask={moveTask} onDeleteTask={deleteTask} onToggleTaskCompleted={toggleTaskCompleted} selectedDate={selectedDate} 
                />
                <SidebarCalendarWidget 
                    events={events} onAddEvent={addEvent} onDayClick={(date) => { setSelectedDateForModal(date); setIsEventModalOpen(true); setEditingEvent(undefined);}} onEventClick={handleEventClick}
                />
                <QuickScrollButtons streamRef={dashboardStreamRef} />
                <DailyCounterSidebarWidget setMainView={setMainView} />
            </aside>
            <main className="main-content">
                  <GlobalSearchBar 
                    setMainView={setMainView} setSelectedDate={setSelectedDate} setScrollToMemoId={setScrollToMemoId}
                    mainStreamViewMode={mainStreamViewMode} setMainStreamViewMode={setMainStreamViewMode} 
                  />
                  {mainStreamViewMode === 'memo' ? (
                    <>
                      {activeTag && <div className="filter-status"><span>Filtering by: <strong>#{activeTag}</strong></span><button className="clear-filter-button" onClick={() => setActiveTag(null)}>Clear</button></div>}
                      <DashboardStream 
                        ref={dashboardStreamRef}
                        memos={memos} bookmarks={bookmarks} history={history} 
                        onTagSelect={setActiveTag} selectedDate={selectedDate} 
                        onUpdateMemo={updateMemo} onDeleteMemo={deleteMemo} onOpenImageEditor={handleOpenImageEditor}
                        onTimestampClick={(time) => { setNewMemoTimestamp(time); setContinueTimestamp(true); }}
                        onAddToToolbox={addToolboxItem}
                      />
                      <MemoInput 
                        onAddMemo={addMemo} timestamp={newMemoTimestamp} onTimestampChange={setNewMemoTimestamp}
                        continueTimestamp={continueTimestamp} onContinueTimestampChange={setContinueTimestamp}
                        onUpdateMemoLinkPreview={onUpdateMemoLinkPreview}
                      />
                    </>
                  ) : (
                    <>
                      <AIConversationStream 
                        ref={aiConversationStreamRef} aiConversations={filteredAIConversations} bookmarks={bookmarks} history={history} selectedDate={selectedDate} 
                      />
                      <AIInput 
                        onAddAIConversation={onAddAIConversation} timestamp={newMemoTimestamp}
                        onTimestampChange={setNewMemoTimestamp} onContinueTimestampChange={setContinueTimestamp} continueTimestamp={continueTimestamp}
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
      case 'knowledge-graph': return <main className="main-content"><KnowledgeGraphView /></main>;
      case 'settings': return <main className="main-content"><SettingsView config={appSettings} onConfigChange={onUpdateAppSettings} /></main>;
      case 'identity-overview': return <main className="main-content"><IdentityOverview /></main>;
      case 'daily-counter-full': return <main className="main-content"><DailyCounterFullView setMainView={setMainView} /></main>;
      default: return null;
    }
  };

  // Loading Spinner
  if (showLoadingScreen) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#05070a] text-white z-50 fixed top-0 left-0">
        <div className="flex flex-col items-center gap-8">
            <div className="loader">
                <span></span>
                <div className="loader-text">
                    010101<br/>
                    LOADING<br/>
                    101010
                </div>
            </div>
          <h2 className="text-xl font-mono animate-pulse tracking-widest text-techCyan">SYSTEM_INITIALIZING...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full"> 
      <IconSidebar mainView={mainView} setMainView={setMainView} />
      <main className="flex-grow overflow-hidden">
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
    </div>
  );
};

// Singleton Root Logic
let rootInstance: ReactDOM.Root | null = null;
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
if (!rootInstance) { rootInstance = ReactDOM.createRoot(rootElement); }
rootInstance.render(<App />);