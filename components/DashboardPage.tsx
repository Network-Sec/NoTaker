import React, { useRef } from 'react';
import type { Memo, Bookmark, BrowserHistoryEntry, Task, Event, AIConversationItem } from '../types';
import { Calendar } from './Calendar';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { SidebarCalendarWidget } from './SidebarCalendarWidget';
import QuickScrollButtons from './QuickScrollButtons';
import { DailyCounterSidebarWidget } from './DailyCounterSidebarWidget';
import GlobalSearchBar from './GlobalSearchBar';
import { DashboardStream } from './DashboardStream';
import { MemoInput } from './MemoInput';
import { AIConversationStream } from './AIConversationStream';
import { AIInput } from './AIInput';

interface DashboardPageProps {
    // Data
    memos: Memo[];
    bookmarks: Bookmark[];
    history: BrowserHistoryEntry[];
    tasks: Task[];
    events: Event[];
    aiConversations: AIConversationItem[];
    filteredAIConversations: AIConversationItem[];
    
    // Navigation/State
    mainStreamViewMode: 'memo' | 'ai_conv';
    setMainStreamViewMode: (mode: 'memo' | 'ai_conv') => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    activeTag: string | null;
    setActiveTag: (tag: string | null) => void;
    setMainView: (view: any) => void; // Using any to avoid importing MainView type circular dependency if strictly strict, but imported below
    setScrollToMemoId: (id: number | null) => void;
    
    // Input State
    newMemoTimestamp: string;
    setNewMemoTimestamp: (time: string) => void;
    continueTimestamp: boolean;
    setContinueTimestamp: (val: boolean) => void;

    // Actions
    onAddTask: (c: string, q: any) => void;
    onUpdateTask: (t: Task) => void;
    onMoveTask: (t: Task) => void;
    onDeleteTask: (id: string) => void;
    onToggleTaskCompleted: (id: string) => void;
    onAddEvent: (e: any) => void;
    onDayClick: (d: Date) => void;
    onEventClick: (e: Event) => void;
    onUpdateMemo: (id: number, c: string, t: string[]) => void;
    onDeleteMemo: (id: number) => void;
    onOpenImageEditor: (m: Memo) => void;
    onAddMemo: (type: 'text'|'image'|'link', c: string, t: string[]) => Promise<number>;
    onUpdateMemoLinkPreview: (id: number, data: any) => void;
    onAddAIConversation: (item: any) => void;
    onAddToToolbox: (item: { url: string; title: string }) => void;

    // Refs
    dashboardStreamRef: React.RefObject<HTMLDivElement>;
    aiConversationStreamRef: React.RefObject<HTMLDivElement>;
}

export const DashboardPage = ({
    memos, bookmarks, history, tasks, events, aiConversations, filteredAIConversations,
    mainStreamViewMode, setMainStreamViewMode, selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth, activeTag, setActiveTag, setMainView, setScrollToMemoId,
    newMemoTimestamp, setNewMemoTimestamp, continueTimestamp, setContinueTimestamp,
    onAddTask, onUpdateTask, onMoveTask, onDeleteTask, onToggleTaskCompleted,
    onAddEvent, onDayClick, onEventClick,
    onUpdateMemo, onDeleteMemo, onOpenImageEditor, onAddMemo, onUpdateMemoLinkPreview,
    onAddAIConversation, onAddToToolbox,
    dashboardStreamRef, aiConversationStreamRef
}: DashboardPageProps) => {

    return (
        <div className="main-content-wrapper">
            <aside className="secondary-sidebar">
                <Calendar 
                    memos={memos} 
                    selectedDate={selectedDate} 
                    setSelectedDate={setSelectedDate} 
                    currentMonth={currentMonth} 
                    setCurrentMonth={setCurrentMonth} 
                    activeTag={activeTag} 
                />
                <EisenhowerMatrix 
                    tasks={tasks} 
                    onAddTask={onAddTask} 
                    onUpdateTask={onUpdateTask} 
                    onMoveTask={onMoveTask} 
                    onDeleteTask={onDeleteTask} 
                    onToggleTaskCompleted={onToggleTaskCompleted} 
                    selectedDate={selectedDate} 
                />
                <SidebarCalendarWidget 
                    events={events} 
                    onAddEvent={onAddEvent} 
                    onDayClick={onDayClick} 
                    onEventClick={onEventClick}
                />
                <QuickScrollButtons streamRef={dashboardStreamRef} />
                <DailyCounterSidebarWidget setMainView={setMainView} />
            </aside>
            <main className="main-content">
                  <GlobalSearchBar 
                    setMainView={setMainView} 
                    setSelectedDate={setSelectedDate} 
                    setScrollToMemoId={setScrollToMemoId}
                    mainStreamViewMode={mainStreamViewMode} 
                    setMainStreamViewMode={setMainStreamViewMode} 
                  />
                  {mainStreamViewMode === 'memo' ? (
                    <>
                      {activeTag && (
                          <div className="filter-status">
                              <span>Filtering by: <strong>#{activeTag}</strong></span>
                              <button className="clear-filter-button" onClick={() => setActiveTag(null)}>Clear</button>
                          </div>
                      )}
                      <DashboardStream 
                        ref={dashboardStreamRef}
                        memos={memos} bookmarks={bookmarks} history={history} 
                        onTagSelect={setActiveTag} selectedDate={selectedDate} 
                        onUpdateMemo={onUpdateMemo} onDeleteMemo={onDeleteMemo} onOpenImageEditor={onOpenImageEditor}
                        onTimestampClick={(time) => { 
                            setNewMemoTimestamp(time); 
                            setContinueTimestamp(true); 
                        }}
                        onAddToToolbox={onAddToToolbox}
                      />
                      <MemoInput 
                        onAddMemo={onAddMemo} 
                        timestamp={newMemoTimestamp} 
                        onTimestampChange={setNewMemoTimestamp}
                        continueTimestamp={continueTimestamp} 
                        onContinueTimestampChange={setContinueTimestamp}
                        onUpdateMemoLinkPreview={onUpdateMemoLinkPreview}
                      />
                    </>
                  ) : (
                    <>
                      <AIConversationStream 
                        ref={aiConversationStreamRef} 
                        aiConversations={filteredAIConversations} 
                        bookmarks={bookmarks} 
                        history={history} 
                        selectedDate={selectedDate} 
                      />
                      <AIInput 
                        onAddAIConversation={onAddAIConversation} 
                        timestamp={newMemoTimestamp}
                        onTimestampChange={setNewMemoTimestamp}
                        onContinueTimestampChange={setContinueTimestamp}
                        continueTimestamp={continueTimestamp}
                      />
                    </>
                  )}
            </main>
        </div>
    );
};
