import React, { useState, useMemo, useCallback } from 'react';
import type { Bookmark, BrowserHistoryEntry } from '../types';

// --- SVG Icons for Legend and List --- 
const BookmarkIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
const ClockIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const GlobeIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const SearchIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);

// Define shapes for source legend. Use constant symbols.
const SOURCE_SHAPES = {
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
    onAddToToolbox?: (item: { url: string; title: string }) => void;
}

export const BookmarkView = ({ allBookmarksAndHistory, onAddBookmark, onDeleteBookmark, onAddToToolbox }: BookmarkViewProps) => {
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [startDate, setStartDate] = useState<string>(''); 
    const [endDate, setEndDate] = useState<string>(''); 
    const [searchQuery, setSearchQuery] = useState<string>(''); 
    
    // Removed sourceLegend useMemo as the separate legend is gone.

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

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allBookmarksAndHistory, startDate, endDate, searchQuery, sortColumn, sortDirection]); 

    return (
        <div className="page-container flex flex-col h-full bg-[#0f0f0f]"> {/* Brighter background */}
            {/* Header Area */}
            <div className="flex-none pt-4 px-2 pb-6">
                <h1 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">History and Bookmarks</h1>
                
                {/* Controls Bar */}
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700 flex flex-wrap gap-4 items-center mb-4 shadow-sm"> {/* Brighter bg */}
                    <div className="flex items-center gap-2 bg-[#161616] px-4 py-2 rounded-md border border-gray-600"> {/* Brighter bg/border */}
                        <span className="text-sm uppercase text-gray-400 font-bold tracking-widest">Date Range</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-base text-gray-300 focus:outline-none w-40" /> {/* Wider inputs */}
                        <span className="text-gray-500 font-medium">-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-base text-gray-300 focus:outline-none w-40" /> {/* Wider inputs */}
                    </div>
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto relative group">
                        <div className="absolute left-3 text-gray-400 group-focus-within:text-blue-400 transition-colors"> {/* Brighter icon */}
                            <SearchIcon size="1.4em"/> {/* Bigger icon */}
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search history..." 
                            className="bg-[#1f1f1f] border border-gray-600 rounded-full pl-11 pr-5 py-2.5 text-base text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full md:w-80 transition-all placeholder-gray-500" 
                        /> {/* Bigger input */}
                    </div>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-10 space-y-1">
                 {filteredAndSortedItems.length > 0 ? (
                    filteredAndSortedItems.map(item => {
                        const itemDate = getItemDate(item);
                        const isValid = !isNaN(itemDate.getTime());
                        
                        // Formatting
                        const timeString = isValid ? itemDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                        const dateString = isValid ? itemDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                        const isBookmark = 'timestamp' in item;
                        
                        // Get source properties
                        const sourceName = getItemSource(item);
                        const cleanSourceName = sourceName.replace(/(Chrome|Firefox|Brave)-/, '').replace('Manual ', '');
                        const SourceIconComponent = SOURCE_SHAPES[sourceName] || GlobeIcon;
                        const sourceColor = SOURCE_COLORS_MAP[sourceName] || '#9ca3af'; // Default gray

                        return (
                            <div 
                                key={item.id} 
                                className="group relative flex items-center w-full p-3 mb-0.5 bg-[#202020] border border-transparent border-l-0 text-base text-gray-300 transition-all hover:bg-[#252a33] hover:text-white cursor-pointer overflow-hidden rounded-lg shadow-sm"
                            >
                                {/* Left Accent Bar (Identity Style) */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#30363d] transition-all group-hover:w-1.5" style={{ backgroundColor: sourceColor }}></div>

                                {/* Icon / Favicon Placeholder */}
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#0f0f0f] rounded-lg border border-[#30363d] text-gray-500 mr-4 transition-colors" style={{ color: sourceColor, borderColor: sourceColor + '30' }}>
                                    {isBookmark ? <BookmarkIcon size="1.2em" /> : <GlobeIcon size="1.2em" />}
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold truncate text-gray-100 group-hover:text-white pr-4">
                                            {item.title || '(No Title)'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {onAddToToolbox && (
                                                <button 
                                                    className="tech-btn-secondary p-2 flex items-center justify-center border hover:border-techCyan/50" // Use tech-btn-secondary, increased padding, removed rounded-md
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToToolbox({ url: item.url, title: item.title });
                                                    }}
                                                    title="Add to Toolbox"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                                </button>
                                            )}
                                            <span className="text-sm font-mono text-gray-400 group-hover:text-gray-200 whitespace-nowrap">
                                                {dateString} <span className="opacity-50">|</span> {timeString}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-sm text-blue-300 truncate hover:text-blue-200 transition-colors max-w-[75%]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {item.url}
                                        </a>
                                        <span className="flex items-center gap-1 text-xs uppercase tracking-wider px-2 py-1 rounded border" style={{ color: sourceColor, borderColor: sourceColor + '50', backgroundColor: sourceColor + '10' }}>
                                            <SourceIconComponent color={sourceColor} size="0.8em" /> {/* Dynamic Source Icon */}
                                            {cleanSourceName}
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