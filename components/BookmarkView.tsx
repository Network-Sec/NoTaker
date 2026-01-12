import React, { useState, useMemo, useEffect } from 'react';
// Assuming moment is imported given the context of the original code
import moment from 'moment'; 
import type { Bookmark, BrowserHistoryEntry } from '../types';
import CalendarInput from './CalendarInput'; 

// --- SVG Icons --- 
const BookmarkIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
const ClockIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const GlobeIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const SearchIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ChevronLeft = ({ size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRight = ({ size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);
const ToolboxIcon = ({ size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>);

// Define shapes for source legend. Use constant symbols.
const SOURCE_SHAPES: any = {
    'Chrome': ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><path d="M21.17 8.04L13 2.11M11 2.11L2.83 8.04M2.83 15.96L11 21.89M13 21.89L21.17 15.96M8.04 2.83L15.96 8.04M8.04 15.96L15.96 21.17"></path></svg>),
    'Brave': ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6A6 6 0 0 1 12 18Zm0-10a2 2 0 1 0 2 2A2 2 0  0 0 12 8Z"></path><path d="M12 2v6m0 8v6M2 12h6m8 0h6"></path></svg>),
    'Firefox': ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm6.5-5.5l-2.5 2.5m-2.5-2.5l2.5 2.5M10.5 5.5l-2.5 2.5"></path></svg>),
    'Manual Bookmark': ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
    'Unknown History': ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>),
};

// Map sources to fixed colors for consistency
const SOURCE_COLORS_MAP: { [key: string]: string } = {
    'Chrome': '#3b82f6',    // Blue
    'Brave': '#f97316',     // Orange
    'Firefox': '#ef4444',   // Red
    'Manual Bookmark': '#8b5cf6', // Purple
    'Unknown History': '#10b981', // Green
};

// HELPER: Safely get the date from either item type
function getItemDate(item: Bookmark | BrowserHistoryEntry): Date {
    const isBookmark = 'timestamp' in item;
    const timeStr = isBookmark ? (item as Bookmark).timestamp : (item as BrowserHistoryEntry).visit_time;
    if (!timeStr) return new Date(0); 
    return new Date(timeStr);
}

// HELPER: Safely get the source string
function getItemSource(item: Bookmark | BrowserHistoryEntry): string {
    if (item.source) return item.source;
    return ('timestamp' in item) ? 'Manual Bookmark' : 'Unknown History';
}

interface BookmarkViewProps {
    allBookmarksAndHistory: Array<Bookmark | BrowserHistoryEntry>;
    onAddBookmark: (url: string, title: string) => void;
    onDeleteBookmark: (id: string) => void;
    onAddToToolbox?: (item: { url: string; title: string }) => Promise<void>; // Ensure it returns a Promise<void>
}

const ITEMS_PER_PAGE = 250;

export const BookmarkView = ({ allBookmarksAndHistory, onAddBookmark, onDeleteBookmark, onAddToToolbox }: BookmarkViewProps) => {
    // State
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [startDate, setStartDate] = useState<string>(''); 
    const [endDate, setEndDate] = useState<string>(''); 
    const [searchQuery, setSearchQuery] = useState<string>(''); 
    const [viewType, setViewType] = useState<'all' | 'history' | 'bookmarks'>('all'); // New toggle state
    const [currentPage, setCurrentPage] = useState(1); // Pagination state
    const [addingItemId, setAddingItemId] = useState<string | null>(null); // State to track item being added

    // Filter Logic
    const filteredAndSortedItems = useMemo(() => {
        let currentFilteredItems = allBookmarksAndHistory;

        // 1. Filter by Type
        if (viewType === 'bookmarks') {
            currentFilteredItems = currentFilteredItems.filter(item => 'timestamp' in item);
        } else if (viewType === 'history') {
            currentFilteredItems = currentFilteredItems.filter(item => !('timestamp' in item));
        }

        // 2. Filter by Date
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); 
            currentFilteredItems = currentFilteredItems.filter(item => {
                const itemDate = getItemDate(item);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() >= start.getTime();
            });
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); 
            currentFilteredItems = currentFilteredItems.filter(item => {
                const itemDate = getItemDate(item);
                itemDate.setHours(0, 0, 0, 0); 
                return itemDate.getTime() <= end.getTime();
            });
        }

        // 3. Filter by Search
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentFilteredItems = currentFilteredItems.filter(item => 
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.url || '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        // 4. Sort
        return [...currentFilteredItems].sort((a, b) => {
            let aVal: any, bVal: any;

            if (sortColumn === 'timestamp') {
                aVal = getItemDate(a).getTime();
                bVal = getItemDate(b).getTime();
            } else if (sortColumn === 'title') {
                aVal = (a.title || '').toLowerCase();
                bVal = (b.title || '').toLowerCase();
            } 

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allBookmarksAndHistory, startDate, endDate, searchQuery, sortColumn, sortDirection, viewType]); 

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate, searchQuery, viewType]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAndSortedItems, currentPage]);

    return (
        <div className="flex h-full w-full bg-background font-sans text-gray-300 overflow-hidden flex-col relative">
            
            {/* --- HEADER SECTION --- */}
            <div className="flex-none px-4 py-5 w-full max-w-7xl mx-auto z-10">
                <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider font-mono">
                        History <span className="text-techCyan">&</span> Bookmarks
                    </h1>
                    <div className="text-xs font-mono text-gray-500">
                        {filteredAndSortedItems.length} ENTRIES
                    </div>
                </div>
                
                {/* Controls Bar */}
                <div className="tech-panel p-3 flex flex-wrap gap-4 items-center shadow-lg bg-surface/50 backdrop-blur-sm border border-white/5">
                    
                    {/* View Toggle */}
                    <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden p-1 gap-1">
                        {['all', 'history', 'bookmarks'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setViewType(type as any)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                                    viewType === type 
                                    ? 'bg-techCyan/20 text-techCyan border border-techCyan/30 shadow-[0_0_10px_rgba(0,255,255,0.1)]' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden md:block mx-2"></div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2">
                        <CalendarInput 
                            mode="date" 
                            placeholder="START"
                            value={startDate ? moment(startDate).toDate() : null} 
                            onChange={date => setStartDate(date ? moment(date).format('YYYY-MM-DD') : '')} 
                            className="w-32 bg-black/20 border-white/10 text-xs" 
                        />
                        <span className="text-gray-600 font-mono">TO</span>
                        <CalendarInput 
                            mode="date" 
                            placeholder="END"
                            value={endDate ? moment(endDate).toDate() : null} 
                            onChange={date => setEndDate(date ? moment(date).format('YYYY-MM-DD') : '')} 
                            className="w-32 bg-black/20 border-white/10 text-xs" 
                        />
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    {/* Search */}
                    <div className="flex items-center gap-2 w-full md:w-auto relative group">
                        <div className="absolute left-3 text-gray-500 group-focus-within:text-techCyan transition-colors">
                            <SearchIcon size="1em"/>
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="SEARCH DATA..." 
                            className="tech-input pl-9 pr-4 py-2 text-sm w-full md:w-64 bg-black/20 border border-white/10 focus:border-techCyan/50 focus:bg-black/40 transition-all placeholder-gray-600 font-mono"
                        /> 
                    </div>
                </div>
            </div>

            {/* --- LIST SECTION --- */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-4 pb-2 space-y-1 max-w-7xl mx-auto w-full">
                 {paginatedItems.length > 0 ? (
                    paginatedItems.map(item => {
                        const itemDate = getItemDate(item);
                        const isValid = !isNaN(itemDate.getTime());
                        
                        // Formatting
                        const timeString = isValid ? itemDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                        const dateString = isValid ? itemDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                        const isBookmark = 'timestamp' in item;
                        
                        // Source Logic
                        const sourceName = getItemSource(item);
                        const cleanSourceName = sourceName.replace(/(Chrome|Firefox|Brave)-/, '').replace('Manual ', '');
                        const SourceIconComponent = SOURCE_SHAPES[sourceName] || GlobeIcon;
                        const sourceColor = SOURCE_COLORS_MAP[sourceName] || '#9ca3af';

                        return (
                            <div 
                                key={item.id} 
                                className="group flex flex-row items-center bg-surface/30 hover:bg-surface/60 border border-transparent hover:border-white/5 transition-all p-2 rounded-sm relative overflow-hidden"
                            >
                                {/* Hover Effect Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-techCyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>

                                {/* 1. ICON (Fixed Width) */}
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-black/20 rounded border border-white/5 text-gray-500 mr-3 ml-2" style={{ color: sourceColor }}>
                                    {isBookmark ? <BookmarkIcon size="1.2em" /> : <GlobeIcon size="1.2em" />}
                                </div>

                                {/* 2. MAIN CONTENT (Flex Column) */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center mr-4">
                                    <h3 className="text-sm font-medium truncate text-gray-200 group-hover:text-white font-sans tracking-tight">
                                        {item.title || '(No Title)'}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 text-xs mt-0.5">
                                        {/* Source Badge */}
                                        <span className="flex items-center gap-1 px-1.5 py-px border rounded text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: sourceColor, borderColor: sourceColor + '40', backgroundColor: sourceColor + '10' }}>
                                            <SourceIconComponent color={sourceColor} size="0.8em" />
                                            {cleanSourceName}
                                        </span>
                                        {/* URL */}
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-techCyan/70 truncate hover:text-techCyan transition-colors max-w-[300px] md:max-w-md" 
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {item.url}
                                        </a>
                                    </div>
                                </div>

                                {/* 3. META & ACTIONS (Right Aligned Flex Row) */}
                                <div className="flex-shrink-0 flex items-center gap-4 pl-4 border-l border-white/5">
                                    
                                    {/* Date & Time */}
                                    <div className="flex flex-col items-end min-w-[80px]">
                                        <span className="text-xs font-bold text-gray-400 font-mono">{dateString}</span>
                                        <span className="text-[10px] text-gray-600 font-mono">{timeString}</span>
                                    </div>

                                    {/* Toolbox Button (Pulled out of main wrapper) */}
                                    {onAddToToolbox && (
                                        <button 
                                            className="w-9 h-9 flex items-center justify-center rounded border border-white/10 bg-white/5 text-gray-400 hover:text-techCyan hover:border-techCyan/50 hover:bg-techCyan/10 transition-all shadow-sm relative hover:scale-110 hover:shadow-techCyan cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAddingItemId(item.id); // Set loading state for this item
                                                
                                                // Wrap async operation in IIFE to prevent blocking the event handler
                                                (async () => {
                                                    try {
                                                        await onAddToToolbox({ url: item.url, title: item.title });
                                                    } catch (error) {
                                                        console.error("Failed to add to Toolbox:", error);
                                                        alert('Failed to add to Toolbox.');
                                                    } finally {
                                                        setAddingItemId(null); // Reset loading state
                                                    }
                                                })();
                                            }}
                                            disabled={addingItemId === item.id} // Disable button while loading
                                            title="Add to Toolbox"
                                        >
                                            {addingItemId === item.id ? (
                                                <svg className="animate-spin h-5 w-5 text-techCyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <ToolboxIcon size="1.1em" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                 ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-50">
                        <ClockIcon size="3em" />
                        <h2 className="mt-4 text-xl font-light font-mono">SYSTEM_IDLE // NO_DATA</h2>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                    </div>
                 )}
            </div>

            {/* --- PAGINATION FOOTER --- */}
            <div className="flex-none w-full max-w-7xl mx-auto px-4 py-3 border-t border-white/5 bg-background/95 backdrop-blur z-10 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-mono">
                    SHOWING {paginatedItems.length} OF {filteredAndSortedItems.length}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded border border-white/10 bg-surface hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-techCyan"
                        >
                            <ChevronLeft size="1.2em" />
                        </button>
                        
                        <div className="flex items-center px-4 py-1 bg-black/30 border border-white/10 rounded font-mono text-sm text-gray-300">
                            <span className="text-white font-bold">{currentPage}</span>
                            <span className="mx-2 text-gray-600">/</span>
                            <span>{totalPages}</span>
                        </div>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded border border-white/10 bg-surface hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-techCyan"
                        >
                            <ChevronRight size="1.2em" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};