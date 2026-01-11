import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmationModal from './ConfirmationModal';
import type { Notebook } from '../types';
import { BlockEditor } from './BlockEditor';
import * as db from '../services/db';
import { Plus, X, ChevronRight, ChevronDown, FileText, Folder, Download, Printer, MoreVertical } from 'lucide-react'; // Added icons

// --- Helper Types ---
interface NotebookNode extends Notebook {
    children: NotebookNode[];
    level: number;
}

// --- Helper Functions ---
const buildTree = (notebooks: Notebook[]): NotebookNode[] => {
    const nodeMap: { [key: number]: NotebookNode } = {};
    const roots: NotebookNode[] = [];

    // 1. Initialize Nodes
    notebooks.forEach(nb => {
        nodeMap[nb.id] = { ...nb, children: [], level: 0 };
    });

    // 2. Build Hierarchy
    notebooks.forEach(nb => {
        const node = nodeMap[nb.id];
        if (nb.parentId && nodeMap[nb.parentId]) {
            node.level = nodeMap[nb.parentId].level + 1;
            nodeMap[nb.parentId].children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

// --- Recursive Tree Item Component ---
const NotebookTreeItem = ({ 
    node, 
    selectedId, 
    onSelect, 
    onAddSubpage, 
    onDelete,
    expandedIds,
    toggleExpanded
}: { 
    node: NotebookNode, 
    selectedId: number | null, 
    onSelect: (id: number) => void, 
    onAddSubpage: (parentId: number, e: React.MouseEvent) => void, 
    onDelete: (id: number, e: React.MouseEvent) => void,
    expandedIds: Set<number>,
    toggleExpanded: (id: number, e: React.MouseEvent) => void
}) => {
    const isSelected = node.id === selectedId;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
        <div>
            <div 
                className={`group flex items-center justify-between py-1 px-2 mb-0.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-techCyan/20 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                style={{ paddingLeft: `${(node.level * 12) + 8}px` }}
                onClick={() => onSelect(node.id)}
            >
                <div className="flex items-center min-w-0 flex-1 gap-1.5">
                    {/* Expand/Collapse or Icon */}
                    <div 
                        className={`p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'visible' : 'invisible'}`}
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id, e); }}
                    >
                         {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                    
                    {/* Icon based on content/children */}
                    {hasChildren ? <Folder size={14} className={isSelected ? "text-techCyan" : "text-gray-500"} /> : <FileText size={14} className={isSelected ? "text-techCyan" : "text-gray-500"} />}

                    <span className={`truncate text-sm font-mono ${isSelected ? 'font-bold' : ''}`}>
                        {node.title || "Untitled"}
                    </span>
                </div>

                {/* Actions (visible on hover or selected) */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                    <button 
                        className="p-1 hover:bg-techCyan/20 text-gray-500 hover:text-techCyan rounded"
                        onClick={(e) => onAddSubpage(node.id, e)}
                        title="Add Subpage"
                    >
                        <Plus size={12} />
                    </button>
                    <button 
                        className="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded"
                        onClick={(e) => onDelete(node.id, e)}
                        title="Delete"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Render Children */}
            {isExpanded && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <NotebookTreeItem 
                            key={child.id} 
                            node={child} 
                            selectedId={selectedId} 
                            onSelect={onSelect} 
                            onAddSubpage={onAddSubpage} 
                            onDelete={onDelete}
                            expandedIds={expandedIds}
                            toggleExpanded={toggleExpanded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const NotebookView = () => {
    // ... existing state ...
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'visual' | 'source'>('source'); // Changed default to 'source' 
    
    // UI State for Tree
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [showExportMenu, setShowExportMenu] = useState(false); // New state

    // State for Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [notebookToDelete, setNotebookToDelete] = useState<number | null>(null);

    // ... existing useEffects ...
    // Load Notebooks on Mount
    useEffect(() => {
        db.getNotebooks().then(nbs => {
            const loaded = nbs || [];
            setNotebooks(loaded);
            setLoading(false);
            // Default select
             if (loaded.length > 0 && !selectedNotebookId) {
                setSelectedNotebookId(loaded[0].id);
                setExpandedIds(new Set(loaded.map(n => n.id)));
            }
        });
    }, []);

    // Save on Change
    useEffect(() => {
        if (!loading && notebooks.length > 0) {
            db.saveNotebooks(notebooks);
        } else if (!loading && notebooks.length === 0 && selectedNotebookId !== null) {
            db.saveNotebooks([]);
        }
    }, [notebooks, loading]);

    // ... existing logic ...
    const selectedNotebook = useMemo(() => notebooks.find(n => n.id === selectedNotebookId), [notebooks, selectedNotebookId]);
    const notebookTree = useMemo(() => buildTree(notebooks), [notebooks]);

    const toggleExpanded = useCallback((id: number, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const addNotebook = useCallback((parentId: number | null = null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newNb: Notebook = {
            id: Date.now(), 
            timestamp: new Date().toISOString(), 
            title: parentId ? 'Untitled Subpage' : 'Untitled Notebook', 
            blocks: [],
            rawMarkdownContent: '', // Initialize with empty markdown content
            parentId: parentId
        };
        setNotebooks(prev => [...prev, newNb]);
        setSelectedNotebookId(newNb.id);
        if (parentId) setExpandedIds(prev => new Set(prev).add(parentId));
    }, []);

    const updateNotebook = useCallback((id: number, updates: Partial<Notebook>) => {
        setNotebooks(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const deleteNotebook = useCallback((id: number, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setNotebookToDelete(id);
        setModalTitle('Confirm Deletion');
        setModalMessage('Are you sure you want to delete this notebook and all its subpages? This action cannot be undone.');
        setShowConfirmModal(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (notebookToDelete === null) return;

        const idsToDelete = new Set<number>();
        const collectIds = (targetId: number, allNbs: Notebook[]) => {
            idsToDelete.add(targetId);
            const children = allNbs.filter(n => n.parentId === targetId);
            children.forEach(c => collectIds(c.id, allNbs));
        };
        collectIds(notebookToDelete, notebooks);
                let newSelectedIdAfterDeletion: number | null = null;
                setNotebooks(prev => {
                    const remainingNotebooks = prev.filter(n => !idsToDelete.has(n.id));
                    if (remainingNotebooks.length > 0) {
                        newSelectedIdAfterDeletion = remainingNotebooks[0].id;
                    }
                    return remainingNotebooks;
                });
                
                setSelectedNotebookId(newSelectedIdAfterDeletion);
                setShowConfirmModal(false);
                setNotebookToDelete(null);
            }, [notebookToDelete, notebooks]);
    const handleCancelDelete = useCallback(() => {
        setShowConfirmModal(false);
        setNotebookToDelete(null);
    }, []);

    // --- Export Functions ---
    const handleDownloadMarkdown = () => {
        if (!selectedNotebook) return;
        // Re-construct markdown from blocks (rudimentary) or use what we have? 
        // We don't store raw markdown in `blocks` prop (it's the array), but BlockEditor has logic.
        // Actually, we store `blocks` array in DB. We need to convert it to string.
        // I'll borrow the helper from BlockEditor (but it's not exported). 
        // Let's copy the helper here or duplicate logic. 
        // Logic: Iterate blocks.
        
        const markdown = selectedNotebook.blocks.map((b: any) => {
             if (b.type === 'h1') return `# ${b.content}`;
             if (b.type === 'h2') return `## ${b.content}`;
             if (b.type === 'h3') return `### ${b.content}`;
             if (b.type === 'checklist') return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
             if (b.type === 'ul') return `- ${b.content}`;
             if (b.type === 'ol') return `1. ${b.content}`;
             if (b.type === 'blockquote') return `> ${b.content}`;
             if (b.type === 'code') return `\`${b.content}\'`;
             return b.content;
        }).join('\n\n');

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedNotebook.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const handlePrintPdf = () => {
        window.print();
        setShowExportMenu(false);
    };
 
    return (
        <div className="flex h-full w-full bg-background font-sans text-gray-300 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-surface z-10 shadow-[5px_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white tracking-wider uppercase font-mono">Notebooks</h2>
                    <button 
                        onClick={(e) => addNotebook(null, e)}
                        className="p-1.5 bg-techCyan/20 hover:bg-techCyan/40 text-techCyan rounded transition-colors"
                        title="New Root Notebook"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 font-mono text-sm animate-pulse">LOADING...</div>
                    ) : notebooks.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center opacity-50">
                            <Folder size={32} className="mb-2 text-gray-600" />
                            <p className="text-xs font-mono text-gray-500">NO_NOTEBOOKS</p>
                            <button onClick={(e) => addNotebook(null, e)} className="mt-4 text-techCyan text-xs underline">Create First</button>
                        </div>
                    ) : (
                        notebookTree.map(node => (
                            <NotebookTreeItem 
                                key={node.id} 
                                node={node} 
                                selectedId={selectedNotebookId} 
                                onSelect={setSelectedNotebookId} 
                                onAddSubpage={addNotebook} 
                                onDelete={deleteNotebook}
                                expandedIds={expandedIds}
                                toggleExpanded={toggleExpanded}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* Main Editor Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                {selectedNotebook ? (
                    <div id="notebook-print-area" className="flex flex-col h-full p-4 md:p-8 max-w-7xl mx-auto w-full"> 
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                className="tech-input text-4xl p-4 bg-transparent border-none text-white flex-grow mr-4 font-mono font-bold placeholder-gray-700 focus:placeholder-gray-600" 
                                value={selectedNotebook.title}
                                onChange={e => updateNotebook(selectedNotebookId!, { title: e.target.value })}
                                placeholder="Untitled Notebook"
                            />
                            
                            {/* Header Actions (Toggle + Export) - Hidden in Print */}
                            <div className="notebook-header-actions flex items-center gap-4">
                                {/* Futuristic Toggle Switch: EDIT (Source) <=> PREVIEW (Visual) */}
                                <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1 cursor-pointer select-none shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                                                                                                                                                                    <div 
                                                                                                                                                                        onClick={() => setViewMode('source')}
                                                                                                                                                                        className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer border border-transparent ${viewMode === 'source' ? 'bg-black/60 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'text-blue-600 hover:text-blue-400'}`}
                                                                                                                                                                    >
                                                                                                                                                                        EDIT
                                                                                                                                                                    </div>
                                                                                                                                                                    <div 
                                                                                                                                                                        onClick={() => setViewMode('visual')}
                                                                                                                                                                        className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer border border-transparent ${viewMode === 'visual' ? 'bg-black/60 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-green-600 hover:text-green-400'}`}
                                                                                                                                                                    >
                                                                                                                                                                        PREVIEW
                                                                                                                                                                    </div>                                </div>

                                {/* Export Menu */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="p-2 bg-surface border border-white/10 rounded-md hover:bg-white/10 text-gray-300 transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {showExportMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-40 bg-[#1e1e1e] border border-white/10 rounded-md shadow-2xl z-50 flex flex-col py-1">
                                            <button 
                                                onClick={handleDownloadMarkdown}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-techCyan/20 hover:text-white text-left"
                                            >
                                                <Download size={14} /> Download MD
                                            </button>
                                            <button 
                                                onClick={handlePrintPdf}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-techCyan/20 hover:text-white text-left"
                                            >
                                                <Printer size={14} /> Print / PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 tech-panel p-6 shadow-xl flex flex-col relative overflow-y-auto custom-scrollbar"> 
                             <BlockEditor
                                key={selectedNotebook.id}
                                blocks={selectedNotebook.blocks || []}
                                rawMarkdownContent={selectedNotebook.rawMarkdownContent} // Pass raw markdown content
                                onUpdate={(updates) => updateNotebook(selectedNotebookId!, updates)}
                                viewMode={viewMode}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 font-mono"> 
                        <div className="text-6xl mb-4 opacity-20 text-techCyan animate-pulse">📓</div> 
                        <h2 className="text-xl font-light font-mono opacity-50">SELECT_NOTEBOOK</h2> 
                    </div>
                )}
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    title={modalTitle}
                    message={modalMessage}
                />
            </main>
        </div>
    );
};