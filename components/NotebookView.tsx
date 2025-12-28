import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Notebook } from '../types';
import { BlockEditor } from './BlockEditor';
import * as db from '../services/db';
import { Plus, X } from 'lucide-react'; // Import icons

export const NotebookView = () => {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Load Notebooks on Mount
    useEffect(() => {
        db.getNotebooks().then(nbs => {
            setNotebooks(nbs || []);
            setLoading(false);
        });
    }, []);

    // Save on Change (Debounced ideally, but direct for now to match prev behavior)
    useEffect(() => {
        if (!loading && notebooks.length > 0) { // Only save if not loading and there are notebooks
            db.saveNotebooks(notebooks);
        } else if (!loading && notebooks.length === 0 && selectedNotebookId !== null) { // If all notebooks are deleted
            db.saveNotebooks([]);
        }
    }, [notebooks, loading, selectedNotebookId]);

    const selectedNotebook = useMemo(() => notebooks.find(n => n.id === selectedNotebookId), [notebooks, selectedNotebookId]);

    useEffect(() => {
        // Automatically select the first notebook if none is selected and notebooks exist
        if (notebooks.length > 0 && !selectedNotebookId) {
            setSelectedNotebookId(notebooks[0].id);
        } 
        // If the selected notebook is deleted, clear selection or select first
        else if (selectedNotebookId && !notebooks.find(n => n.id === selectedNotebookId)) {
            setSelectedNotebookId(notebooks.length > 0 ? notebooks[0].id : null);
        }
    }, [notebooks, selectedNotebookId]);

    const addNotebook = useCallback(() => {
        const newNb: Notebook = {
            id: Date.now(), 
            timestamp: new Date().toISOString(), 
            title: 'Untitled Notebook', 
            blocks: []
        };
        setNotebooks(prev => [newNb, ...prev]);
        setSelectedNotebookId(newNb.id);
    }, []);

    const updateNotebook = useCallback((id: number, updates: Partial<Notebook>) => {
        setNotebooks(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const deleteNotebook = useCallback((id: number) => {
        if(confirm("Delete this notebook?")) {
            setNotebooks(prev => prev.filter(n => n.id !== id));
            // Selection logic is handled by the useEffect above
        }
    }, []);
 
    return (
        <div className="flex h-full w-full bg-background font-sans text-gray-300 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-surface z-10 shadow-[5px_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4 tracking-tight uppercase font-mono">Notebooks</h2>
                    <button 
                        onClick={addNotebook}
                        className="w-full py-2 tech-btn flex items-center justify-center gap-2 font-bold tracking-wider bg-techCyan/20 text-white hover:bg-techCyan/40" // Override bg for primary color
                    >
                        <Plus size={16} /> NEW_NOTEBOOK
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-4">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 font-mono text-sm animate-pulse">LOADING_NOTEBOOKS...</div>
                    ) : notebooks.length === 0 ? (
                        <div className="p-4 text-center text-gray-600 font-mono text-xs">NO_NOTEBOOKS_YET</div>
                    ) : (
                        notebooks.map(nb => (
                            <div 
                                key={nb.id} 
                                className={`tech-item group ${nb.id === selectedNotebookId ? 'active' : ''}`} // Using tech-item
                                onClick={() => setSelectedNotebookId(nb.id)}
                            >
                                <div className="flex justify-between items-center w-full"> {/* Changed items-start to items-center */}
                                    <div className="overflow-hidden">
                                        <h3 className="font-semibold truncate text-sm text-gray-300 group-hover:text-white group-[.active]:text-white font-mono">{nb.title || "Untitled"}</h3> {/* Added font-mono */}
                                        <p className="text-xs opacity-60 font-mono text-gray-500 group-hover:text-gray-400">{new Date(nb.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        className="tech-btn-secondary p-1" // Using tech-btn-secondary and adjusted padding
                                        onClick={(e) => { e.stopPropagation(); deleteNotebook(nb.id); }}
                                    >
                                        <X size={12} /> {/* Smaller X icon */}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Editor Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                {selectedNotebook ? (
                    <div className="flex flex-col h-full p-4 md:p-8 max-w-7xl mx-auto w-full"> {/* Reduced padding slightly */}
                        <input
                            type="text"
                            className="tech-input text-4xl p-4 bg-transparent border-none text-white mb-6" // Added font-mono
                            value={selectedNotebook.title}
                            onChange={e => updateNotebook(selectedNotebookId!, { title: e.target.value })}
                            placeholder="Untitled Notebook"
                        />
                        <div className="flex-1 tech-panel p-6 shadow-xl min-h-[500px]"> {/* Using tech-panel */}
                             <BlockEditor
                                key={selectedNotebook.id}
                                blocks={selectedNotebook.blocks || []}
                                onUpdate={(updates) => updateNotebook(selectedNotebookId!, updates)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 font-mono"> {/* Changed text-gray-500 to text-gray-400 font-mono */}
                        <div className="text-6xl mb-4 opacity-20 text-techCyan">📓</div> {/* Added text-techCyan */}
                        <h2 className="text-xl font-light font-mono">SELECT_NOTEBOOK_OR_CREATE_NEW</h2> {/* Uppercase, better phrasing */}
                    </div>
                )}
            </main>
        </div>
    );
};