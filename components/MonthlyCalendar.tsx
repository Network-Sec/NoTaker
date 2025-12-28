import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar'; 
import moment from 'moment';
import { EventModal } from './EventModal';
import { fetchUnifiedEvents, CalendarEvent, CalendarSource, fetchCalendarSources } from '../services/calendarService';
import type { Event } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalIcon, Settings, Plus } from 'lucide-react';

interface MonthlyCalendarProps {
    events: Event[]; // Legacy prop
    onAddEvent: (event: Omit<Event, 'id'>) => Promise<void>;
    onEventClick?: (event: Event) => void;
}

// --- CONSTANTS ---
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL_HEIGHT = 50; // px per hour slot in week/day view

// --- UTILS ---
const isSameDay = (d1: Date, d2: Date) => moment(d1).isSame(d2, 'day');

const getEventStyle = (event: CalendarEvent) => {
    const start = moment(event.date).set({
        hour: parseInt(event.time.split(':')[0]),
        minute: parseInt(event.time.split(':')[1])
    });
    
    let durationMinutes = 60; 
    if (event.endDate) {
        const end = moment(event.endDate);
        durationMinutes = moment.duration(end.diff(start)).asMinutes();
    } else if (event.duration) {
         // rudimentary parsing if string "1h" etc
         durationMinutes = 60; 
    }

    const startMinutes = start.hours() * 60 + start.minutes();
    
    return {
        top: `${(startMinutes / 60) * CELL_HEIGHT}px`,
        height: `${Math.max((durationMinutes / 60) * CELL_HEIGHT, 25)}px`, // Min height for visibility
        backgroundColor: event.color || '#3b82f6',
        color: '#fff'
    };
};

// --- COMPONENTS ---

const MiniCalendar = ({ date, onChange }: { date: Date, onChange: (d: Date) => void }) => {
    return (
        <div className="mini-calendar-wrapper">
             <Calendar
                onChange={onChange}
                value={date}
                className="react-calendar-mini"
                tileClassName={({ date: d, view }) => view === 'month' && isSameDay(d, new Date()) ? 'today-highlight' : ''}
            />
        </div>
    );
};

