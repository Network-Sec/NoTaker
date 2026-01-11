import { Event } from '../types';

export interface CalendarEvent extends Omit<Event, 'id'> {
    id: string | number; // Can be string for external events
    sourceId: string;
    sourceName: string;
    color: string;
    isExternal: boolean;
    allDay?: boolean;
    endDate?: string;
    location?: string;
}

export interface CalendarSource {
    id: number;
    url: string;
    name: string;
    color: string;
    type: string;
}

export const fetchUnifiedEvents = async (): Promise<CalendarEvent[]> => {
    try {
        const response = await fetch('/api/calendar/unified-events');
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching unified events:", error);
        return [];
    }
};

export const fetchCalendarSources = async (): Promise<CalendarSource[]> => {
    try {
        const response = await fetch('/api/calendar/sources');
        if (!response.ok) throw new Error('Failed to fetch sources');
        return await response.json();
    } catch (error) {
        console.error("Error fetching sources:", error);
        return [];
    }
};

export const addCalendarSource = async (source: Omit<CalendarSource, 'id'>): Promise<CalendarSource | null> => {
    try {
        const response = await fetch('/api/calendar/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(source)
        });
        if (!response.ok) throw new Error('Failed to add source');
        return await response.json();
    } catch (error) {
        console.error("Error adding source:", error);
        return null;
    }
};

export const deleteCalendarSource = async (id: number): Promise<boolean> => {
    try {
        const response = await fetch(`/api/calendar/sources/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error("Error deleting source:", error);
        return false;
    }
};
