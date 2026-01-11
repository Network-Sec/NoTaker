import type { Memo, Notebook, Bookmark, Task, BrowserHistoryEntry, Event, Identity, SharedCredentialGroup, AIConversationItem, SettingsConfig, LinkPreviewData } from '../types';
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
        return Date.now(); 
    }
};

export const updateMemo = async (id: number, content: string, tags: string[], timestamp?: string): Promise<void> => {
    try {
        const body: { content: string; tags: string[]; timestamp?: string } = { content, tags };
        if (timestamp) body.timestamp = timestamp;

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
        const response = await fetch(`${API_URL}/api/memos/${id}`, { method: 'DELETE' });
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
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        console.error("Failed to upload image:", error);
        throw error; 
    }
};

// --- Bookmarks & History ---
export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const response = await fetch(`${API_URL}/api/bookmarks`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

export const getHistory = async (): Promise<BrowserHistoryEntry[]> => {
    try {
        const response = await fetch(`${API_URL}/api/history`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

// --- Notebooks (API) ---
export const getNotebooks = async (): Promise<Notebook[] | null> => {
    try {
        const res = await fetch(`${API_URL}/api/notebooks`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error("[db.ts] Failed to fetch notebooks:", error);
        return null; 
    }
};

export const saveNotebooks = async (notebooks: Notebook[]): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/notebooks`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notebooks)
        });
        if (!response.ok) throw new Error(await response.text());
    } catch (error) {
        console.error("[db.ts] Failed to save notebooks:", error);
    }
};

// --- Tasks ---
export const getTasks = async (date: string): Promise<Task[]> => {
    try {
        const res = await fetch(`${API_URL}/api/tasks?date=${date}`);
        return res.ok ? await res.json() : [];
    } catch (error) { return []; }
};

export const saveTasks = async (date: string, tasks: Task[]): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, tasks })
        });
    } catch (error) { console.error("Failed to save tasks:", error); }
};

export const deleteTask = async (date: string, taskId: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/tasks/${taskId}?date=${date}`, {
            method: 'DELETE',
        });
    } catch (error) { console.error("Failed to delete task:", error); }
};

// --- Events ---
export const getEvents = async (): Promise<Event[]> => {
    try {
        const response = await fetch(`${API_URL}/api/events`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<number> => {
    try {
        const response = await fetch(`${API_URL}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        return data.id;
    } catch (error) { return Date.now(); }
};

// --- Utils ---
export const getLinkPreview = async (url: string): Promise<LinkPreviewData | null> => {
    try {
        const response = await fetch(`${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`);
        return response.ok ? await response.json() : null;
    } catch (error) { return null; }
};

export const updateMemoLinkPreview = async (id: number, linkPreview: LinkPreviewData): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/memos/${id}/link-preview`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkPreview })
        });
    } catch (error) {}
};

// --- AI ---
export const getAIConversations = async (): Promise<AIConversationItem[]> => {
    try {
        const response = await fetch(`${API_URL}/api/ai/conversations`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

export const createAIConversation = async (conversation: Omit<AIConversationItem, 'id'>): Promise<AIConversationItem> => {
    const response = await fetch(`${API_URL}/api/ai/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation)
    });
    if (!response.ok) throw new Error('Failed');
    return await response.json();
};

// --- Settings ---
export const getSettings = async (): Promise<SettingsConfig | null> => {
    try {
        const response = await fetch(`${API_URL}/api/settings`);
        return response.ok ? await response.json() : null;
    } catch (error) { return null; }
};

export const saveSettings = async (settings: SettingsConfig): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    } catch (error) {}
};

// --- Identities ---
export const getIdentities = async (): Promise<Identity[]> => {
    try {
        const response = await fetch(`${API_URL}/api/identities`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn("Failed to fetch identities (Backend might be offline or busy):", error);
        return [];
    }
};

export const createIdentity = async (identity: Omit<Identity, 'id'>): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/api/identities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(identity)
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        return data.id;
    } catch (error) { return `local_${Date.now()}`; }
};

export const updateIdentity = async (identity: Identity): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/identities/${identity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(identity)
        });
    } catch (error) { console.error("Update Identity Failed", error); }
};

export const deleteIdentity = async (id: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/identities/${id}`, { method: 'DELETE' });
    } catch (error) { console.error("Delete Identity Failed", error); }
};

// --- Credential Groups ---
export const getCredentialGroups = async (): Promise<SharedCredentialGroup[]> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

export const createCredentialGroup = async (group: Omit<SharedCredentialGroup, 'id'>): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        });
        const data = await response.json();
        return data.id;
    } catch (error) { return `group_${Date.now()}`; }
};

export const updateCredentialGroup = async (group: SharedCredentialGroup): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/credential-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        });
    } catch (error) {}
};

export const deleteCredentialGroup = async (id: string): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/credential-groups/${id}`, { method: 'DELETE' });
    } catch (error) {}
};

// --- Toolbox ---
export const getToolboxItems = async (): Promise<ToolboxItem[]> => {
    try {
        const response = await fetch(`${API_URL}/api/toolbox`);
        return response.ok ? await response.json() : [];
    } catch (error) { return []; }
};

export const createToolboxItem = async (item: { url: string; title?: string; description?: string }): Promise<ToolboxItem> => {
    const response = await fetch(`${API_URL}/api/toolbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed');
    return await response.json();
};

export const deleteToolboxItem = async (id: number): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/toolbox/${id}`, { method: 'DELETE' });
    } catch (error) {}
};

export const updateToolboxItem = async (id: number, item: Partial<ToolboxItem>): Promise<void> => {
    try {
        await fetch(`${API_URL}/api/toolbox/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
    } catch (error) {}
};