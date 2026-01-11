import { useState, useCallback, useEffect, useRef } from 'react';
import type { BlockType } from '../types';

export const useEditorFormatting = (editorRef: React.RefObject<HTMLDivElement>) => {
    const [activeFormats, setActiveFormats] = useState({ isBold: false, isItalic: false, isCode: false, isStrikethrough: false });
    const selectionRef = useRef<Range | null>(null);

    const getActiveBlockId = () => {
        const selection = window.getSelection();
        if (!selection || !selection.focusNode) return null;
        let node = selection.focusNode;
        while(node) {
            if(node instanceof HTMLElement && node.dataset.blockId) {
                return node.dataset.blockId;
            }
            node = node.parentNode;
        }
        return null;
    } 

    const applyFormat = useCallback((command: string, value?: string) => {
        // First, ensure the selection is restored if we have a saved one
        const selection = window.getSelection();
        if (selection && selectionRef.current && editorRef.current?.contains(selectionRef.current.commonAncestorContainer)) {
             selection.removeAllRanges();
             selection.addRange(selectionRef.current);
        } else if (selection && selection.rangeCount === 0) {
            // If no selection, don't do anything
            return;
        }

        if (command === 'code') {
             document.execCommand('insertHTML', false, `<code>${selection.toString()}</code>`);
        } else {
            document.execCommand(command, false, value);
        }
       
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.isContentEditable) {
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        activeElement.focus();
    }, [editorRef]);

    const handleFormatBlock = useCallback((type: BlockType) => {
        return getActiveBlockId();
    }, []);

    const handleLink = useCallback(() => {
        const url = prompt("Enter URL:");
        if (url) applyFormat('createLink', url);
    }, [applyFormat]);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!editorRef.current || !selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            if (!editorRef.current.contains(range.commonAncestorContainer)) return;

            // Save the selection only if it's not collapsed and inside the editor
            if (!selection.isCollapsed) {
                 selectionRef.current = range.cloneRange();
            }
            
            let node = selection.anchorNode;
            let isBold = false, isItalic = false, isCode = false, isStrikethrough = false;
            while (node && node !== editorRef.current) {
                if (node.nodeName === 'B' || node.nodeName === 'STRONG') isBold = true;
                if (node.nodeName === 'I' || node.nodeName === 'EM') isItalic = true;
                if (node.nodeName === 'CODE') isCode = true;
                if (node.nodeName === 'STRIKE') isStrikethrough = true;
                node = node.parentNode;
            }
            setActiveFormats({ isBold, isItalic, isCode, isStrikethrough });
        };
        
        const editorDiv = editorRef.current;
        const listener = () => handleSelectionChange();

        document.addEventListener('selectionchange', listener);
        editorDiv?.addEventListener('keyup', listener);
        editorDiv?.addEventListener('mouseup', listener);
        editorDiv?.addEventListener('focus', listener);
        
        return () => {
            document.removeEventListener('selectionchange', listener);
            editorDiv?.removeEventListener('keyup', listener);
            editorDiv?.removeEventListener('mouseup', listener);
            editorDiv?.removeEventListener('focus', listener);
        };
    }, [editorRef]);

    return { activeFormats, applyFormat, handleFormatBlock, handleLink };
};
