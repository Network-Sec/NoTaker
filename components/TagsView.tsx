import React, { useMemo } from 'react';
import type { Memo } from '../types';

export const TagsView = ({ memos, onTagSelect }: { memos: Memo[], onTagSelect: (tag: string) => void }) => {
    const tagsWithCounts = useMemo(() => Array.from(memos.flatMap(m => m.tags).reduce((map, tag) => map.set(tag, (map.get(tag) || 0) + 1), new Map<string, number>())).sort((a, b) => a[0].localeCompare(b[0])), [memos]);
    if (tagsWithCounts.length === 0) return <div className="no-items-placeholder"><p>No tags yet.</p></div>;
    return <div className="tags-list">{tagsWithCounts.map(([tag, count]) => (<div key={tag} className="tag-list-item" onClick={() => onTagSelect(tag)}><span className="tag-name"># {tag}</span><span className="tag-count">{count}</span></div>))}</div>;
}; 