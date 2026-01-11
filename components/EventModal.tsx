import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import { Plus } from 'lucide-react';
import CalendarInput from './CalendarInput'; // Import CalendarInput
import moment from 'moment'; // Import moment
import { CalendarEvent } from '../services/calendarService';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'> & { color?: string }) => void | Promise<void>;
    initialEvent?: CalendarEvent; // For editing existing events
    selectedDate: Date; // For adding new events on a specific date
}

const COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
];

export const EventModal = ({ isOpen, onClose, onSave, initialEvent, selectedDate }: EventModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [link, setLink] = useState('');
    const [color, setColor] = useState(COLORS[0].value);
    const [calendarId, setCalendarId] = useState('local');

    useEffect(() => {
        if (initialEvent) {
            setTitle(initialEvent.title);
            setDescription(initialEvent.description);
            setTime(initialEvent.time);
            setDuration(initialEvent.duration || '');
            setLink(initialEvent.link || '');
            setColor(initialEvent.color || COLORS[0].value);
            setCalendarId(initialEvent.sourceId || 'local');
        } else {
            // For new events, set initial values based on selectedDate
            setTitle('');
            setDescription('');
            setTime(selectedDate.toTimeString().slice(0, 5)); // HH:mm
            setDuration('');
            setLink('');
            setColor(COLORS[Math.floor(Math.random() * COLORS.length)].value); // Random default
            setCalendarId('local');
        }
    }, [initialEvent, selectedDate, isOpen]); // Reset when modal opens or initialEvent/selectedDate changes

    if (!isOpen) return null;

    const handleSave = () => {
        const newEvent = {
            date: selectedDate.toISOString().split('T')[0],
            title,
            description,
            time,
            duration: duration || undefined,
            link: link || undefined,
            color
        };
        onSave(newEvent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 event-modal-overlay">
            <div className="tech-panel p-6 w-full max-w-md rounded-none" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4 uppercase font-mono">{initialEvent ? 'EDIT_EVENT' : 'ADD_NEW_EVENT'}</h2>
                <div className="space-y-4">
                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Title:</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="tech-input w-full p-2 rounded-none" readOnly={initialEvent?.isExternal} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                             <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Calendar:</label>
                             <select 
                                value={calendarId} 
                                onChange={e => setCalendarId(e.target.value)} 
                                className="tech-input w-full p-2 rounded-none bg-[#0f141f] border border-gray-700 text-white"
                                disabled={!!initialEvent} // Prevent moving events for now
                            >
                                <option value="local">Local Calendar</option>
                                {initialEvent?.isExternal && <option value={initialEvent.sourceId}>{initialEvent.sourceName}</option>}
                             </select>
                        </div>
                        <div className="form-group">
                             <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Color:</label>
                             <div className="flex gap-2 items-center h-full">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => !initialEvent?.isExternal && setColor(c.value)}
                                        className={`w-6 h-6 rounded-none border ${color === c.value ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                        disabled={!!initialEvent?.isExternal}
                                    />
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <CalendarInput 
                            mode="time" 
                            value={time ? moment(time, 'HH:mm').toDate() : null} 
                            onChange={date => setTime(date ? moment(date).format('HH:mm') : '')} 
                            label="Time (HH:MM):" 
                            readOnly={initialEvent?.isExternal} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Duration:</label>
                            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="tech-input w-full p-2 rounded-none" placeholder="1h 30m" readOnly={initialEvent?.isExternal} />
                        </div>
                         <div className="form-group">
                            <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Link:</label>
                            <input type="text" value={link} onChange={e => setLink(e.target.value)} className="tech-input w-full p-2 rounded-none" readOnly={initialEvent?.isExternal} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">Description:</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="tech-input w-full p-2 h-24 resize-y rounded-none" readOnly={initialEvent?.isExternal}></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button className="tech-btn-secondary px-4 py-2 rounded-none" onClick={onClose}>CANCEL</button>
                    <button className="tech-btn px-4 py-2 rounded-none" onClick={handleSave} disabled={initialEvent?.isExternal}>SAVE_EVENT</button>
                </div>
            </div>
        </div>
    );
};
