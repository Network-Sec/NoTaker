import React, { useState, useEffect, useMemo } from 'react';
import type { Notebook } from '../types';
import { BlockEditor } from './BlockEditor';

export const NotebookView = ({ notebooks, onAddNotebook, onUpdateNotebook, onDeleteNotebook }) => {
    const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);

    const selectedNotebook = useMemo(() => notebooks.find(n => n.id === selectedNotebookId), [notebooks, selectedNotebookId]);

    useEffect(() => {
        if (!selectedNotebookId && notebooks.length > 0) setSelectedNotebookId(notebooks[0].id);
        if (notebooks.length > 0 && !notebooks.find(n => n.id === selectedNotebookId)) setSelectedNotebookId(notebooks[0]?.id || null)
    }, [notebooks, selectedNotebookId]);
 
    return (
        <div className="page-container">
            <h1>Notebooks</h1>
            <div className="notebook-view">
                <aside className="notebook-sidebar">
                    <div className="notebook-sidebar-header">
                        <button className="primary-button" onClick={onAddNotebook} style={{width: "100%"}}>+ New Notebook</button>
                    </div>
                    <div className="notebook-list">
                        {notebooks.map(nb => (
                            <div key={nb.id} className={`notebook-list-item ${nb.id === selectedNotebookId ? 'active' : ''}`} onClick={() => setSelectedNotebookId(nb.id)}>
                                <h3>{nb.title || "Untitled Notebook"}</h3>
                                <p>{new Date(nb.timestamp).toLocaleDateString()}</p>
                                <button className="notebook-delete-button" onClick={(e) => { e.stopPropagation(); onDeleteNotebook(nb.id); }}>&times;</button>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="notebook-editor">
                    {selectedNotebook ? (
                        <>
                            <input
                                type="text"
                                className="notebook-title-input"
                                value={selectedNotebook.title}
                                onChange={e => onUpdateNotebook(selectedNotebookId, { title: e.target.value })}
                                placeholder="Untitled Notebook"
                            />
                            <BlockEditor
                                key={selectedNotebook.id}
                                blocks={selectedNotebook.blocks || []}
                                onUpdate={(updates) => onUpdateNotebook(selectedNotebookId, updates)}
                            />
                        </>
                    ) : <div className="no-items-placeholder"><h2>No Notebook Selected</h2><p>Create a new notebook or select one from the list.</p></div>}
                </main>
            </div>
        </div>
    );
};