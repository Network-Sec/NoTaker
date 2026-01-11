import moment from 'moment';

const API_BASE_URL = '/api/daily-counter';

export interface DailyCounterConfig {
    id: number | null;
    name: string;
    startDate: string; // YYYY-MM-DD
    initialVal1: number;
    initialVal2: number;
}

export interface DailyCounterEntry {
    id: number;
    config_id: number;
    date: string; // YYYY-MM-DD
    val1_input: number;
    val2_input: number;
    timestamp: string; // ISO string
    total1?: number; // Calculated total after this entry
    total2?: number; // Calculated total after this entry
}

export interface DailyCounterFullState {
    config: DailyCounterConfig;
    entries: DailyCounterEntry[];
}

export const fetchDailyCounterFullState = async (): Promise<DailyCounterFullState> => {
    try {
        const response = await fetch(`${API_BASE_URL}/full-state`);
        if (!response.ok) {
            throw new Error('Failed to fetch daily counter full state');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching daily counter full state:", error);
        // Return a default state if fetch fails
        return {
            config: { id: null, name: 'Coffee & Milk', startDate: moment().format('YYYY-MM-DD'), initialVal1: 100, initialVal2: 100 },
            entries: []
        };
    }
};

export const saveDailyCounterConfig = async (config: Omit<DailyCounterConfig, 'id'>): Promise<DailyCounterConfig> => {
    try {
        const response = await fetch(`${API_BASE_URL}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (!response.ok) {
            throw new Error('Failed to save daily counter config');
        }
        return await response.json();
    } catch (error) {
        console.error("Error saving daily counter config:", error);
        throw error;
    }
};

export const addDailyCounterEntry = async (entry: Omit<DailyCounterEntry, 'id' | 'timestamp'>): Promise<DailyCounterEntry> => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (!response.ok) {
            throw new Error('Failed to add daily counter entry');
        }
        return await response.json();
    } catch (error) {
        console.error("Error adding daily counter entry:", error);
        throw error;
    }
};

export const updateDailyCounterEntry = async (id: number, entry: Omit<DailyCounterEntry, 'id' | 'config_id'>): Promise<DailyCounterEntry> => {
    try {
        const response = await fetch(`${API_BASE_URL}/entries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (!response.ok) {
            throw new Error('Failed to update daily counter entry');
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating daily counter entry:", error);
        throw error;
    }
};
