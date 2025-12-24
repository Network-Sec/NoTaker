import React from 'react';
import type { Bookmark, BrowserHistoryEntry } from '../types';
import { formatUrl } from '../utils';

interface RightSideItemProps {
    item: Bookmark | BrowserHistoryEntry;
    onTimestampClick: (time: string) => void;
}

export const RightSideItem = ({ item, onTimestampClick }: RightSideItemProps) => {
    const timestamp = (item as Bookmark).timestamp || (item as BrowserHistoryEntry).visit_time;
    const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <div 
            className="right-side-item" 
            data-id={item.id} 
            data-timestamp={timestamp}
        >
            <div className="rs-item-header">
                <a href={item.url} target="_blank" rel="noreferrer" className="rs-title" title={item.title || item.url}>
                    {item.title || item.url}
                </a>
                {timestamp && (
                    <span 
                        className="rs-timestamp" 
                        onClick={() => onTimestampClick(timestamp)}
                        style={{ cursor: 'pointer' }}
                    >
                        {formattedTime}
                    </span>
                )}
            </div>
            <div className="rs-url">{formatUrl(item.url)}</div>
        </div>
    );
};