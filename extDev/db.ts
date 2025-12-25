import { Identity, SharedCredentialGroup } from './types';
import { getServerUrl } from './utils';

const API_URL = getServerUrl();

// --- Identities (API) ---

export const getIdentities = async (): Promise<Identity[]> => {
    try {
        const response = await fetch(`${API_URL}/api/identities`);
        if (!response.ok) {
            // Fallback for demo if backend not ready
            console.warn("Backend not ready, returning empty array or mock will be used in UI");
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch identities:", error);
        throw error;
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
        // Fallback ID for UI if offline/demo
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
        // Swallow error for demo purposes to allow UI state to update
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
        throw error;
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

// --- Image Upload ---
export const uploadImage = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_URL}/api/upload/image`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            // Fallback for demo: return a local object URL
            console.warn("Image upload failed (backend offline?), using local object URL");
            return { url: URL.createObjectURL(file) };
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to upload image:", error);
        return { url: URL.createObjectURL(file) };
    }
};