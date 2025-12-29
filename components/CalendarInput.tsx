import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Calendar from 'react-calendar';

import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

// Custom CSS for this component (will live in global styles or here as inline for now)
// Note: Some styles will overlap with global calendar_overrides.css,
// but specific targeting or inline styles will manage this.

interface CalendarInputProps {
    mode?: 'datetime' | 'date' | 'time';
    value: Date | null;
    onChange: (date: Date | null) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    hideIcon?: boolean; // New prop
}

export const CalendarInput = forwardRef(({
    mode = 'date',
    value,
    onChange,
    label,
    placeholder,
    className,
    hideIcon = false // Default to false
}: CalendarInputProps, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null); // This was added in Step 1
    const calendarRef = useRef<HTMLDivElement>(null);
    const inputFocusRef = useRef<HTMLInputElement>(null); // This was added in Step 1

    useImperativeHandle(ref, () => ({
        focus: () => inputFocusRef.current?.focus(),
        blur: () => inputFocusRef.current?.blur(),
    }));

    useEffect(() => {
        // Update inputValue when the prop 'value' changes
        if (value && mode === 'time') {
            setInputValue(moment(value).format('HH:mm'));
        } else if (value && (mode === 'date' || mode === 'datetime')) {
            // For date/datetime, format as appropriate if needed for input type="text"
            // For now, let the readOnly and picker handle it, keep inputValue for time only
            setInputValue(moment(value).format(mode === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'));
        } else {
            setInputValue('');
        }
    }, [value, mode]);

    useEffect(() => {
        const calculatePosition = () => {
            if (inputFocusRef.current && isOpen) {
                const rect = inputFocusRef.current.getBoundingClientRect();
                // Position the calendar below the input, accounting for scroll. Add 8px offset for visual separation (similar to mt-2).
                setPopupPosition({
                    top: rect.bottom + window.scrollY + 8, // 8px offset below input
                    left: rect.left + window.scrollX,
                });
            } else if (!isOpen) {
                setPopupPosition(null); // Clear position when closed
            }
        };

        calculatePosition(); // Calculate initial position when opened

        // Add event listeners for scroll and resize to update position dynamically
        window.addEventListener('scroll', calculatePosition);
        window.addEventListener('resize', calculatePosition);

        return () => {
            window.removeEventListener('scroll', calculatePosition);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen]); // Recalculate when isOpen changes

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
                inputFocusRef.current && !inputFocusRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        // Use capture phase to ensure this handler runs before other click handlers that might stop propagation
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    const handleCalendarChange = (newDate: Date | Date[]) => {
        const date = Array.isArray(newDate) ? newDate[0] : newDate;
        if (mode === 'date' || mode === 'datetime') {
            const finalDate = value ? moment(value).year(moment(date).year()).month(moment(date).month()).date(moment(date).date()).toDate() : date;
            onChange(finalDate);
            if (mode === 'date') setIsOpen(false); // Close if only date is picked
        } else if (mode === 'time') {
            // Only update time if in time mode
            const finalDate = value ? moment(value).hour(moment(date).hour()).minute(moment(date).minute()).toDate() : date;
            onChange(finalDate);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeString = e.target.value;
        setInputValue(timeString); // Update internal input state immediately

        // Attempt to parse if a valid HH:mm or H:m pattern is emerging
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/;
        if (timeRegex.test(timeString)) {
            const [hours, minutes] = timeString.split(':').map(Number);
            const newDate = value ? moment(value).hour(hours).minute(minutes).toDate() : moment().hour(hours).minute(minutes).toDate();
            onChange(newDate);
        } else if (timeString === '') {
            onChange(null); // Allow clearing the time
        }
    };

    const displayInput = () => {
        if (mode === 'time') {
            return (
                <input
                    type="text" // Changed to text
                    ref={inputFocusRef}
                    value={inputValue} // Controlled component
                    onChange={handleTimeChange}
                    className="tech-input text-sm p-1" // Smaller for time only
                    placeholder={placeholder || "HH:mm"}
                    onClick={() => setIsOpen(true)}
                    onFocus={() => setIsOpen(true)} // Open on focus
                />
            );
        } else {
            return (
                <input
                    type="text"
                    ref={inputFocusRef}
                    value={inputValue}
                    readOnly // Prevent direct typing, use picker
                    onClick={() => setIsOpen(!isOpen)}
                    className={`tech-input w-full p-2 ${className}`}
                    placeholder={placeholder || (mode === 'date' ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm")}
                />
            );
        }
    };

    const renderCalendar = () => {
        // Only render if isOpen is true and popupPosition has been calculated
        if (!isOpen || !popupPosition) { 
            return null;
        }
        
        const timePicker = (
            <div className="flex flex-col h-48 overflow-y-auto custom-scrollbar">
                {Array.from({ length: 24 * 2 }, (_, i) => { // Every 30 minutes
                    const hour = Math.floor(i / 2);
                    const minute = (i % 2) * 30;
                    const time = moment().hour(hour).minute(minute).format('HH:mm');
                    const isSelected = value && moment(value).hour() === hour && moment(value).minute() === minute;
                    return (
                        <div
                            key={time}
                            className={`p-2 cursor-pointer hover:bg-white/10 ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                            onClick={() => {
                                const newDate = value ? moment(value).hour(hour).minute(minute).toDate() : moment().hour(hour).minute(minute).toDate();
                                onChange(newDate);
                                setIsOpen(false);
                            }}
                        >
                            {time}
                        </div>
                    );
                })}
            </div>
        );

        return (
            <div 
                ref={calendarRef} 
                className="tech-panel p-2 shadow-lg w-72" // Keep base styling classes
                style={{
                    position: 'fixed', // Use fixed positioning
                    zIndex: 9999, // Very high z-index to ensure it's on top
                    top: popupPosition.top,
                    left: popupPosition.left,
                }}
            >
                {mode === 'time' ? (
                    timePicker
                ) : (
                    <>
                        <Calendar
                            onChange={handleCalendarChange}
                            value={value || new Date()}
                            view="month"
                            prevLabel={<ChevronLeft size={16} />}
                            nextLabel={<ChevronRight size={16} />}
                            prev2Label={null} // Disable year navigation
                            next2Label={null} // Disable year navigation
                            className="react-calendar-input" // Custom class for overrides
                        />
                        {(mode === 'datetime') && (
                            <input
                                type="time"
                                value={value ? moment(value).format('HH:mm') : ''}
                                onChange={handleTimeChange}
                                className="tech-input mt-2 w-full p-2 text-sm"
                            />
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="relative"> {/* This relative container is now just for the label and input */}
            {label && <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">{label}</label>}
            <div className="flex items-center gap-2">
                {!hideIcon && (mode === 'date' || mode === 'datetime' ? <CalendarIcon size={18} className="text-techCyan" /> : <Clock size={18} className="text-techCyan" />)}
                {displayInput()}
            </div>
            {/* The calendar is now rendered outside the flow, but only if isOpen and popupPosition are true */}
            {isOpen && renderCalendar()} 
        </div>
    );
});

export default CalendarInput;