import React, { useMemo } from 'react';
import type { Memo } from '../types';

export const GalleryView = ({ memos, onImageSelect }: { memos: Memo[], onImageSelect: (date: Date) => void }) => {
    const imageMemos = useMemo(() => memos.filter(m => m.type === 'image').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [memos]);
    return <div className="page-container"><h1>Gallery</h1>{imageMemos.length === 0 ? <div className="no-items-placeholder"><h2>No Images</h2><p>Images from your stream will appear here.</p></div> : <div className="gallery-grid">{imageMemos.map(memo => (<div key={memo.id} className="gallery-item" onClick={() => onImageSelect(new Date(memo.timestamp))}><img src={memo.content} alt="memo content"/></div>))}</div>}</div>;
};  