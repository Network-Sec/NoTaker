import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core'; // Added editorViewCtx
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, wrapInHeadingCommand, wrapInBulletListCommand, wrapInOrderedListCommand, wrapInBlockquoteCommand, toggleInlineCodeCommand } from '@milkdown/kit/preset/commonmark';
import { history, undoCommand, redoCommand } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { nord } from '@milkdown/theme-nord';
import { gfm } from '@milkdown/preset-gfm'; // Import GFM preset
import { callCommand, insert } from '@milkdown/kit/utils'; // Added insert
import '@milkdown/crepe/theme/common/style.css'; // Crepe common theme styles
import '@milkdown/crepe/theme/frame-dark.css'; // Crepe frame-dark theme styles









// --- Helper: Convert Blocks Array -> Markdown String ---
const blocksToMarkdown = (blocks: any[]) => {
    if (!blocks || blocks.length === 0) return '';
    return blocks.map(b => {
        if (b.type === 'h1') return `# ${b.content}`;
        if (b.type === 'h2') return `## ${b.content}`;
        if (b.type === 'h3') return `### ${b.content}`;
        if (b.type === 'checklist') return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
        if (b.type === 'ul') return `- ${b.content}`;
        if (b.type === 'ol') return `1. ${b.content}`;
        if (b.type === 'blockquote') return `> ${b.content}`;
        if (b.type === 'code') return `\`${b.content}\``;
        return b.content;
    }).join('\n\n');
    return markdown;
};

// --- Helper: Convert Markdown String -> Blocks Array ---
const markdownToBlocks = (markdown: string) => {
    if (!markdown) return [];
    return markdown.split('\n\n').map((text, index) => {
        let type = 'paragraph';
        let content = text;

        if (text.startsWith('# ')) { type = 'h1'; content = text.replace('# ', ''); }
        else if (text.startsWith('## ')) { type = 'h2'; content = text.replace('## ', ''); }
        else if (text.startsWith('### ')) { type = 'h3'; content = text.replace('### ', ''); }
        else if (text.startsWith('- [ ] ') || text.startsWith('- [x] ')) { type = 'checklist'; content = text.replace(/- \[[ x]\] /, ''); }
        else if (text.startsWith('- ')) { type = 'ul'; content = text.replace('- ', ''); }
        else if (text.startsWith('1. ')) { type = 'ol'; content = text.replace('1. ', ''); }
        else if (text.startsWith('> ')) { type = 'blockquote'; content = text.replace('> ', ''); }

        return {
            id: `block-${Date.now()}-${index}`,
            type,
            content: content,
        };
    });
    return blocks;
};

// --- Helper: Upload Image ---
const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
        // Assume axios is globally configured or use fetch
        const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
    }
};

// --- Toolbar Component ---
const Toolbar = ({ getEditor }: { getEditor: () => any }) => {
    const run = (command: any, payload?: any) => {
        const editor = getEditor();
        if (!editor) return;
        editor.action(callCommand(command, payload));
    };

    return (
        <div className="editor-toolbar">
            {/* Undo / Redo */}
            <button className="toolbar-btn" onClick={() => run(undoCommand.key)} title="Undo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button className="toolbar-btn" onClick={() => run(redoCommand.key)} title="Redo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7"/></svg>
            </button>
            
            <div className="toolbar-divider" />

            {/* Formatting */}
            <button className="toolbar-btn" onClick={() => run(toggleStrongCommand.key)} title="Bold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </button>
            <button className="toolbar-btn" onClick={() => run(toggleEmphasisCommand.key)} title="Italic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </button>
             <button className="toolbar-btn" onClick={() => run(toggleInlineCodeCommand.key)} title="Code">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </button>

            <div className="toolbar-divider" />

            {/* Headings */}
            <button className="toolbar-btn" onClick={() => run(wrapInHeadingCommand.key, 1)} title="Heading 1">
                <span style={{ fontSize: '16px' }}>H1</span>
            </button>
            <button className="toolbar-btn" onClick={() => run(wrapInHeadingCommand.key, 2)} title="Heading 2">
                <span style={{ fontSize: '14px' }}>H2</span>
            </button>

            <div className="toolbar-divider" />

            {/* Lists */}
            <button className="toolbar-btn" onClick={() => run(wrapInBulletListCommand.key)} title="Bullet List">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button className="toolbar-btn" onClick={() => run(wrapInOrderedListCommand.key)} title="Numbered List">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
            </button>
            <button className="toolbar-btn" onClick={() => run(wrapInBlockquoteCommand.key)} title="Quote">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
        </div>
    );
};

