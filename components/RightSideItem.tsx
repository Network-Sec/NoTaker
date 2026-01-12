import React from 'react';
import type { Bookmark, BrowserHistoryEntry } from '../types';
import { formatUrl } from '../utils';

interface RightSideItemProps {
    item: Bookmark | BrowserHistoryEntry;
    onTimestampClick: (time: string) => void;
    onAddToToolbox?: (item: { url: string; title: string }) => void;
}

export const RightSideItem = ({ item, onTimestampClick, onAddToToolbox }: RightSideItemProps) => {
    const timestamp = (item as Bookmark).timestamp || (item as BrowserHistoryEntry).visit_time;
    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <div 
            className="right-side-item" 
            data-id={item.id} 
            data-timestamp={timestamp}
            style={{ padding: '4px 12px 4px 16px' }} // Reduce padding override
        >
            <div className="rs-item-header" style={{ alignItems: 'center' }}>
                <a href={item.url} target="_blank" rel="noreferrer" className="rs-title" title={item.title || item.url} style={{ fontSize: '0.8rem' }}>
                    {item.title || item.url}
                </a>
                <div className="rs-controls" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {/* onAddToToolbox button removed from here */}
                    {timestamp && (
                        <span 
                            className="rs-timestamp" 
                            onClick={() => onTimestampClick(timestamp)}
                            style={{ cursor: 'pointer', position: 'static', marginLeft: '5px', fontSize: '10px' }}
                        >
                            {formattedTime}
                        </span>
                    )}
                </div>
            </div>
            <div className="rs-url" style={{ fontSize: '12px', marginTop: '0' }}>{formatUrl(item.url)}</div>
        </div>
    );
};