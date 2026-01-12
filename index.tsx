import './style.css'; 

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { MainView, Memo, Bookmark, Notebook, Task, EisenhowerQuadrant, BrowserHistoryEntry, LinkPreviewData, ToolboxItem } from './types';
import { isSameDay } from './utils';
import * as db from './services/db';
import { useAppData } from './hooks/useAppData';
import { useNavigationState } from './hooks/useNavigationState';
import { useAppActions } from './hooks/useAppActions';
import { useStreamScrolling } from './hooks/useStreamScrolling';
import { useTaskActions } from './hooks/useTaskActions';

import { IconSidebar } from './components/IconSidebar';
import { ImageEditorModal } from './components/ImageEditorModal';
import { TagsView } from './components/TagsView';
import { GalleryView } from './components/GalleryView';
import { ToolboxView } from './components/ToolboxView';
import { NotebookView } from './components/NotebookView';
import { BookmarkView } from './components/BookmarkView';
import { AiNotesView } from './components/AiNotesView';
import SettingsView from './components/SettingsView';
import { EventModal } from './components/EventModal';
import { MonthlyCalendar as FullCalendarPage } from './components/MonthlyCalendar';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import { IdentityOverview } from './components/IdentityOverview';
import { DailyCounterFullView } from './components/DailyCounterFullView';
import { DashboardPage } from './components/DashboardPage'; // Import the new page component

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

  // 4. Task Actions Hook
  const {
      addTask,
      toggleTaskCompleted,
      updateTask,
      moveTask,
      deleteTask
  } = useTaskActions(tasks, selectedDate, refreshTasks);
  
  // Refs (prev* refs are now inside useStreamScrolling)
  const dashboardStreamRef = useRef<HTMLDivElement>(null);
  const aiConversationStreamRef = useRef<HTMLDivElement>(null);
  
  // --- Loading Spinner Logic ---
  const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(false);

  useEffect(() => {
      const timer = setTimeout(() => {
          setMinLoadTimeElapsed(true);
      }, 2000); // 2 seconds delay
      return () => clearTimeout(timer);
  }, []);

  const showLoadingScreen = !initialDataLoaded || !minLoadTimeElapsed;

  // Refresh tasks when selectedDate changes
  useEffect(() => {
    refreshTasks(selectedDate);
  }, [selectedDate, refreshTasks]);

  // --- Scrolling Logic Hook ---
  useStreamScrolling({
      memos,
      aiConversations,
      mainView,
      mainStreamViewMode,
      selectedDate,
      continueTimestamp,
      scrollToMemoId,
      setScrollToMemoId,
      initialDataLoaded,
      showLoadingScreen,
      minLoadTimeElapsed,
      dashboardStreamRef,
      aiConversationStreamRef
  });

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
  }, [newMemoTimestamp, continueTimestamp, selectedDate, addMemoAction, setScrollToMemoId]);

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

  // Derived state
  const handleTagSelect = useCallback((t: string) => setActiveTag(t), [setActiveTag]);
  const handleDateSelect = useCallback((d: Date) => setSelectedDate(d), [setSelectedDate]);
  
  const allBookmarksAndHistory = useMemo(() => [...bookmarks, ...history], [bookmarks, history]);
  const filteredAIConversations = useMemo(() => aiConversations.filter(conv => isSameDay(new Date(conv.timestamp), selectedDate)), [aiConversations, selectedDate]);

  const renderMainView = () => {
      switch (mainView) {      
        case 'dashboard':
            return (
                <DashboardPage
                    memos={memos} bookmarks={bookmarks} history={history}
                    tasks={tasks} events={events} aiConversations={aiConversations}
                    filteredAIConversations={filteredAIConversations}
                    mainStreamViewMode={mainStreamViewMode} setMainStreamViewMode={setMainStreamViewMode}
                    selectedDate={selectedDate} setSelectedDate={handleDateSelect}
                    currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
                    activeTag={activeTag} setActiveTag={handleTagSelect}
                    setMainView={setMainView} setScrollToMemoId={setScrollToMemoId}
                    newMemoTimestamp={newMemoTimestamp} setNewMemoTimestamp={setNewMemoTimestamp}
                    continueTimestamp={continueTimestamp} setContinueTimestamp={setContinueTimestamp}
                    onAddTask={addTask} onUpdateTask={updateTask} onMoveTask={moveTask}
                    onDeleteTask={deleteTask} onToggleTaskCompleted={toggleTaskCompleted}
                    onAddEvent={addEvent} onDayClick={(date) => { setSelectedDateForModal(date); setIsEventModalOpen(true); setEditingEvent(undefined);}}
                    onEventClick={handleEventClick}
                    onUpdateMemo={updateMemo} onDeleteMemo={deleteMemo} onOpenImageEditor={handleOpenImageEditor}
                    onAddMemo={addMemo} onUpdateMemoLinkPreview={onUpdateMemoLinkPreview}
                    onAddAIConversation={onAddAIConversation} onAddToToolbox={addToolboxItem}
                    dashboardStreamRef={dashboardStreamRef} aiConversationStreamRef={aiConversationStreamRef}
                />
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