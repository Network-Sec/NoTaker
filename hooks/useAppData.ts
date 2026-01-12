import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';
import type { Memo, Bookmark, BrowserHistoryEntry, Task, Event, ToolboxItem, AIConversationItem, SettingsConfig, LinkPreviewData } from '../types';

export const useAppData = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [history, setHistory] = useState<BrowserHistoryEntry[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [toolboxItems, setToolboxItems] = useState<ToolboxItem[]>([]);
    const [aiConversations, setAiConversations] = useState<AIConversationItem[]>([]);
    const [appSettings, setAppSettings] = useState<SettingsConfig>({
        firefox: {}, chrome: {}, ai: {}, general: { importInterval: 30 }, generic: {}
    });
    
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    const [tasksLoaded, setTasksLoaded] = useState(false);

    // --- Data Loading ---
    useEffect(() => {
        let isMounted = true;
        const fetchAll = async () => {
            try {
                const [m, b, h, e, a, s, t] = await Promise.all([
                    db.getMemos(), db.getBookmarks(), db.getHistory(), db.getEvents(), 
                    db.getAIConversations(), db.getSettings(), db.getToolboxItems()
                ]);
                if (isMounted) {
                    setMemos(m); setBookmarks(b); setHistory(h); setEvents(e);
                    setAiConversations(a); setToolboxItems(t);
                    if (s) setAppSettings(s);
                    setInitialDataLoaded(true);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        fetchAll();
        return () => { isMounted = false; };
    }, []);

    // --- Actions ---
    const addMemo = useCallback(async (type: 'text' | 'image' | 'link', content: string, tags: string[], timestamp: string) => {
        const tempId = Date.now();
        const newMemo: Memo = { id: tempId, timestamp, type, content, tags };
        setMemos(prev => [...prev, newMemo].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        try {
            const id = await db.createMemo({ timestamp, type, content, tags });
            setMemos(prev => prev.map(m => m.id === tempId ? { ...m, id } : m));
            return id;
        } catch (e) { console.error(e); return tempId; }
    }, []);

    const updateMemo = useCallback((id: number, content: string, tags: string[]) => {
        setMemos(prev => prev.map(m => m.id === id ? { ...m, content, tags } : m));
        db.updateMemo(id, content, tags);
    }, []);

    const deleteMemo = useCallback((id: number) => {
        setMemos(prev => prev.filter(m => m.id !== id));
        db.deleteMemo(id);
    }, []);

    const onUpdateMemoLinkPreview = useCallback((memoId: number, linkPreview: LinkPreviewData) => {
        setMemos(prev => prev.map(m => m.id === memoId ? { ...m, linkPreview } : m));
        db.updateMemoLinkPreview(memoId, linkPreview);
    }, []);

    const onUpdateAppSettings = useCallback((newConfig: any) => {
        setAppSettings(newConfig);
        db.saveSettings(newConfig);
    }, []);

    // --- Task Refresh Helper ---
    const refreshTasks = useCallback(async (selectedDate: Date) => {
        setTasksLoaded(false);
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        const fetchedTasks = await db.getTasks(dateString);
        setTasks(fetchedTasks);
        setTasksLoaded(true);
    }, []);

    return {
        memos, setMemos, addMemo, updateMemo, deleteMemo, onUpdateMemoLinkPreview,
        bookmarks, setBookmarks,
        history, setHistory,
        tasks, setTasks,
        events, setEvents,
        toolboxItems, setToolboxItems,
        aiConversations, setAiConversations,
        appSettings, setAppSettings, onUpdateAppSettings,
        initialDataLoaded,
        refreshTasks, tasksLoaded
    };
};