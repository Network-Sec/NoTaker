import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Memo } from '../types';
import { CodeBlock } from './CodeBlock';
import { getTagColor } from '../utils/tagUtils';
import { LinkPreview } from './LinkPreview';
import CalendarInput from './CalendarInput'; // Import CalendarInput
import moment from 'moment'; // Import moment

const YOUTUBE_URL_REGEX = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^&\n?#]+)/;

interface MemoItemProps {
    memo: Memo;
    onTagSelect: (tag: string) => void;
    onUpdateMemo: (id: number, content: string, tags: string[], timestamp?: string) => void;
    onDeleteMemo: (id: number) => void;
    onOpenImageEditor: (memo: Memo) => void;
    onAddToToolbox?: (item: { url: string; title: string }) => void; // New prop
}

export const MemoItem = ({ memo, onTagSelect, onUpdateMemo, onDeleteMemo, onOpenImageEditor, onAddToToolbox }: MemoItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [editTags, setEditTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState(''); // New state for new tag input
    const [showMenu, setShowMenu] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false); // New state for time editing
    const [editedTime, setEditedTime] = useState(new Date(memo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isEditing) {
            setEditText(memo.content);
            setEditTags(memo.tags || []);
            setNewTagInput(''); // Clear new tag input when starting edit
        }
    }, [isEditing, memo]);

    useEffect(() => {
        if (isEditingTime) {
            setEditedTime(new Date(memo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
    }, [isEditingTime, memo.timestamp]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => {
        onUpdateMemo(memo.id, editText, editTags);
        setIsEditing(false);
    };
    
    const handleSaveTime = () => {
        // Need to convert editedTime (HH:mm) back to a full ISO timestamp
        const [hours, minutes] = editedTime.split(':').map(Number);
        const newDate = new Date(memo.timestamp);
        newDate.setHours(hours, minutes, 0, 0);
        // Call onUpdateMemo with updated timestamp
        onUpdateMemo(memo.id, memo.content, memo.tags, newDate.toISOString()); // Assuming onUpdateMemo can handle timestamp
        setIsEditingTime(false);
    };

    const handleDeleteTag = (tagToRemove: string) => {
        setEditTags(editTags.filter(t => t !== tagToRemove));
    };

    const handleNewTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && newTagInput.trim()) {
            e.preventDefault();
            const newTag = newTagInput.trim();
            if (newTag && !editTags.includes(newTag)) {
                setEditTags([...editTags, newTag]);
            }
            setNewTagInput('');
        } else if (e.key === 'Backspace' && !newTagInput && editTags.length > 0) {
            setEditTags(editTags.slice(0, -1));
        }
    };

    const formattedTime = new Date(memo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });


    // --- Content Rendering Logic ---
    const renderContent = () => {
        if (memo.type === 'image') {
            return (
                <div className="image-wrapper">
                    <img src={memo.content} alt="Memo" onClick={() => onOpenImageEditor(memo)} />
                </div>
            );
        }

        if (memo.type === 'link') {
            // Case 1: We have the rich preview data from backend
            if (memo.linkPreview) {
                return (
                    <LinkPreview
                        data={memo.linkPreview}
                    />
                );
            }
            // Case 2: We only have the raw URL (preview pending or failed)
            return (
                <a href={memo.content} target="_blank" rel="noopener noreferrer" className="raw-link">
                    {memo.content}
                </a>
            );
        }

        // Default: Markdown text
        return (
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={{
                    // Handle pre tags correctly to avoid ReactMarkdown wrapping them in <p>
                    pre: ({children}) => <>{children}</>,
                    // Custom CodeBlock component
                    code: ({node, ...props}) => {
                        const codeString = String(props.children);
                        const match = /language-(\w+)/.exec(props.className || '');
                        const explicitLang = match ? match[1] : 'text';
                        const inline = !props.className || !props.className.startsWith('language-'); // Determine if it's an inline code snippet

                        return (
                            <CodeBlock 
                                node={node} 
                                inline={inline} 
                                className={props.className} 
                                children={codeString} 
                                {...props}
                            />
                        );
                    },
                    // Custom p component to prevent wrapping block-level elements like CodeBlock
                    p: ({children}) => {
                        // Check if the child is a CodeBlock (or any other block-level component)
                        // This assumes CodeBlock's root element is a 'pre' tag as we've made it
                        if (children && Array.isArray(children) && children.length === 1 && React.isValidElement(children[0]) && children[0].type === CodeBlock) {
                            return <>{children}</>; // Render children directly without <p>
                        }
                        return <p>{children}</p>;
                    },
                    a: ({node, ...props}) => {
                        const url = props.href;
                        // Special handling for YouTube inside text blocks
                        if (url && YOUTUBE_URL_REGEX.test(url)) {
                            const videoId = url.match(YOUTUBE_URL_REGEX)?.[1];
                            if (videoId) {
                                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                                // CHANGED: div -> span, added display: block. 
                                // This prevents nesting div inside p (which ReactMarkdown creates)
                                return (
                                    <span className="youtube-preview">
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <img src={thumbnailUrl} alt="YouTube video thumbnail" />
                                            <span>{props.children}</span>
                                        </a>
                                    </span>
                                );
                            }
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" />;
                    }
                }}
            >
                {memo.content}
            </ReactMarkdown>
        );
    };

    return (
        <div className="memo-item" data-memo-id={memo.id} data-timestamp={memo.timestamp}>
            <div className="memo-header">
                <div className="menu-container" ref={menuRef}>
                    <button className="menu-trigger" onClick={() => setShowMenu(!showMenu)}>⋮</button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>✎ Edit Content</button>
                            <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>🏷️ Edit Tags</button>
                            <button onClick={() => { setIsEditingTime(true); setShowMenu(false); }}>⏰ Edit Time</button>
                            {memo.type === 'image' && (
                                <button onClick={() => { onOpenImageEditor(memo); setShowMenu(false); }}>✂️ Crop/Edit Image</button>
                            )}
                            {memo.type === 'link' && onAddToToolbox && ( // New menu item for links
                                <button onClick={async () => {
                                    setShowMenu(false);
                                    try {
                                        await onAddToToolbox({ url: memo.content, title: memo.title || memo.content });
                                        console.log("Toolbox item added successfully from MemoItem."); // Log success
                                    } catch (error) {
                                        console.error("Failed to add to Toolbox from MemoItem:", error); // Log failure
                                    }
                                }}>
                                    ➕ To Toolbox
                                </button>
                            )}
                            <div className="divider" />
                            <button className="delete-btn" onClick={() => { onDeleteMemo(memo.id); }}>🗑️ Delete</button>
                        </div>
                    )}
                </div>
            </div>

                        {isEditingTime ? (
                            <div className="memo-edit-time-container flex flex-col gap-2 p-4 tech-panel"> {/* Restyled container */}
                                <CalendarInput mode="time" value={editedTime ? moment(editedTime, 'HH:mm').toDate() : null} onChange={date => setEditedTime(date ? moment(date).format('HH:mm') : '')} label="Edit Time:" />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={handleSaveTime} className="tech-btn px-3 py-1">SAVE_TIME</button>
                                    <button onClick={() => setIsEditingTime(false)} className="tech-btn-secondary px-3 py-1">CANCEL</button>
                                </div>
                            </div>
                        ) : isEditing ? (
                            <div className="memo-item editing">
                                <textarea 
                                    className="memo-edit-textarea"
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                />
                                <div className="edit-tags-container">
                                    {editTags.map(tag => (
                                        <span key={tag} className="tag-pill" style={{ backgroundColor: `${getTagColor(tag)}22`, color: getTagColor(tag), borderColor: getTagColor(tag) }}>
                                            #{tag}
                                            <button onClick={() => handleDeleteTag(tag)} className="tag-remove-btn">&times;</button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="tag-input-field"
                                        value={newTagInput}
                                        onChange={e => setNewTagInput(e.target.value)}
                                        onKeyDown={handleNewTagInput}
                                    />
                                </div>
                                <div className="memo-edit-buttons">
                                    <button onClick={handleSave} className="primary-button">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="secondary-button">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="markdown-content">
                                    {renderContent()}
                                </div>
            
                                {memo.tags?.length > 0 && (
                                    <div className="memo-tags">
                                        {memo.tags.map((t: string) => (
                                            <span 
                                                key={t} 
                                                className="tag-pill" 
                                                onClick={() => onTagSelect(t)}
                                                style={{ 
                                                    backgroundColor: `${getTagColor(t)}15`, 
                                                    color: getTagColor(t),
                                                    border: `1px solid ${getTagColor(t)}40`
                                                }}
                                            >
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="memo-timestamp">{formattedTime}</div>
                            </>
                        )}
                    </div>
                );
            };