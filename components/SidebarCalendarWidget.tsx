import React, { useState, useEffect, useMemo } from 'react';
import type { Event } from '../types';
import { isSameDay } from '../utils';
import '../styles/sidebar_calendar_widget.css';

interface SidebarCalendarWidgetProps {
    events: Event[];
    onAddEvent: (event: Omit<Event, 'id'>) => void;
    onDayClick: (date: Date) => void; // Callback to open modal for specific date
    onEventClick: (event: Event) => void; // New callback for clicking an existing event
}

const COLORS = ['#FFD700', '#32CD32', '#FF6347', '#1E90FF']; // Yellow, Green, Red, Blue

const getEventColor = (eventId: number) => {
    return COLORS[eventId % COLORS.length];
};

export const SidebarCalendarWidget = ({ events, onAddEvent, onDayClick, onEventClick }: SidebarCalendarWidgetProps) => {
    // Calculate initial currentBlockStart to place today in the first third (e.g., 4th day)
    const initialBlockStart = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() - 3); // Place today as the 4th day (index 3)
        return start;
    }, []);
    const [currentBlockStart, setCurrentBlockStart] = useState(initialBlockStart); // Start of the currently displayed 16-day block

    // Calculate the days of the current 16-day block
    const sixteenDayBlock = useMemo(() => {
        const start = new Date(currentBlockStart);
        // Ensure the start date of the block aligns to a consistent grid point (e.g., always a Sunday)
        // For 4x4, let's just make it a simple 16-day rolling window starting from currentBlockStart.
        // If we want it to align to a specific day of the week, this logic needs adjustment.
        // For simplicity, let's make it 16 days starting from the adjusted currentBlockStart.
        
        const days = [];
        for (let i = 0; i < 16; i++) { // Generate 16 days
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentBlockStart]);

    const today = new Date();

    return (
        <div className="sidebar-calendar-widget">
            <h3>Event Calendar</h3>
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
                    const dayEvents = events.filter(
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
                                        style={{ backgroundColor: getEventColor(evt.id) }}
                                        onClick={(e) => { e.stopPropagation(); onEventClick(evt); }} // Stop propagation and handle event click
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
