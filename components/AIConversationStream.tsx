import React, { useMemo, forwardRef } from 'react';
import type { AIConversationItem, Bookmark, BrowserHistoryEntry, InterleavedRightSideItem, InterleavedTimestampMarker } from '../types';
import { isSameDay } from '../utils';
import { UnifiedStreamItem } from './UnifiedStreamItem'; // Import UnifiedStreamItem

// Define a type for AI stream clusters, similar to StreamCluster
interface AIAssistStreamCluster {
    clusterTime: string;
    aiItems: AIConversationItem[];
    rightSideItems: InterleavedRightSideItem[];
}

interface Props {
    aiConversations: AIConversationItem[];
    bookmarks: Bookmark[];
    history: BrowserHistoryEntry[];
    selectedDate: Date; // Added selectedDate
    // Props for UnifiedStreamItem (passed from index.tsx)
    onTagSelect: (tag: string) => void;
    onUpdateMemo: (id: number, content: string, tags: string[]) => void; // Unused for AI, but for prop drilling
    onDeleteMemo: (id: number) => void; // Unused for AI, but for prop drilling
    onOpenImageEditor: (memo: Memo) => void; // Unused for AI, but for prop drilling
    onTimestampClick: (time: string) => void;
}

const AIConversationStreamComponent = (
  { aiConversations, bookmarks, history, selectedDate, onTagSelect, onUpdateMemo, onDeleteMemo, onOpenImageEditor, onTimestampClick }: Props, // Destructure selectedDate
  ref: React.Ref<HTMLDivElement>
) => {
    
    const clusters = useMemo(() => {
        const dayFilter = (d: string) => isSameDay(new Date(d), selectedDate); // Define dayFilter
        
        const allItems: (AIConversationItem & { itemType: 'ai_conv' }) | (Bookmark & { itemType: 'bookmark' }) | (BrowserHistoryEntry & { itemType: 'history'; timestamp: string; })[] = [
            ...aiConversations.map(m => ({ ...m, itemType: 'ai_conv' as const })),
            ...bookmarks.filter(b => dayFilter(b.timestamp)).map(b => ({ ...b, itemType: 'bookmark' as const })), // Filter bookmarks
            ...history.filter(h => dayFilter(h.visit_time)).map(h => ({ ...h, timestamp: h.visit_time, itemType: 'history' as const })) // Filter history
        ];

        // Sort all items chronologically
        allItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Group by 10 minute chunks for cleaner clusters
        const groups: Record<string, typeof allItems> = {};
        allItems.forEach(item => {
            const date = new Date(item.timestamp);
            const min = Math.floor(date.getMinutes() / 10) * 10; // Group into 10-minute intervals
            date.setMinutes(min, 0, 0);
            const key = date.toISOString();
            if(!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return Object.entries(groups).map(([time, items]) => {
            const aiItemsInCluster = items.filter(i => i.itemType === 'ai_conv') as (AIConversationItem & { itemType: 'ai_conv' })[];
            const rightSideItemsInCluster = items.filter(i => i.itemType === 'bookmark' || i.itemType === 'history') as (Bookmark | BrowserHistoryEntry)[];

            const interleavedRightSideItems: InterleavedRightSideItem[] = [];
            let lastTimestamp = new Date(time).getTime(); // Start with cluster's time

            rightSideItemsInCluster.forEach(item => {
                const itemTime = new Date(item.timestamp || (item as BrowserHistoryEntry).visit_time).getTime();

                // Insert timestamp marker if there's a significant gap
                if (interleavedRightSideItems.length === 0 && itemTime > lastTimestamp) {
                     interleavedRightSideItems.push({
                        id: `ts-${Date.now()}-initial-${item.id}`,
                        type: 'timestamp-marker',
                        timestamp: new Date(lastTimestamp).toISOString(),
                        label: new Date(lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                } else if (itemTime - lastTimestamp > 10 * 60 * 1000) { // If gap > 10 minutes
                    interleavedRightSideItems.push({
                        id: `ts-${Date.now()}-${itemTime}-${item.id}`,
                        type: 'timestamp-marker',
                        timestamp: new Date(itemTime).toISOString(),
                        label: new Date(itemTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
                
                interleavedRightSideItems.push(item);
                lastTimestamp = itemTime;
            });

            return {
                time, 
                aiItems: aiItemsInCluster.map(item => item as AIConversationItem), // Cast back to AIConversationItem
                rightSideItems: interleavedRightSideItems
            };
        });
    }, [aiConversations, bookmarks, history, selectedDate]); // Add selectedDate to dependencies

    if (clusters.length === 0) return <div className="empty-stream">Start a conversation with AI!</div>;

    return (
        <div className="dashboard-stream custom-scrollbar" ref={ref}>
            {clusters.map((cluster) => (
                <UnifiedStreamItem
                    key={cluster.time}
                    contentItems={cluster.aiItems} 
                    rightSideItems={cluster.rightSideItems}
                    onTagSelect={onTagSelect}
                    onUpdateMemo={onUpdateMemo}
                    onDeleteMemo={onDeleteMemo}
                    onOpenImageEditor={onOpenImageEditor}
                    onTimestampClick={onTimestampClick}
                />
            ))}
        </div>
    );
};

export const AIConversationStream = forwardRef(AIConversationStreamComponent);
