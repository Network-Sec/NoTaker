import React, { useState, useMemo, useCallback } from 'react';
import type { Bookmark, BrowserHistoryEntry } from '../types';

// --- SVG Icons for Legend and List --- 
const BookmarkIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
const ClockIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const GlobeIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const SearchIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);

// Styles for the "Identity-like" cards
const CARD_BG_COLOR = 'rgba(22, 27, 34, 0.4)';
const CARD_BORDER_HOVER = '#d68c45'; // Orange from identity theme
const CARD_BORDER_ACTIVE = '#4deeea'; // Cyan from identity theme

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
}

export const BookmarkView = ({ allBookmarksAndHistory, onAddBookmark, onDeleteBookmark }: BookmarkViewProps) => {
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [startDate, setStartDate] = useState<string>(''); 
    const [endDate, setEndDate] = useState<string>(''); 
    const [searchQuery, setSearchQuery] = useState<string>(''); 

    const filteredAndSortedItems = useMemo(() => {
        let currentFilteredItems = allBookmarksAndHistory;

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

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            currentFilteredItems = currentFilteredItems.filter(item => 
                (item.title || '').toLowerCase().includes(lowerCaseQuery) ||
                (item.url || '').toLowerCase().includes(lowerCaseQuery)
            );
        }

        return [...currentFilteredItems].sort((a, b) => {
            let aVal: any, bVal: any;

            if (sortColumn === 'timestamp') {
                aVal = getItemDate(a).getTime();
                bVal = getItemDate(b).getTime();
            } else if (sortColumn === 'title') {
                aVal = (a.title || '').toLowerCase();
                bVal = (b.title || '').toLowerCase();
            } 
            // Add more sort cases if UI header is added back, 
            // but for "List/Card" view, sorting is often implicit or via dropdown.
            // Keeping timestamp default.

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allBookmarksAndHistory, startDate, endDate, searchQuery, sortColumn, sortDirection]); 

    return (
        <div className="page-container flex flex-col h-full bg-[#0a0a0a]">
            {/* Header Area */}
            <div className="flex-none pt-4 px-2 pb-6">
                <h1 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-800 pb-2">History and Bookmarks</h1>
                
                {/* Controls Bar */}
                <div className="bg-[#111] p-4 rounded-lg border border-gray-800 flex flex-wrap gap-4 items-center mb-4 shadow-sm">
                    <div className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-1 rounded-md border border-gray-700">
                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Date Range</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm text-gray-300 focus:outline-none w-28" />
                        <span className="text-gray-600 font-medium">-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm text-gray-300 focus:outline-none w-28" />
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto relative group">
                        <div className="absolute left-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                            <SearchIcon size="1em"/>
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search history..." 
                            className="bg-[#0f0f0f] border border-gray-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full md:w-72 transition-all placeholder-gray-600" 
                        />
                    </div>
                </div>
            </div>

            {/* List Area - Replaced Table with Tech-Item List */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-10 space-y-1">
                 {filteredAndSortedItems.length > 0 ? (
                    filteredAndSortedItems.map(item => {
                        const itemDate = getItemDate(item);
                        const isValid = !isNaN(itemDate.getTime());
                        
                        // Formatting
                        const timeString = isValid ? itemDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                        const dateString = isValid ? itemDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                        const isBookmark = 'timestamp' in item;
                        
                        return (
                            <div 
                                key={item.id} 
                                className="group relative flex items-center w-full p-3 mb-1 bg-[#161b22]/40 border border-transparent border-l-0 text-sm text-gray-400 transition-all hover:bg-[#1c2128] hover:text-gray-200 cursor-pointer overflow-hidden"
                            >
                                {/* Left Accent Bar (Identity Style) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#30363d] transition-all group-hover:w-1.5 group-hover:bg-blue-500"></div>

                                {/* Icon / Favicon Placeholder */}
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#0d1117] rounded-lg border border-[#30363d] group-hover:border-blue-500/30 text-gray-500 group-hover:text-blue-400 mr-4 transition-colors">
                                    {isBookmark ? <BookmarkIcon size="1.2em" /> : <GlobeIcon size="1.2em" />}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold truncate text-gray-300 group-hover:text-white pr-4">
                                            {item.title || '(No Title)'}
                                        </h3>
                                        <span className="text-[10px] font-mono text-gray-600 group-hover:text-blue-400/80 whitespace-nowrap">
                                            {dateString} <span className="opacity-50">|</span> {timeString}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs text-gray-500 truncate hover:text-blue-400 transition-colors max-w-[80%]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {item.url}
                                        </a>
                                        <span className="text-[9px] uppercase tracking-wider text-gray-700 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d] group-hover:border-gray-600">
                                            {getItemSource(item).replace('Chrome-', '').replace('Firefox-', '')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 py-12">
                        <ClockIcon size="3em" />
                        <h2 className="mt-4 text-xl font-light">No items found</h2>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                 )}
            </div>
        </div>
    );
};
