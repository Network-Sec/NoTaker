import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, ReactNode } from 'react';
import Calendar from 'react-calendar';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarInputProps {
    mode?: 'datetime' | 'date' | 'time';
    value: Date | null;
    onChange: (date: Date | null) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    children?: ReactNode; // New: Allow external trigger
}

export const CalendarInput = forwardRef(({
    mode = 'date',
    value,
    onChange,
    label,
    placeholder,
    className,
    children
}: CalendarInputProps, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputFocusRef = useRef<HTMLInputElement>(null);

    // Scroll refs
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputFocusRef.current?.focus(),
        blur: () => inputFocusRef.current?.blur(),
    }));

    const getFormat = () => {
        if (mode === 'time') return 'HH:mm';
        if (mode === 'datetime') return 'YYYY-MM-DD HH:mm';
        return 'YYYY-MM-DD';
    };

    // Sync internal state only if not using custom children
    useEffect(() => {
        if (!children) {
            if (value) {
                setInputValue(moment(value).format(getFormat()));
            } else {
                setInputValue('');
            }
        }
    }, [value, mode, children]);

    // Auto-scroll logic for time picker
    useEffect(() => {
        if (isOpen && (mode === 'time' || mode === 'datetime')) {
            setTimeout(() => {
                const currentHour = value ? moment(value).hour() : moment().hour();
                const currentMinute = value ? moment(value).minute() : moment().minute();
                
                if (hourRef.current) hourRef.current.scrollTop = currentHour * 32;
                if (minuteRef.current) minuteRef.current.scrollTop = currentMinute * 32;
            }, 10);
        }
    }, [isOpen, mode, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, []);

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        const format = getFormat();
        const m = moment(val, format, true);
        if (m.isValid()) onChange(m.toDate());
        else if (val === '') onChange(null);
    };

    const handleDateChange = (newDate: Date | Date[]) => {
        const dateRaw = Array.isArray(newDate) ? newDate[0] : newDate;
        let finalDate = moment(dateRaw);
        
        if (value) {
            const existing = moment(value);
            finalDate.hour(existing.hour()).minute(existing.minute());
        } else {
            finalDate.hour(moment().hour()).minute(moment().minute());
        }

        onChange(finalDate.toDate());
        if (mode === 'date') setIsOpen(false);
    };

    const handleTimeSelect = (type: 'hour' | 'minute', val: number) => {
        const base = value ? moment(value) : moment().startOf('day');
        if (type === 'hour') base.hour(val);
        if (type === 'minute') base.minute(val);
        onChange(base.toDate());
    };

    const renderTimePicker = () => {
        const currentHour = value ? moment(value).hour() : moment().hour();
        const currentMinute = value ? moment(value).minute() : moment().minute();

        return (
            <div className="tech-time-container">
                <div className="tech-time-col border-r border-gray-700" ref={hourRef}>
                    <div className="tech-time-header">HR</div>
                    {Array.from({ length: 24 }, (_, i) => (
                        <div
                            key={i}
                            className={`tech-time-item ${i === currentHour ? 'active' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); handleTimeSelect('hour', i); }}
                        >
                            {String(i).padStart(2, '0')}
                        </div>
                    ))}
                    <div className="h-24 w-full flex-shrink-0"></div>
                </div>

                <div className="tech-time-col" ref={minuteRef}>
                    <div className="tech-time-header">MIN</div>
                    {Array.from({ length: 60 }, (_, i) => (
                        <div
                            key={i}
                            className={`tech-time-item ${i === currentMinute ? 'active' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); handleTimeSelect('minute', i); }}
                        >
                            {String(i).padStart(2, '0')}
                        </div>
                    ))}
                    <div className="h-24 w-full flex-shrink-0"></div>
                </div>
            </div>
        );
    };

    return (
        <div className={`relative ${children ? 'inline-block' : 'w-full'}`} ref={containerRef}>
            {/* Standard Mode (Input owned by Component) */}
            {!children && (
                <>
                    {label && <label className="block text-gray-400 text-sm mb-1 uppercase font-mono">{label}</label>}
                    <div className="flex items-center gap-2 relative">
                        <div 
                            className="absolute left-3 text-techCyan z-10 cursor-pointer"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {mode === 'time' ? <Clock size={16} /> : <CalendarIcon size={16} />}
                        </div>
                        <input
                            ref={inputFocusRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={() => setIsOpen(true)}
                            placeholder={placeholder || getFormat()}
                            className={`tech-input pl-10 pr-3 py-2 text-sm font-mono w-full focus:border-techCyan ${className}`}
                            autoComplete="off"
                        />
                    </div>
                </>
            )}

            {/* Custom Mode (Input owned by Parent) */}
            {children && (
                <div onClick={() => setIsOpen(true)}>
                    {children}
                </div>
            )}

            {/* Popup */}
            {isOpen && (
                <div 
                    className="tech-picker-popup"
                    style={{ width: mode === 'time' ? '140px' : '280px' }}
                >
                    {(mode === 'date' || mode === 'datetime') && (
                        <div className="p-2">
                            <Calendar
                                onChange={handleDateChange}
                                value={value || new Date()}
                                view="month"
                                prevLabel={<ChevronLeft size={16} />}
                                nextLabel={<ChevronRight size={16} />}
                                prev2Label={null}
                                next2Label={null}
                                className="react-calendar-input"
                            />
                        </div>
                    )}

                    {(mode === 'time' || mode === 'datetime') && (
                        <>
                            {mode === 'datetime' && (
                                <div className="bg-gray-800/50 text-xs text-center text-gray-500 font-mono py-1 border-y border-gray-700">
                                    SELECT TIME
                                </div>
                            )}
                            {renderTimePicker()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

export default CalendarInput;