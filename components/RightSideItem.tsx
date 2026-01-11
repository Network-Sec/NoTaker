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
                    {onAddToToolbox && (
                        <button 
                            className="rs-toolbox-btn-static" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToToolbox({ url: item.url, title: item.title });
                            }}
                            title="Add to Toolbox"
                            style={{
                                background: 'transparent',
                                border: '1px solid #3b82f6',
                                borderRadius: '4px',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                width: '24px',
                                height: '24px'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        </button>
                    )}
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