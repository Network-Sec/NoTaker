import type { Memo, Notebook, Bookmark, Task, BrowserHistoryEntry, Event, Identity, SharedCredentialGroup } from '../types';
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

// --- Notebooks (API) ---
export const getNotebooks = async (): Promise<Notebook[]> => {
    console.log("[db.ts] getNotebooks: Fetching notebooks from API...");
    try {
        const url = `${API_URL}/api/notebooks`;
        console.log(`[db.ts] getNotebooks: API URL: ${url}`);
        const res = await fetch(url);
        console.log(`[db.ts] getNotebooks: API response status: ${res.status}, ok: ${res.ok}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[db.ts] getNotebooks: API response not OK. Status: ${res.status}, Body: ${errorText}`);
            throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
        }
        const notebooks = await res.json();
        console.log("[db.ts] getNotebooks: Successfully fetched notebooks:", notebooks);
        return notebooks;
    } catch (error) {
        console.error("[db.ts] getNotebooks: Failed to fetch notebooks:", error);
        return []; // Return empty array on error, as per existing pattern for get functions
    }
};

export const saveNotebooks = async (notebooks: Notebook[]): Promise<void> => {
    console.log("[db.ts] saveNotebooks called. Notebooks data:", notebooks);
    try {
        const response = await fetch(`${API_URL}/api/notebooks`, {
            method: 'PUT',
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
        console.error("[db.ts] Failed to save notebooks to API:", error); // Log but rethrow or handle in UI
        throw error; // Re-throw to be handled by the caller
    }
};

// --- Tasks ---
export const getTasks = async (date: string): Promise<Task[]> => {
    try {
        const res = await fetch(`${API_URL}/api/tasks?date=${date}`);
        if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return []; // Return empty array on error
    }
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
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save tasks: ${errorText}`);
        }
        console.log(`[db.ts] Tasks successfully saved for date: ${date}.`);
    } catch (error) {
        console.error(`[db.ts] Failed to save tasks to API for date: ${date}:`, error);
        throw error; // Re-throw to be handled by the caller
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

// --- Settings (API) ---
import type { SettingsConfig } from '../types'; // Assuming SettingsConfig is defined here or imported

export const getSettings = async (): Promise<SettingsConfig | null> => {
    try {
        console.log("[db.ts] Fetching settings from API...");
        const response = await fetch(`${API_URL}/api/settings`);
        if (!response.ok) {
            if (response.status === 404) { // No settings found, return null to use defaults
                console.log("[db.ts] No settings found on server (404).");
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const settings = await response.json();
        console.log("[db.ts] Fetched settings:", settings);
        return settings;
    } catch (error) {
        console.error("[db.ts] Failed to fetch settings:", error);
        return null; // Return null on error to use defaults in frontend
    }
};

export const saveSettings = async (settings: SettingsConfig): Promise<void> => {
    try {
        console.log("[db.ts] Saving settings to API:", settings);
        const response = await fetch(`${API_URL}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save settings: ${errorText}`);
        }
        console.log("[db.ts] Settings successfully saved to API.");
    } catch (error) {
        console.error("[db.ts] Failed to save settings:", error);
    }
};

// --- Identities (API) ---

export const getIdentities = async (): Promise<Identity[]> => {
    try {
        const response = await fetch(`${API_URL}/api/identities`);
        if (!response.ok) {
            console.warn("Backend not ready, returning empty array");
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch identities:", error);
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
        if (!response.ok) throw new Error('Failed to create identity');
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Failed to create identity:", error);
        return `local_${Date.now()}`;
    }
};

export const updateIdentity = async (identity: Identity): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/identities/${identity.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(identity)
        });
        if (!response.ok) throw new Error('Failed to update identity');
    } catch (error) {
        console.error("Failed to update identity:", error);
    }
};

export const deleteIdentity = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/identities/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete identity');
    } catch (error) {
        console.error("Failed to delete identity:", error);
    }
};

// --- Credential Groups / Vaults (API) ---

export const getCredentialGroups = async (): Promise<SharedCredentialGroup[]> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch credential groups:", error);
        return [];
    }
};

export const createCredentialGroup = async (group: Omit<SharedCredentialGroup, 'id'>): Promise<string> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        });
        if (!response.ok) throw new Error('Failed to create credential group');
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Failed to create credential group:", error);
        return `group_${Date.now()}`;
    }
};

export const updateCredentialGroup = async (group: SharedCredentialGroup): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        });
        if (!response.ok) throw new Error('Failed to update credential group');
    } catch (error) {
        console.error("Failed to update credential group:", error);
    }
};

export const deleteCredentialGroup = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/api/credential-groups/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete credential group');
    } catch (error) {
        console.error("Failed to delete credential group:", error);
    }
};