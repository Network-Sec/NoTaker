import React, { useState, useEffect, useMemo } from 'react';
import type { Event } from '../types';
import { fetchUnifiedEvents, CalendarEvent } from '../services/calendarService';
import { isSameDay } from '../utils';
import { Globe, RefreshCw } from 'lucide-react';
import '../styles/sidebar_calendar_widget.css';
import { assignTitleBasedColor } from './CalendarLabelsAndColors';

interface SidebarCalendarWidgetProps {
    events: Event[];
    onAddEvent: (event: Omit<Event, 'id'>) => void;
    onDayClick: (date: Date) => void; // Callback to open modal for specific date
    onEventClick: (event: Event) => void; // New callback for clicking an existing event
}

const COLORS = ['#FFD700', '#32CD32', '#FF6347', '#1E90FF']; // Yellow, Green, Red, Blue

const getEventColor = (evt: Event | CalendarEvent) => {
    // If it's a unified event, it might have a color
    if ('color' in evt && evt.color) {
        return evt.color;
    }
    // Fallback to title based color (consistent with big calendar)
    // or ID based if title missing
    if (evt.title) {
        return assignTitleBasedColor(evt as CalendarEvent).color;
    }

    return COLORS[(typeof evt.id === 'number' ? evt.id : 0) % COLORS.length];
};

export const SidebarCalendarWidget = ({ events: localEvents, onAddEvent, onDayClick, onEventClick }: SidebarCalendarWidgetProps) => {
    // Calculate initial currentBlockStart to place today in the first third (e.g., 4th day)
    const initialBlockStart = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() - 3); // Place today as the 4th day (index 3)
        return start;
    }, []);
    const [currentBlockStart, setCurrentBlockStart] = useState(initialBlockStart); // Start of the currently displayed 16-day block
    
    // External Events State
    const [showExternal, setShowExternal] = useState(false);
    const [unifiedEvents, setUnifiedEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate the days of the current 16-day block
    const sixteenDayBlock = useMemo(() => {
        const start = new Date(currentBlockStart);
        const days = [];
        for (let i = 0; i < 16; i++) { // Generate 16 days
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentBlockStart]);

    const today = new Date();

    const loadUnifiedEvents = async () => {
        setIsLoading(true);
        try {
            const data = await fetchUnifiedEvents();
            setUnifiedEvents(data);
        } catch (e) {
            console.error("Failed to load unified events for sidebar", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (showExternal && unifiedEvents.length === 0) {
            loadUnifiedEvents();
        }
    }, [showExternal]);

    // Use unified events if toggle is on, otherwise local events
    const displayEvents = showExternal ? unifiedEvents : localEvents;

    return (
        <div className="sidebar-calendar-widget">
            <div className="flex items-center justify-between mb-2">
                <h3>Event Calendar</h3>
                <div className="flex items-center gap-1">
                     <button 
                        onClick={() => setShowExternal(!showExternal)} 
                        className={`p-1 rounded transition-colors ${showExternal ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:text-gray-300'}`}
                        title={showExternal ? "Hide External Events" : "Show External Events"}
                    >
                        <Globe size={14} />
                    </button>
                    {showExternal && (
                        <button 
                            onClick={loadUnifiedEvents}
                            className={`p-1 text-gray-400 hover:text-white transition ${isLoading ? 'animate-spin' : ''}`}
                            title="Refresh External Events"
                        >
                            <RefreshCw size={12} />
                        </button>
                    )}
                </div>
            </div>

            <div className="calendar-navigation">
                <button onClick={() => setCurrentBlockStart(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(prev.getDate() - 16); // Move by 16 days
                    return newDate;
                })}>&lt;</button>
                <span>{sixteenDayBlock[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sixteenDayBlock[15].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => setCurrentBlockStart(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(prev.getDate() + 16); // Move by 16 days
                    return newDate;
                })}>&gt;</button>
            </div>
            <div className="calendar-days-grid">
                {sixteenDayBlock.map(day => {
                    const dayEvents = displayEvents.filter(
                        (evt) => isSameDay(new Date(evt.date), day)
                    );
                    const isCurrentDay = isSameDay(day, today);

                    return (
                        <div 
                            key={day.toDateString()} 
                            className={`day-cell ${isCurrentDay ? 'current-day' : ''}`}
                            onClick={() => onDayClick(day)}
                        >
                            <div className="day-number">{day.getDate()}</div>
                            <div className="event-markers">
                                {dayEvents.map(evt => (
                                    <div 
                                        key={evt.id} 
                                        className="event-marker" 
                                        title={evt.title}
                                        style={{ backgroundColor: getEventColor(evt as any) }}
                                        onClick={(e) => { e.stopPropagation(); onEventClick(evt as Event); }} // Stop propagation and handle event click
                                    >
                                        {evt.time}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
