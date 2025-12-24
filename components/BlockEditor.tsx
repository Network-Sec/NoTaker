import React, { useMemo, useState } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, wrapInHeadingCommand, wrapInBulletListCommand, wrapInOrderedListCommand, wrapInBlockquoteCommand, toggleInlineCodeCommand } from '@milkdown/kit/preset/commonmark';
import { history, undoCommand, redoCommand } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { nord } from '@milkdown/theme-nord';
import { callCommand } from '@milkdown/kit/utils';


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
            content: content.trim(),
        };
    });
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
const MilkdownEditorInstance = ({ content, onChange, setEditor }: any) => {
    useEditor((root) => {
        const editor = Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, content);
                ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prev) => {
                    onChange(markdown);
                });
            })
            .use(nord)
            .use(commonmark)
            .use(history)
            .use(listener);

        setEditor(editor);
        return editor;
    }, []);

    return <Milkdown />;
};

export const BlockEditor = ({ blocks, onUpdate }: { blocks: any[], onUpdate: (data: any) => void }) => {
    const initialMarkdown = useMemo(() => blocksToMarkdown(blocks), []);
    const [editorInstance, setEditorInstance] = useState<any>(null);

    const handleMarkdownChange = (markdown: string) => {
        const parsedBlocks = markdownToBlocks(markdown);
        onUpdate({ 
            blocks: parsedBlocks,
            contentRaw: markdown 
        });
    };

    return (
        <div className="milkdown-container">
            <MilkdownProvider>
                <Toolbar getEditor={() => editorInstance} />
                <div className="milkdown-editor-content">
                    <MilkdownEditorInstance 
                        content={initialMarkdown} 
                        onChange={handleMarkdownChange} 
                        setEditor={setEditorInstance}
                    />
                </div>
            </MilkdownProvider>
        </div>
    );
};