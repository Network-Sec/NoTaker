import React from 'react';
import type { Memo, AIConversationItem, Bookmark, BrowserHistoryEntry, InterleavedRightSideItem, InterleavedTimestampMarker } from '../types';
import { MemoItem } from './MemoItem'; 
import { RightSideItem } from './RightSideItem'; 
import { AIChatItem } from './AIChatItem'; // Import AIChatItem

interface UnifiedStreamItemProps {
    contentItems: Array<Memo | AIConversationItem>; // Changed from memoItems
    rightSideItems: InterleavedRightSideItem[]; 
    // Props passed down to MemoItem, AIChatItem and RightSideItem
    onTagSelect: (tag: string) => void;
    onUpdateMemo: (id: number, content: string, tags: string[]) => void;
    onDeleteMemo: (id: number) => void;
    onOpenImageEditor: (memo: Memo) => void;
    onTimestampClick: (time: string) => void;
    onAddToToolbox?: (item: { url: string; title: string }) => void;
}

export const UnifiedStreamItem = ({ 
    contentItems, // Changed from memoItems 
    rightSideItems,
    onTagSelect,
    onUpdateMemo,
    onDeleteMemo,
    onOpenImageEditor,
    onTimestampClick,
    onAddToToolbox
}: UnifiedStreamItemProps) => {
    return (
 <div className="unified-stream-row">
            {/* Main Content (Memo or AI) */}
            <div className="unified-memo-content">
                {contentItems.map(item => {
                    if ('type' in item && (item as AIConversationItem).type === 'user' || (item as AIConversationItem).type === 'ai') {
                        // It's an AIConversationItem
                        return (
                            <AIChatItem
                                key={item.id}
                                item={item as AIConversationItem}
                            />
                        );
                    } else {
                        // It's a Memo
                        return (
                            <MemoItem
                                key={item.id}
                                memo={item as Memo}
                                onTagSelect={onTagSelect}
                                onUpdateMemo={onUpdateMemo}
                                onDeleteMemo={onDeleteMemo}
                                onOpenImageEditor={onOpenImageEditor}
                                onAddToToolbox={onAddToToolbox}
                            />
                        );
                    }
                })}
            </div>

            {/* Right Side Content (Bookmarks/History & Interleaved Timestamps/Dots) */}
            <div className="unified-right-side-content">
                {rightSideItems.map((item, index) => {
                    if (item.type === 'timestamp-marker') { // Check for the new type
                        const timestampMarker = item as InterleavedTimestampMarker;
                        return (
                            <div key={timestampMarker.id} className="unified-timestamp-marker-block">
                                <div className="unified-dynamic-dots-before"></div>
                                <div 
                                    className="unified-time-display" 
                                    onClick={() => {
                                        console.log('[UnifiedStreamItem] Timestamp clicked:', timestampMarker.timestamp);
                                        onTimestampClick(timestampMarker.timestamp);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {new Date(timestampMarker.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="unified-dynamic-dots-after"></div>
                            </div>
                        );
                    } else {
                        return (
                            <RightSideItem 
                                key={item.id} 
                                item={item as (Bookmark | BrowserHistoryEntry)} 
                                onTimestampClick={onTimestampClick}
                                onAddToToolbox={onAddToToolbox}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
};
 