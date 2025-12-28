import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import { Plus } from 'lucide-react'; 
import CalendarInput from './CalendarInput'; // Import CalendarInput
import moment from 'moment'; // Import moment


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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="tech-panel p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4 uppercase font-mono">{initialEvent ? 'EDIT_EVENT' : 'ADD_NEW_EVENT'}</h2>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Title:</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="tech-input w-full p-2" />
                    </div>
                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Description:</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="tech-input w-full p-2 h-24 resize-y"></textarea>
                    </div>
                    <div className="form-group">
                        <CalendarInput mode="time" value={time ? moment(time, 'HH:mm').toDate() : null} onChange={date => setTime(date ? moment(date).format('HH:mm') : '')} label="Time (HH:MM):" />
                    </div>
                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Duration (e.g., 1h 30m):</label>
                        <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="tech-input w-full p-2" />
                    </div>
                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Link:</label>
                        <input type="text" value={link} onChange={e => setLink(e.target.value)} className="tech-input w-full p-2" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button className="tech-btn-secondary px-4 py-2" onClick={onClose}>CANCEL</button>
                    <button className="tech-btn px-4 py-2" onClick={handleSave}>SAVE_EVENT</button>
                </div>
            </div>
        </div>
    );
};
