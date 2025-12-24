import type { Memo, Notebook, Bookmark, Task, BrowserHistoryEntry, Event } from '../types';
import { getServerUrl } from '../utils';

const API_URL = getServerUrl();

// --- Memos (API) ---
export const getMemos = async (): Promise<Memo[]> => {
    try {
        const response = await fetch(`${API_URL}/api/memos`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch memos:", error);
        return [];
    }
};

export const createMemo = async (memo: Omit<Memo, 'id'> | (Omit<Memo, 'id'> & { linkPreview?: LinkPreviewData })): Promise<number> => {
    try {
        const response = await fetch(`${API_URL}/api/memos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memo)
        });
        if (!response.ok) throw new Error('Failed to save memo');
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Failed to create memo:", error);
        return Date.now(); // Fallback ID if offline
    }
};

export const updateMemo = async (id: number, content: string, tags: string[], timestamp?: string): Promise<void> => {
    try {
        const body: { content: string; tags: string[]; timestamp?: string } = { content, tags };
        if (timestamp) {
            body.timestamp = timestamp;
        }

        const response = await fetch(`${API_URL}/api/memos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error('Failed to update memo');
    } catch (error) {
        console.error("Failed to update memo:", error);
    }
};

export const deleteMemo = async (id: number): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/memos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete memo');
    } catch (error) {
        console.error("Failed to delete memo:", error);
    }
};

export const uploadImage = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_URL}/api/upload/image`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Image upload failed: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to upload image:", error);
        throw error; // Re-throw to be handled by the caller
    }
};


// --- Bookmarks (API) ---
export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const response = await fetch(`${API_URL}/api/bookmarks`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
        return [];
    }
};

// --- History (API) ---
export const getHistory = async (): Promise<BrowserHistoryEntry[]> => {
    try {
        const response = await fetch(`${API_URL}/api/history`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
};

// --- Notebooks (API or LocalStorage fallback) ---
const KEY_PREFIX = 'memoria-stream-';
function getData<T>(key: string, defaultValue: T): T {
    try {
        const stored = localStorage.getItem(KEY_PREFIX + key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
}
function saveData<T>(key: string, data: T) {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(data));
}

export const getNotebooks = async (): Promise<Notebook[]> => {
    try {
        const res = await fetch(`${API_URL}/api/notebooks`);
        if(res.ok) return await res.json();
    } catch {}
    return getData<Notebook[]>('notebooks', []);
};

export const saveNotebooks = async (notebooks: Notebook[]): Promise<void> => {
    console.log("[db.ts] saveNotebooks called. Notebooks data:", notebooks);
    try {
        const response = await fetch(`${API_URL}/api/notebooks`, {
            method: 'PUT', // or POST, depending on backend's idempotency. PUT implies updating the collection.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notebooks)
        });
        console.log("[db.ts] saveNotebooks API response status:", response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save notebooks to API: ${errorText}`);
        }
        console.log("[db.ts] Notebooks successfully saved to API.");
    } catch (error) {
        console.error("[db.ts] Failed to save notebooks to API, saving to localStorage:", error);
        saveData('notebooks', notebooks);
    }
};

// --- Tasks ---
export const getTasks = async (date: string): Promise<Task[]> => {
    try {
        const res = await fetch(`${API_URL}/api/tasks?date=${date}`);
        if(res.ok) return await res.json();
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
    }
    // Fallback to localStorage if API fails
    return getData<Task[]>(`tasks-${date}`, []);
};

export const saveTasks = async (date: string, tasks: Task[]): Promise<void> => {
    console.log(`[db.ts] saveTasks called for date: ${date}. Tasks:`, tasks);
    console.trace(); // Log the call stack
    try {
        const response = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, tasks })
        });
        if (!response.ok) throw new Error('Failed to save tasks');
        console.log(`[db.ts] Tasks successfully saved for date: ${date}.`);
    } catch (error) {
        console.error(`[db.ts] Failed to save tasks to API for date: ${date}, saving to localStorage:`, error);
        // Fallback to localStorage
        saveData(`tasks-${date}`, tasks);
    }
};

// --- Events (API) ---
export const getEvents = async (): Promise<Event[]> => {
    try {
        console.log("[db.ts] Fetching events from API...");
        const response = await fetch(`${API_URL}/api/events`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const events = await response.json();
        console.log("[db.ts] Fetched events:", events);
        return events;
    } catch (error) {
        console.error("[db.ts] Failed to fetch events:", error);
        return [];
    }
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<number> => {
    try {
        console.log("[db.ts] Creating event via API:", event);
        const response = await fetch(`${API_URL}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create event: ${errorText}`);
        }
        const data = await response.json();
        console.log("[db.ts] Event created, ID:", data.id);
        return data.id;
    } catch (error) {
        console.error("[db.ts] Failed to create event:", error);
        return Date.now(); // Fallback ID if offline
    }
};

// --- Link Previews (API) ---
export interface LinkPreviewData {
    title: string;
    description: string;
    imageUrl?: string;
    faviconUrl?: string;
    url: string;
}

export const getLinkPreview = async (url: string): Promise<LinkPreviewData | null> => {
    try {
        const response = await fetch(`${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch link preview: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch link preview:", error);
        return null;
    }
};

export const updateMemoLinkPreview = async (id: number, linkPreview: LinkPreviewData): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/memos/${id}/link-preview`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkPreview })
        });
        if (!response.ok) throw new Error('Failed to update memo link preview');
    } catch (error) {
        console.error("Failed to update memo link preview:", error);
    }
};

// --- AI Conversations (API) ---
import type { AIConversationItem } from '../types';

export const getAIConversations = async (): Promise<AIConversationItem[]> => {
    try {
        const response = await fetch(`${API_URL}/api/ai/conversations`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch AI conversations:", error);
        return [];
    }
};

export const createAIConversation = async (conversation: Omit<AIConversationItem, 'id'>): Promise<AIConversationItem> => {
    try {
        const response = await fetch(`${API_URL}/api/ai/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conversation)
        });
        if (!response.ok) throw new Error('Failed to save AI conversation');
        return await response.json();
    } catch (error) {
        console.error("Failed to create AI conversation:", error);
        throw error; // Re-throw to be handled by the caller
    }
};