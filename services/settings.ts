// settings.ts
import { getServerUrl } from '../utils';
// Use relative path to avoid port mismatch errors (CORS/500s)
const API_BASE_URL = getServerUrl(); 
export type EnvValue = string | string[] | boolean | number;
export type EnvSettings = Record<string, EnvValue>;

interface UpdateResponse {
    message: string;
    updatedSettings: EnvSettings;
}

/**
 * Fetch settings from backend.
 */
export async function getEnvSettings(): Promise<EnvSettings> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/settingsEditor`);
        if (!response.ok) {
            console.warn(`Server returned ${response.status}`);
            return {};
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching environment settings:", error);
        return {};
    }
}

/**
 * Send updates to backend.
 */
export async function updateEnvSettings(updates: EnvSettings): Promise<EnvSettings> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/settingsEditor`, {
            method: 'POST', // Ensure POST is used
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data: UpdateResponse = await response.json();
        
        // CRITICAL FIX: Return only the settings object, ignoring the "message" string
        return data.updatedSettings || {}; 
    } catch (error) {
        console.error("Error updating environment settings:", error);
        throw error;
    }
}