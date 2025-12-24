import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import moment from 'moment';
import { EventModal } from './EventModal';
import { createEvent } from '../services/db'; // createEvent is still used for new event creation
import type { Event } from '../types';

interface MonthlyCalendarProps {
    events: Event[]; // Now passed as a prop
    onAddEvent: (event: Omit<Event, 'id'>) => void; // Function to add new event
    onEventClick?: (event: Event) => void;
}

const EVENT_COLORS = [
    '#55B4B0', // Teal
    '#E15554', // Red
    '#E1BC29', // Yellow
    '#5499C7', // Blue
    '#8E44AD', // Purple
    '#27AE60', // Green
    '#D35400', // Orange
    '#F39C12', // Gold
];

const getEventColor = (eventId: number) => {
    return EVENT_COLORS[eventId % EVENT_COLORS.length];
};

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ events, onAddEvent, onEventClick }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMonthEvents, setCurrentMonthEvents] = useState<Event[]>([]);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    useEffect(() => {
        console.log("[MonthlyCalendar] Events prop received:", events);
        console.log("[MonthlyCalendar] Selected Date (for filter):", selectedDate);
        setCurrentMonthEvents(
            events.filter(event =>
                moment(event.date).isSame(selectedDate, 'month')
            )
        );
    }, [events, selectedDate]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    const handleDayClick = (value: Date) => {
        setSelectedDate(value);
        setEditingEvent(undefined); // Ensure we're adding a new event
        setIsModalOpen(true);
    };

    const handleEventSave = async (newEvent: Omit<Event, 'id'>) => {
        await onAddEvent(newEvent); // Use the prop for adding events
        // No need to fetchEvents() here, parent component will re-fetch and update events prop
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(undefined);
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const dayEvents = events.filter(event =>
                moment(event.date).isSame(date, 'day')
            );

            return (
                <div className="event-bars">
                    {dayEvents.map(event => (
                        <div key={event.id}
                             className="event-bar"
                             style={{ backgroundColor: getEventColor(event.id) }}
                             title={`${event.time} - ${event.title}`}
                             onClick={(e) => {
                                 e.stopPropagation(); // Prevent handleDayClick on the day tile
                                 if (onEventClick) onEventClick(event);
                             }}>
                            <span>{event.time}</span> <span>{event.title}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="monthly-calendar-container">
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                onClickDay={handleDayClick}
                tileContent={tileContent}
                className="react-calendar-monthly"
            />
            <EventModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleEventSave}
                selectedDate={selectedDate}
                initialEvent={editingEvent}
            />
            {currentMonthEvents.length > 0 && (
                <div className="current-month-events-list">
                    <h3>Events for {moment(selectedDate).format('MMMM YYYY')}</h3>
                    <ul>
                        {currentMonthEvents.map(event => (
                            <li key={event.id}>
                                <strong>{moment(event.date).format('MMMM Do')} {event.time}</strong>: {event.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
