import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15';
import { vscDarkPlus } from 'https://esm.sh/react-syntax-highlighter@15/dist/esm/styles/prism';
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import type { Cell, CellType } from '../types';
import { CodeBlock } from './CodeBlock';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
 
const JupyterCell = ({ cell, updateCell, addCell, deleteCell, runCell }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleContentChange = (content: string) => updateCell(cell.id, { content });

    const CodeEditor = () => (
        <textarea
            className="code-cell-editor"
            value={cell.content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Enter code..."
        />
    );
    
    const MarkdownEditor = () => (
         <textarea
            className="markdown-cell-editor"
            value={cell.content}
            onChange={e => handleContentChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            placeholder="Enter markdown..."
        />
    );

    return (
        <div className="jupyter-cell">
             <div className="jupyter-cell-controls">
                <button className="cell-control-button" onClick={() => addCell(cell.id, 'code')} title="Add Code Cell Below">+</button>
                <button className="cell-control-button" onClick={() => deleteCell(cell.id)} title="Delete Cell">&times;</button>
                <button className="cell-control-button" onClick={() => updateCell(cell.id, { type: cell.type === 'code' ? 'markdown' : 'code' })} title="Change Type">&#8645;</button>
            </div>
            {cell.type === 'code' && <button className="cell-run-button" onClick={() => runCell(cell.id)} title="Run Cell (with AI)">&#9654;</button>}
            
            <div className="cell-main-content">
                {cell.type === 'code' ? <CodeEditor /> : (
                    isEditing ? <MarkdownEditor /> : <div className="markdown-cell-view" onDoubleClick={() => setIsEditing(true)}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{code: CodeBlock}}>{cell.content || "Double-click to edit markdown"}</ReactMarkdown></div>
                )}
                {cell.isRunning && <div className="code-cell-output">Running...</div>}
                {cell.output && <div className="code-cell-output"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{code: CodeBlock}}>{cell.output}</ReactMarkdown></div>}
            </div>
        </div>
    );
};

export const JupyterEditor = ({ cells, onUpdate }) => {
    const updateCells = (newCells: Cell[]) => onUpdate({ cells: newCells });

    const addCell = useCallback((afterId: string, type: CellType) => {
        const newCell: Cell = { id: `cell-${Date.now()}`, type, content: '' };
        const index = cells.findIndex(c => c.id === afterId);
        const newCells = [...cells.slice(0, index + 1), newCell, ...cells.slice(index + 1)];
        updateCells(newCells);
    }, [cells, onUpdate]);
    
    const deleteCell = useCallback((id: string) => {
        if (cells.length <= 1) return;
        updateCells(cells.filter(c => c.id !== id));
    }, [cells, onUpdate]);

    const updateCell = useCallback((id: string, updates: Partial<Cell>) => {
        updateCells(cells.map(c => c.id === id ? { ...c, ...updates } : c));
    }, [cells, onUpdate]);
    
    const runCell = useCallback(async (id: string) => {
        const cellToRun = cells.find(c => c.id === id);
        if (!cellToRun || !cellToRun.content) return;
        
        updateCell(id, { isRunning: true, output: '' });
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Explain the following code snippet in markdown:\n\n\`\`\`\n${cellToRun.content}\n\`\`\``,
            });
            const text = response.text;
            updateCell(id, { isRunning: false, output: text });
        } catch (error) {
            console.error("AI cell execution failed:", error);
            updateCell(id, { isRunning: false, output: "Error: Could not get explanation from AI." });
        }
    }, [cells, updateCell]);

    return (
        <div className="jupyter-editor">
            {cells.map(cell => (
                <JupyterCell
                    key={cell.id}
                    cell={cell}
                    updateCell={updateCell}
                    addCell={addCell}
                    deleteCell={deleteCell}
                    runCell={runCell}
                />
            ))}
        </div>
    );
};
