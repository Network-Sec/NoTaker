import React, { useState, useMemo, useCallback } from 'react';
import type { Bookmark, BrowserHistoryEntry } from '../types';
import '../styles/bookmark_view.css';

// --- SVG Icons for Legend and Table --- 
const BookmarkIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
const ClockIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const SquareIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>);
const TriangleIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.86 18.14a2 2 0 0 0 1.73 3H20.41a2 2 0 0 0 1.73-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>);
const HexagonIcon = ({ color = 'currentColor', size = '1em' }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.1 12.5v6.3a2.3 2.3 0 0 1-1.15 2l-6.3 3.65a2.3 2.3 0 0 1-2.3 0l-6.3-3.65a2.3 2.3 0 0 1-1.15-2V12.5m18.9-3.65a2.3 2.3 0 0 0-1.15-2l-6.3-3.65a2.3 2.3 0 0 0-2.3 0l-6.3 3.65a2.3 2 0 0 0-1.15 2V12.5"></path></svg>);

const SOURCE_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b']; // Blue, Orange, Red, Purple, Green, Yellow
const SOURCE_SHAPES = [SquareIcon, TriangleIcon, HexagonIcon];

interface BookmarkViewProps {
    allBookmarksAndHistory: Array<Bookmark | BrowserHistoryEntry>;
    onAddBookmark: (url: string, title: string) => void; // Keep prop for now, though form is removed
    onDeleteBookmark: (id: string) => void;
}

export const BookmarkView = ({ allBookmarksAndHistory, onAddBookmark, onDeleteBookmark }: BookmarkViewProps) => {
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');

    const sourceLegend = useMemo(() => {
        const uniqueSources = Array.from(new Set(allBookmarksAndHistory.map(item => item.source || item.itemType))).filter(s => s);
        
        const legendMap = new Map();
        uniqueSources.forEach((source, index) => {
            legendMap.set(source, {
                color: SOURCE_COLORS[index % SOURCE_COLORS.length],
                Shape: SOURCE_SHAPES[index % SOURCE_SHAPES.length]
            });
        });
        return Array.from(legendMap.entries()).map(([name, { color, Shape }]) => ({
            name,
            color,
            Shape
        }));
    }, [allBookmarksAndHistory]);

    const getSourceVisual = useCallback((item: Bookmark | BrowserHistoryEntry) => {
        const sourceName = item.source || item.itemType;
        const legendEntry = sourceLegend.find(entry => entry.name === sourceName);
        if (legendEntry) {
            const { color, Shape } = legendEntry;
            return <Shape color={color} size="1.2em" />;
        }
        return null;
    }, [sourceLegend]); 

    const sortedItems = useMemo(() => {
        return [...allBookmarksAndHistory].sort((a, b) => {
            let aVal: any, bVal: any;

            if (sortColumn === 'timestamp') {
                aVal = new Date(a.timestamp).getTime();
                bVal = new Date(b.timestamp).getTime();
            } else if (sortColumn === 'url') {
                aVal = a.url;
                bVal = b.url;
            } else if (sortColumn === 'title') {
                aVal = a.title;
                bVal = b.title;
            } else if (sortColumn === 'source') {
                aVal = (a.source || a.itemType);
                bVal = (b.source || b.itemType);
            } else if (sortColumn === 'itemType') {
                aVal = a.itemType;
                bVal = b.itemType;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allBookmarksAndHistory, sortColumn, sortDirection]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (column: string) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    return (
        <div className="page-container">
            <h1>History and Bookmarks</h1>
            <div className="bookmark-view-content">
                <div className="source-legend">
                    {sourceLegend.map((entry, index) => (
                        <div key={index} className="legend-item">
                            <entry.Shape color={entry.color} size="1.2em" />
                            <span>{entry.name}</span>
                        </div>
                    ))}
                </div>
                 {sortedItems.length > 0 ? (
                    <table className="futuristic-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('title')}>Title{getSortIndicator('title')}</th>
                                <th onClick={() => handleSort('url')}>URL{getSortIndicator('url')}</th>
                                <th onClick={() => handleSort('timestamp')}>Timestamp{getSortIndicator('timestamp')}</th>
                                <th onClick={() => handleSort('source')}>Source{getSortIndicator('source')}</th>
                                <th onClick={() => handleSort('itemType')}>Type{getSortIndicator('itemType')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map(item => {
                                const itemDate = new Date(item.timestamp);
                                const timeString = itemDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                const dateString = itemDate.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
                                return (
                                    <tr key={item.id}>
                                        <td className="bookmark-title-cell">{item.title}</td>
                                        <td className="bookmark-url-cell"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a></td>
                                        <td className="timestamp-cell">
                                            <div>{timeString}</div>
                                            <div className="date-line">{dateString}</div>
                                        </td>
                                        <td className="bookmark-source-cell">
                                            {getSourceVisual(item)}
                                        </td>
                                        <td className="bookmark-type-cell">
                                            {item.itemType === 'bookmark' ? <BookmarkIcon size="1.2em" /> : <ClockIcon size="1.2em" />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 ): <div className="no-items-placeholder"><h2>No History or Bookmarks</h2><p>Your history and bookmarks will appear here.</p></div>}
            </div>
        </div>
    );
};