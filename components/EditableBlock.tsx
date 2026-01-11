import React, { useEffect, useRef } from 'react';
import type { Block, BlockType } from '../types';

interface EditableBlockProps {
    block: Block;
    updateBlock: (updates: Partial<Block>) => void;
    addBlock: () => void;
    deleteBlock: () => void;
    changeBlockType: (type: BlockType) => void;
}

export const EditableBlock = ({ block, updateBlock, addBlock, deleteBlock, changeBlockType }: EditableBlockProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Use innerText for updates to ensure plain text
        if (contentRef.current && contentRef.current.innerText !== block.content) {
            contentRef.current.innerText = block.content;
        }
    }, [block.content]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        // Capture innerText to ensure only plain text (Markdown) is stored
        updateBlock({ content: e.currentTarget.innerText });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock();
        }
        if (e.key === 'Backspace' && !block.content) {
            e.preventDefault();
             if (block.type !== 'paragraph') {
                changeBlockType('paragraph');
            } else {
                deleteBlock();
            }
        }
    };
    
    switch (block.type) {
        case 'h1':
        case 'h2':
        case 'h3':
            return <div ref={contentRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} className={`block-content-editable ${block.type}-block`} data-placeholder={`Heading ${block.type.slice(-1)}`} />
        case 'ul':
        case 'ol':
             return <div className={`${block.type}-block`}><div ref={contentRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} className="block-content-editable" data-placeholder="List item"/></div>
        case 'blockquote':
            return <blockquote className="blockquote-block"><div ref={contentRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} className="block-content-editable" data-placeholder="Quote"/></blockquote>
        case 'checklist':
            return (
                <div className="checklist-block">
                    <input type="checkbox" checked={!!block.checked} onChange={e => updateBlock({ checked: e.target.checked })}/>
                    <div ref={contentRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} className="block-content-editable" data-placeholder="To-do" data-checked={block.checked}/>
                </div>
            );
        case 'code':
            return <textarea value={block.content} onChange={e => updateBlock({ content: e.target.value })} className="code-block-editor" placeholder="Enter code..."/>
        default: // paragraph
            return <div ref={contentRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} className="block-content-editable p-block" data-placeholder="Type '/' for commands..."/>
    }
};