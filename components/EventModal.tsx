import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import '../styles/event_modal.css';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'>) => void | Promise<void>;
    initialEvent?: Event; // For editing existing events
    selectedDate: Date; // For adding new events on a specific date
}

export const EventModal = ({ isOpen, onClose, onSave, initialEvent, selectedDate }: EventModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [link, setLink] = useState('');

    useEffect(() => {
        if (initialEvent) {
            setTitle(initialEvent.title);
            setDescription(initialEvent.description);
            setTime(initialEvent.time);
            setDuration(initialEvent.duration || '');
            setLink(initialEvent.link || '');
        } else {
            // For new events, set initial values based on selectedDate
            setTitle('');
            setDescription('');
            setTime(selectedDate.toTimeString().slice(0, 5)); // HH:mm
            setDuration('');
            setLink('');
        }
    }, [initialEvent, selectedDate, isOpen]); // Reset when modal opens or initialEvent/selectedDate changes

    if (!isOpen) return null;

    const handleSave = () => {
        const newEvent: Omit<Event, 'id'> = {
            date: selectedDate.toISOString().split('T')[0],
            title,
            description,
            time,
            duration: duration || undefined,
            link: link || undefined,
        };
        onSave(newEvent);
        onClose();
    };

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal-content" onClick={e => e.stopPropagation()}>
                <h2>{initialEvent ? 'Edit Event' : 'Add New Event'}</h2>
                <div className="form-group">
                    <label>Title:</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                    <label>Time:</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Duration (e.g., 1h 30m):</label>
                    <input type="text" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Link:</label>
                    <input type="text" value={link} onChange={e => setLink(e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button className="secondary-button" onClick={onClose}>Cancel</button>
                    <button className="primary-button" onClick={handleSave}>Save Event</button>
                </div>
            </div>
        </div>
    );
};
