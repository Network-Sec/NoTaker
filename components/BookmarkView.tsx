import React, { useState } from 'react';
import type { Bookmark } from '../types';

export const BookmarkView = ({ bookmarks, onAddBookmark, onDeleteBookmark }) => {
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !title.trim()) return;
        onAddBookmark(url, title);
        setUrl('');
        setTitle('');
    }; 

    return (
        <div className="page-container">
            <h1>Bookmarks</h1>
            <div className="bookmark-view-content">
                <form className="bookmark-form" onSubmit={handleSubmit}>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Bookmark Title"/>
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"/>
                    <button type="submit" className="primary-button">Add</button>
                </form>
                 {bookmarks.length > 0 ? (
                    <div className="bookmark-grid">
                        {bookmarks.map(bm => (
                            <div key={bm.id} className="bookmark-card">
                                <button className="bookmark-card-delete" onClick={() => onDeleteBookmark(bm.id)}>&times;</button>
                                <a href={bm.url} target="_blank" rel="noopener noreferrer">
                                    <h3>{bm.title}</h3>
                                    <p className="bookmark-url">{bm.url}</p>
                                </a>
                            </div>
                        ))}
                    </div>
                 ): <div className="no-items-placeholder" style={{minHeight: '200px'}}><h2>No Bookmarks</h2><p>Add your first bookmark using the form above.</p></div>}
            </div>
        </div>
    );
};