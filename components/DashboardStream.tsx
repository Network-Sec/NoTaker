import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import type { Memo, Bookmark, BrowserHistoryEntry, StreamCluster, StreamItem, InterleavedRightSideItem, InterleavedTimestampMarker } from '../types';
import { isSameDay, formatUrl, CODE_BLOCK_REGEX } from '../utils';
import { CodeBlock } from './CodeBlock';
import { MemoItem } from './MemoItem'; // Import MemoItem
import { RightSideItem } from './RightSideItem'; // Import RightSideItem
import { UnifiedStreamItem } from './UnifiedStreamItem'; // Import UnifiedStreamItem

interface Props {
    memos: Memo[];
    bookmarks: Bookmark[];
    history: BrowserHistoryEntry[];
    onTagSelect: (tag: string) => void;
    selectedDate: Date;
    onUpdateMemo: (id: number, content: string, tags: string[]) => void;
    onDeleteMemo: (id: number) => void;
    onOpenImageEditor: (memo: Memo) => void;
    onTimestampClick: (time: string) => void;
    onAddToToolbox?: (item: { url: string; title: string }) => void;
}

const DashboardStreamComponent = (
  { memos, bookmarks, history, onTagSelect, selectedDate, onUpdateMemo, onDeleteMemo, onOpenImageEditor, onTimestampClick, onAddToToolbox }: Props,
  ref: React.Ref<HTMLDivElement>
) => {
    const clusters = useMemo(() => {
        const dayFilter = (d: string) => {
            const result = isSameDay(new Date(d), selectedDate);
            return result;
        };
        
        const filteredMemos = memos.filter(m => dayFilter(m.timestamp));
        const filteredBookmarks = bookmarks.filter(b => dayFilter(b.timestamp));
        const filteredHistory = history.filter(h => dayFilter(h.visit_time));

        const allItems: StreamItem[] = [
            ...filteredMemos.map(m => ({ ...m, itemType: 'memo' as const })),
            ...filteredBookmarks.map(b => ({ ...b, itemType: 'bookmark' as const })),
            ...filteredHistory.map(h => ({ ...h, timestamp: h.visit_time, itemType: 'history' as const }))
        ];
        
        // Ascending order
        allItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Group by 10 minute chunks for cleaner clusters
        const groups: Record<string, StreamItem[]> = {};
        allItems.forEach(item => {
            const date = new Date(item.timestamp);
            const min = Math.floor(date.getMinutes() / 10) * 10;
            date.setMinutes(min, 0, 0);
            const key = date.toISOString();
            if(!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return Object.entries(groups).map(([time, items]) => {
            const memosInCluster = items.filter(i => i.itemType === 'memo') as Memo[];
            const rightSideItemsInCluster = items.filter(i => i.itemType === 'bookmark' || i.itemType === 'history') as (Bookmark | BrowserHistoryEntry)[];

            const interleavedRightSideItems: InterleavedRightSideItem[] = [];
            let lastTimestamp = new Date(time).getTime(); // Start with cluster's time

            rightSideItemsInCluster.forEach(item => {
                const itemTime = new Date(item.timestamp || (item as BrowserHistoryEntry).visit_time).getTime();

                // Insert timestamp marker if there's a significant gap
                // or if it's the first item and we need to show the cluster time.
                // Or if it's the first item and its time is different from the cluster start time
                if (interleavedRightSideItems.length === 0 && itemTime > lastTimestamp) {
                     interleavedRightSideItems.push({
                        id: `ts-${Date.now()}-initial`,
                        type: 'timestamp-marker',
                        timestamp: new Date(lastTimestamp).toISOString(),
                        label: new Date(lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                } else if (itemTime - lastTimestamp > 10 * 60 * 1000) { // If gap > 10 minutes
                    interleavedRightSideItems.push({
                        id: `ts-${Date.now()}-${itemTime}`,
                        type: 'timestamp-marker',
                        timestamp: new Date(itemTime).toISOString(),
                        label: new Date(itemTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
                
                interleavedRightSideItems.push(item);
                lastTimestamp = itemTime;
            });

            // If no right-side items, but memos exist, still provide the timestamp marker
            if (interleavedRightSideItems.length === 0 && memosInCluster.length > 0) {
                 interleavedRightSideItems.push({
                    id: `ts-${Date.now()}-cluster-only`,
                    type: 'timestamp-marker',
                    timestamp: new Date(time).toISOString(),
                    label: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            } 

            return {
                time, // Still keep time for keying if needed, but not passed to UnifiedStreamItem
                memoItems: memosInCluster,
                rightSideItems: interleavedRightSideItems
            };
        });
    }, [memos, bookmarks, history, selectedDate]);

    if (clusters.length === 0) return <div className="empty-stream">No activity on this day.</div>;

    return (
        <div className="dashboard-stream custom-scrollbar" ref={ref}>
            {clusters.map((cluster) => (
                <UnifiedStreamItem
                    key={cluster.time}
                    contentItems={cluster.memoItems}
                    rightSideItems={cluster.rightSideItems}
                    onTagSelect={onTagSelect} 
                    onUpdateMemo={onUpdateMemo} 
                    onDeleteMemo={onDeleteMemo} 
                    onOpenImageEditor={onOpenImageEditor} 
                    onTimestampClick={(time) => {
                        onTimestampClick(time);
                    }}
                    onAddToToolbox={onAddToToolbox}
                />
            ))}
        </div>
    );
};

export const DashboardStream = forwardRef(DashboardStreamComponent); 