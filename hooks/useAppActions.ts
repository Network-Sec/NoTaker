import { useCallback } from 'react';
import type { Memo, Event, ToolboxItem } from '../types';
import * as db from '../services/db';

export const useAppActions = (
    memos: Memo[],
    setMemos: React.Dispatch<React.SetStateAction<Memo[]>>,
    updateMemo: (id: number, content: string, tags: string[]) => void,
    setEditingMemo: React.Dispatch<React.SetStateAction<Memo | null>>,
    setBookmarks: React.Dispatch<React.SetStateAction<any[]>>,
    setToolboxItems: React.Dispatch<React.SetStateAction<ToolboxItem[]>>,
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
    setEditingEvent: React.Dispatch<React.SetStateAction<Event | undefined>>,
    setIsEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedDateForModal: React.Dispatch<React.SetStateAction<Date>>
) => {

    // --- Image Editor ---
    const handleOpenImageEditor = useCallback((m: Memo) => setEditingMemo(m), [setEditingMemo]);
    const handleCloseImageEditor = useCallback(() => setEditingMemo(null), [setEditingMemo]);
    
    const handleSaveCroppedImage = useCallback((id: number, content: string) => {
        const original = memos.find(m => m.id === id);
        if (original) {
            updateMemo(id, content, original.tags);
        }
        setEditingMemo(null);
    }, [memos, updateMemo, setEditingMemo]);

    // --- Bookmarks ---
    const addBookmark = useCallback((url: string, title: string) => {
        setBookmarks(prev => [...prev, {id:`bm-${Date.now()}`, url, title, description:'', timestamp: new Date().toISOString()}]);
    }, [setBookmarks]);

    const deleteBookmark = useCallback((id: string) => {
        setBookmarks(prev => prev.filter(b => b.id !== id));
    }, [setBookmarks]);

    // --- Toolbox ---
    const addToolboxItem = useCallback(async (item: { url: string; title?: string }) => {
        try {
            const newItem = await db.createToolboxItem(item);
            setToolboxItems(prev => [newItem, ...prev]);
        } catch (e) {
            console.error("Error in addToolboxItem:", e);
        }  
    }, [setToolboxItems]);
  
    const deleteToolboxItem = useCallback(async (id: number) => {
        setToolboxItems(prev => prev.filter(i => i.id !== id));
        await db.deleteToolboxItem(id);
    }, [setToolboxItems]);
  
    const updateToolboxItem = useCallback(async (item: ToolboxItem) => {
        try {
            await db.updateToolboxItem(item.id, item);
            setToolboxItems(prev => prev.map(i => i.id === item.id ? item : i));
        } catch (e) { console.error(e); }
    }, [setToolboxItems]);

    // --- Events ---
    const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
        try {
            const realId = await db.createEvent(event);
            setEvents(prev => [...prev, { ...event, id: realId }]);
        } catch (e) { console.error(e); }
    }, [setEvents]);
    
    const handleEventClick = useCallback((event: Event) => {
        setEditingEvent(event);
        setSelectedDateForModal(new Date(event.date));
        setIsEventModalOpen(true);
    }, [setEditingEvent, setSelectedDateForModal, setIsEventModalOpen]);

    return {
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
    };
};