const CalendarSourceList = ({ sources, visibleSources, onToggle }: { sources: CalendarSource[], visibleSources: Set<number | string>, onToggle: (id: number | string) => void }) => {
    return (
        <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">My Calendars</h3>
            <div className="space-y-1">
                {/* Local Calendar */}
                <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer" onClick={() => onToggle('local')}>
                    <input type="checkbox" checked={visibleSources.has('local')} readOnly className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-0" />
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-sm text-gray-300">Local Events</span>
                </div>
                
                {/* External Calendars */}
                {sources.map(source => (
                    <div key={source.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer" onClick={() => onToggle(source.id)}>
                        <input type="checkbox" checked={visibleSources.has(source.id)} readOnly className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-0" />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></span>
                        <span className="text-sm text-gray-300 truncate" title={source.name}>{source.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- VIEWS ---

const MonthView = ({ date, events, onDateClick, onEventClick }: { date: Date, events: CalendarEvent[], onDateClick: (d: Date) => void, onEventClick: (e: CalendarEvent) => void }) => {
    const startOfMonth = moment(date).startOf('month');
    const startGrid = startOfMonth.clone().startOf('week');
    const endGrid = startOfMonth.clone().endOf('month').endOf('week');
    
    const days: Date[] = [];
    let day = startGrid.clone();
    while (day.isSameOrBefore(endGrid, 'day')) {
        days.push(day.toDate());
        day.add(1, 'day');
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-white/10">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-gray-800/50">
                {WEEK_DAYS.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">{d}</div>
                ))}
            </div>
            
            {/* Grid */}
            <div className="flex-grow flex flex-col">
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex-1 grid grid-cols-7 border-b border-white/10 min-h-[100px]">
                        {week.map((d, dIdx) => {
                            const isCurrentMonth = moment(d).isSame(date, 'month');
                            const isToday = moment(d).isSame(new Date(), 'day');
                            const dayEvents = events.filter(e => isSameDay(new Date(e.date), d));
                            
                            return (
                                <div 
                                    key={dIdx} 
                                    className={`relative border-r border-white/10 p-1 transition hover:bg-white/5 cursor-pointer ${!isCurrentMonth ? 'bg-gray-900/30' : ''}`}
                                    onClick={() => onDateClick(d)}
                                >
                                    <div className={`text-xs font-medium mb-1 flex justify-center`}>
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : !isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {moment(d).format('D')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        {dayEvents.slice(0, 4).map(ev => (
                                            <div 
                                                key={ev.id} 
                                                className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 shadow-sm transition-all hover:scale-[1.02]"
                                                style={{ 
                                                    backgroundColor: `${ev.color}20`, 
                                                    borderLeftColor: ev.color,
                                                    color: '#e2e8f0'
                                                }}
                                                onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                                                title={`${ev.time} - ${ev.title}`}
                                            >
                                               {ev.time} {ev.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 4 && (
                                            <div className="text-[9px] text-gray-500 pl-1">+{dayEvents.length - 4} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimeGridView = ({ date, events, mode, onEventClick }: { date: Date, events: CalendarEvent[], mode: 'week' | 'day', onEventClick: (e: CalendarEvent) => void }) => {
    const startDate = mode === 'week' ? moment(date).startOf('week').toDate() : date;
    const daysToShow = mode === 'week' ? 7 : 1;
    const columns = Array.from({ length: daysToShow }, (_, i) => moment(startDate).add(i, 'days').toDate());

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-white/10 bg-gray-800/50">
                <div className="w-16 flex-shrink-0 border-r border-white/10"></div>
                {columns.map((colDate, i) => (
                    <div key={i} className={`flex-1 py-2 text-center border-r border-white/10 last:border-0 ${isSameDay(colDate, new Date()) ? 'bg-blue-900/10' : ''}`}>
                        <div className={`text-xs font-semibold uppercase ${isSameDay(colDate, new Date()) ? 'text-blue-400' : 'text-gray-400'}`}>
                            {moment(colDate).format('ddd')}
                        </div>
                        <div className={`text-xl ${isSameDay(colDate, new Date()) ? 'font-bold text-blue-500' : 'text-gray-200'}`}>
                            {moment(colDate).format('D')}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Scrollable Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar relative">
                <div className="flex relative" style={{ height: HOURS.length * CELL_HEIGHT }}>
                    {/* Time Axis */}
                    <div className="w-16 flex-shrink-0 border-r border-white/10 bg-gray-800/30 text-right pr-2 text-xs text-gray-500 font-mono select-none sticky left-0 z-20">
                        {HOURS.map(h => (
                            <div key={h} className="relative" style={{ height: CELL_HEIGHT }}>
                                <span className="-top-2 relative text-[10px]">{h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Columns */}
                    {columns.map((colDate, i) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.date), colDate));
                        return (
                            <div key={i} className="flex-1 relative border-r border-white/10 last:border-0 min-w-[100px]">
                                {/* Horizontal Guidelines */}
                                {HOURS.map(h => (
                                    <div key={h} className="absolute w-full border-t border-white/5" style={{ top: h * CELL_HEIGHT, height: CELL_HEIGHT }}></div>
                                ))}

                                {/* Red "Now" Line */}
                                {isSameDay(colDate, new Date()) && (
                                    <div 
                                        className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none opacity-80"
                                        style={{ top: (moment().hours() * 60 + moment().minutes()) / 60 * CELL_HEIGHT }}
                                    >
                                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                    </div>
                                )}

                                {/* Events */}
                                {dayEvents.map(ev => {
                                    const style = getEventStyle(ev);
                                    return (
                                        <div
                                            key={ev.id}
                                            className="absolute left-0.5 right-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer shadow-md border-l-4 transition-all hover:brightness-110 hover:z-30"
                                            style={{ 
                                                ...style, 
                                                zIndex: 10,
                                                borderColor: ev.color, // Border color matches event color
                                                backgroundColor: `${ev.color}cc` // Slight transparency
                                            }}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                                            title={`${ev.title} (${ev.sourceName})\n${ev.time} - ${ev.description}`}
                                        >
                                            <div className="font-bold truncate text-white drop-shadow-sm">{ev.title}</div>
                                            <div className="text-[10px] text-white/90 truncate">{ev.time}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ events: propEvents, onAddEvent, onEventClick }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
    
    // Data State
    const [unifiedEvents, setUnifiedEvents] = useState<CalendarEvent[]>([]);
    const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([]);
    const [visibleSources, setVisibleSources] = useState<Set<number | string>>(new Set(['local']));
    const [isLoading, setIsLoading] = useState(false);

    // Initial Load
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedEvents, fetchedSources] = await Promise.all([
                fetchUnifiedEvents(),
                fetchCalendarSources()
            ]);
            
            setUnifiedEvents(fetchedEvents);
            setCalendarSources(fetchedSources);
            
            // Default: all sources visible
            const allIds = new Set<number | string>(['local']);
            fetchedSources.forEach(s => allIds.add(s.id));
            setVisibleSources(allIds);

        } catch (e) {
            console.error("Failed to load calendar data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handlers
    const handleNav = (dir: 'prev' | 'next') => {
        const m = moment(selectedDate);
        const amount = 1;
        const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
        dir === 'next' ? m.add(amount, unit) : m.subtract(amount, unit);
        setSelectedDate(m.toDate());
    };

    const toggleSource = (id: number | string) => {
        const newSet = new Set(visibleSources);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setVisibleSources(newSet);
    };

    const handleEventAction = (event: CalendarEvent) => {
        if (event.isExternal) {
            // Read-only handling for external events
            // Could open a simpler read-only modal
            alert(`External Event (Read Only)\n\n${event.title}\nSource: ${event.sourceName}\nTime: ${event.time}`);
            return;
        }
        setEditingEvent(event as Event);
        setSelectedDate(new Date(event.date));
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (newEvent: Omit<Event, 'id'>) => {
        await onAddEvent(newEvent);
        await loadData(); // Re-sync to get new ID and update view
        setIsModalOpen(false);
    };

    // Filter events by visibility
    const visibleEvents = useMemo(() => {
        return unifiedEvents.filter(e => 
            (e.sourceId === 'local' && visibleSources.has('local')) || 
            (visibleSources.has(parseInt(e.sourceId as string)) || visibleSources.has(e.sourceId)) // Handle flexible ID types
        );
    }, [unifiedEvents, visibleSources]);

    return (
        <div className="flex h-full bg-[#0B0F19] text-gray-100 overflow-hidden font-sans">
            {/* --- SIDEBAR --- */}
            <div className="w-64 flex-shrink-0 border-r border-white/10 bg-[#111827] flex flex-col p-4">
                <button 
                    onClick={() => { setEditingEvent(undefined); setIsModalOpen(true); }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-semibold shadow-lg transition-all mb-6"
                >
                    <Plus size={20} />
                    <span>New Event</span>
                </button>

                <MiniCalendar date={selectedDate} onChange={setSelectedDate} />
                
                <div className="border-t border-white/10 my-4"></div>
                
                <CalendarSourceList 
                    sources={calendarSources} 
                    visibleSources={visibleSources} 
                    onToggle={toggleSource} 
                />
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-grow flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]">
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {moment(selectedDate).format('MMMM YYYY')}
                        </h2>
                        <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-white/5">
                            <button onClick={() => handleNav('prev')} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition"><ChevronLeft size={18}/></button>
                            <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition">Today</button>
                            <button onClick={() => handleNav('next')} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition"><ChevronRight size={18}/></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={loadData} className={`p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition ${isLoading ? 'animate-spin' : ''}`} title="Refresh">
                            <RefreshCw size={20} />
                        </button>
                        
                        <div className="flex bg-gray-800 rounded-lg p-1 border border-white/5">
                            {(['month', 'week', 'day'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* View Area */}
                <div className="flex-grow overflow-hidden bg-[#0f141f]">
                    {view === 'month' && (
                        <MonthView 
                            date={selectedDate} 
                            events={visibleEvents} 
                            onDateClick={(d) => { setSelectedDate(d); setView('day'); }}
                            onEventClick={handleEventAction}
                        />
                    )}
                    {(view === 'week' || view === 'day') && (
                        <TimeGridView 
                            date={selectedDate} 
                            events={visibleEvents} 
                            mode={view} 
                            onEventClick={handleEventAction}
                        />
                    )}
                </div>
            </div>

            {/* --- MODAL --- */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                selectedDate={selectedDate}
                initialEvent={editingEvent}
            />
        </div>
    );
};
