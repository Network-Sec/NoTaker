import React, { useState } from 'react';
import type { ToolboxItem } from '../types';
import { formatUrl } from '../utils';
import { Trash2, Edit, ExternalLink } from 'lucide-react';

interface ToolboxViewProps {
    items?: ToolboxItem[];
    onDelete?: (id: number) => void;
    onEdit?: (item: ToolboxItem) => void;
}

export const ToolboxView = ({ items = [], onDelete, onEdit }: ToolboxViewProps) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ToolboxItem | null>(null);

    const handleEditClick = (item: ToolboxItem) => {
        setEditingItem(item);
        setEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (editingItem && onEdit) {
            onEdit(editingItem);
        }
        setEditModalOpen(false);
        setEditingItem(null);
    };

    const handleCancelEdit = () => {
        setEditModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="flex h-full w-full bg-background font-sans text-gray-300 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 py-8 w-full">
                <h1 className="text-3xl font-bold text-white mb-8 border-b border-white/5 pb-4 uppercase tracking-wider font-mono">
                    <span className="text-techCyan">//</span> TOOLBOX_DASHBOARD
                </h1>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 auto-rows-max">
                    {items.map(item => (
                        <div 
                            key={item.id} 
                            className="tech-panel relative group flex flex-col justify-between p-3 cursor-pointer h-56 w-full overflow-hidden" // Adjusted padding to p-3
                        >
                            {/* Controls (visible on hover) */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"> {/* Adjusted gap to gap-1 */}
                                {onEdit && (
                                    <button 
                                        className="tech-btn-secondary p-1" // Adjusted padding
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEditClick(item);
                                        }}
                                        title="EDIT_TOOLBOX_ITEM"
                                    >
                                        <Edit size={14} /> {/* Smaller icon */}
                                    </button>
                                )}
                                {onDelete && (
                                    <button 
                                        className="tech-btn-secondary p-1" // Adjusted padding
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if(confirm('REMOVE_TOOLBOX_ITEM?')) onDelete(item.id);
                                        }}
                                        title="REMOVE_TOOLBOX_ITEM"
                                    >
                                        <Trash2 size={14} /> {/* Smaller icon */}
                                    </button>
                                )}
                            </div>

                            {/* Main Content Area - Clickable link */}
                            <a href={item.url} target="_blank" rel="noreferrer" className="flex flex-col items-center flex-grow justify-center w-full h-full text-center py-2">
                                {/* Icon / Image */}
                                <div className="flex items-center justify-center w-full h-20 overflow-hidden mb-2 rounded bg-black/20 border border-white/10 group-hover:border-techCyan/50 transition-colors">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : item.iconUrl ? (
                                        <img src={item.iconUrl} alt={item.title} className="w-12 h-12 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                                    ) : (
                                        <div className="text-4xl text-gray-500">📦</div>
                                    )}
                                </div>

                                {/* Title & URL */}
                                <div className="w-full px-1">
                                    <div className="text-sm font-semibold text-white truncate w-full font-mono">{item.title || formatUrl(item.url)}</div> {/* Changed text-gray-200 to text-white */}
                                    <div className="text-sm text-white/80 truncate w-full font-mono mt-1 flex items-center justify-center gap-1"> {/* Changed text-gray-400 to text-white/80 */}
                                        <ExternalLink size={12} className="text-techOrange" />
                                        {formatUrl(item.url)}
                                    </div>
                                </div>
                            </a>

                            {/* Meta info at bottom */}
                            <div className="w-full text-center text-xs text-white/60 font-mono mt-2"> {/* Changed text-gray-500 to text-white/60 */}
                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                                {item.description && (
                                    <p className="text-xs text-white/50 truncate mt-1 px-1">{item.description}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for empty state */}
                    {items.length === 0 && (
                        <div className="col-span-full tech-panel flex flex-col items-center justify-center py-16 text-gray-500 border-dashed border-gray-700">
                            <div className="text-6xl mb-4 opacity-30 text-techCyan">🛠️</div>
                            <h2 className="text-xl font-light text-gray-400 font-mono">TOOLBOX_EMPTY</h2>
                            <p className="text-sm mt-2 opacity-60 font-mono">ADD_ITEMS_FROM_HISTORY_OR_BOOKMARKS_VIEW</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal (Placeholder) */}
            {editModalOpen && editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="tech-panel p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">EDIT_TOOLBOX_ITEM</h2>
                        <label className="block text-gray-400 text-sm mb-2">TITLE</label>
                        <input
                            type="text"
                            className="tech-input w-full p-2 mb-4"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                        />
                        <label className="block text-gray-400 text-sm mb-2">URL</label>
                        <input
                            type="text"
                            className="tech-input w-full p-2 mb-4"
                            value={editingItem.url}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, url: e.target.value } : null)}
                        />
                         <label className="block text-gray-400 text-sm mb-2">DESCRIPTION</label>
                        <textarea
                            className="tech-input w-full p-2 mb-4 h-24"
                            value={editingItem.description}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                        <div className="flex justify-end gap-4 mt-4">
                            <button className="tech-btn-secondary px-4 py-2" onClick={handleCancelEdit}>CANCEL</button>
                            <button className="tech-btn px-4 py-2" onClick={handleSaveEdit}>SAVE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};