// --- Main Editor Component ---
const MilkdownEditorInstance = React.memo(({ initialContent, onChange, setEditor }: any) => {
    useEditor((root) => {
        const editor = Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, initialContent);
                // Milkdown is editable by default.
                ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prev) => {
                    onChange(markdown);
                });
                
                // Attach Drag & Drop / Paste Listeners (always active)
                root.addEventListener('drop', async (e) => {
                    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file.type.startsWith('image/')) {
                            try {
                                const url = await uploadImage(file);
                                editor.action(insert(`![Image](${url})`));
                            } catch (err) {
                                console.error('Drop upload failed', err);
                            }
                        }
                    }
                });

                root.addEventListener('paste', async (e) => {
                    if (e.clipboardData && e.clipboardData.files.length > 0) {
                        const file = e.clipboardData.files[0];
                        if (file.type.startsWith('image/')) {
                            e.preventDefault();
                            try {
                                const url = await uploadImage(file);
                                editor.action(insert(`![Image](${url})`));
                            } catch (err) {
                                console.error('Paste upload failed:', err);
                            }
                        }
                    }
                });
            })
            .use(commonmark)
            .use(gfm) // Enable GFM preset by passing the object directly
            .use(history)
            .use(listener);

        setEditor(editor);
        return editor;
    }, []); // Milkdown manages its own internal state, so initialContent is not a dependency here.

    return <Milkdown />;
});

export const BlockEditor = ({ blocks, rawMarkdownContent, onUpdate, viewMode = 'source' }: { blocks: any[], rawMarkdownContent?: string, onUpdate: (data: Partial<Notebook>) => void, viewMode?: 'visual' | 'source' }) => {
    useEffect(() => {
        // console.log("[BlockEditor] Mounted");
    }, []);

    const [localMarkdown, setLocalMarkdown] = useState(() => {
        // Initialize based on viewMode and available content
        if (viewMode === 'source' && rawMarkdownContent !== undefined) {
            return rawMarkdownContent;
        }
        return blocksToMarkdown(blocks);
    });
    const [isTyping, setIsTyping] = useState(false); // New state to track if user is actively typing
    const textareaRef = useRef<HTMLTextAreaElement>(null); 
    const cursorPositionRef = useRef<{ start: number, end: number } | null>(null); 
    
    // Effect to update localMarkdown from props ONLY when not actively typing and in visual mode
    useEffect(() => {
        // Only update local state from props if user is not actively typing AND in visual mode
        // This prevents external updates from overwriting user's current input in source mode
        if (!isTyping && viewMode === 'visual') { // Only sync from blocks if in visual mode
            const newMarkdown = blocksToMarkdown(blocks);
            // Only update if the content from props is different to avoid unnecessary re-renders
            if (newMarkdown !== localMarkdown) {
                setLocalMarkdown(newMarkdown);
            }
        }
    }, [blocks, isTyping, viewMode]); // Reruns when blocks, isTyping, or viewMode changes

    // Effect to restore cursor position after localMarkdown updates
    useEffect(() => {
        if (viewMode === 'source' && textareaRef.current && cursorPositionRef.current) {
            const { start, end } = cursorPositionRef.current;
            // Ensure DOM is updated before setting selection
            if (textareaRef.current) { 
                textareaRef.current.setSelectionRange(start, end);
            }
        }
    }, [localMarkdown, viewMode]); // Re-run when localMarkdown or viewMode changes

    const [editorInstance, setEditorInstance] = useState<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced Update to Parent: Triggers the actual save operation
        const triggerUpdate = useCallback((markdown: string) => {
            setIsTyping(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                if (viewMode === 'source') {
                    onUpdate({ rawMarkdownContent: markdown });
                } else {
                    const parsedBlocks = markdownToBlocks(markdown);
                    onUpdate({
                        blocks: parsedBlocks,
                        rawMarkdownContent: markdown // Keep rawMarkdownContent updated even in visual mode
                    });
                }
                setIsTyping(false); // Done typing/saving, allow external updates to flow in
            }, 500); // 500ms debounce
        }, [onUpdate, viewMode]);
    
        // Handle Changes for Milkdown (Visual Mode)
        const handleMilkdownChange = useCallback((markdown: string) => {
            // Keep localMarkdown in sync for when switching to source view
            setLocalMarkdown(markdown);
            // Directly update parent with both blocks and raw markdown from Milkdown's output
            const parsedBlocks = markdownToBlocks(markdown);
            onUpdate({
                blocks: parsedBlocks,
                rawMarkdownContent: markdown
            });
        }, [onUpdate]);
    // Handle Changes for Textarea (Source Mode)
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Capture cursor position before state update
        if (textareaRef.current) {
            cursorPositionRef.current = {
                start: e.target.selectionStart, // Use e.target directly
                end: e.target.selectionEnd,     // Use e.target directly
            };
        }

        const markdown = e.target.value;
        setLocalMarkdown(markdown); // Update local state for immediate feedback
        triggerUpdate(markdown); // Debounce update to parent
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Render
    if (viewMode === 'source') { // EDIT mode (Textarea)
        return (
             <div className="milkdown-container">
                <textarea 
                    ref={textareaRef} // Attach ref to textarea
                    className="source-editor-textarea custom-scrollbar"
                    value={localMarkdown} // Controlled component
                    onChange={handleTextareaChange}
                    placeholder="Type markdown here..."
                />
            </div>
        );
    }

    // PREVIEW mode (Milkdown Rendered)
    return (
        <div className="milkdown-container">
            <MilkdownProvider>
                {/* Toolbar always visible with Milkdown editor */} 
                <Toolbar getEditor={() => editorInstance} /> 

                <div className="milkdown-editor-content">
                    <MilkdownEditorInstance 
                        initialContent={localMarkdown} 
                        onChange={handleMilkdownChange} 
                        setEditor={setEditorInstance}
                    />
                </div>
            </MilkdownProvider>
        </div>
    );
};