import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Block, BlockType } from '../types';
import { blocksToMarkdown } from '../utils';
import { EditableBlock } from './EditableBlock';
import { useEditorFormatting } from './useEditorFormatting';
import { getServerUrl } from '../utils';
import * as db from '../services/db'; 
import { generateAutoTags, getTagColor } from '../utils/tagUtils';

const API_URL = getServerUrl();

const COMMANDS = [
    { type: 'paragraph', title: 'Text', description: 'Just start writing with plain text.' },
    { type: 'h1', title: 'Heading 1', description: 'Big section heading.' },
    { type: 'h2', title: 'Heading 2', description: 'Medium section heading.' },
    { type: 'h3', title: 'Heading 3', description: 'Small section heading.' },
    { type: 'checklist', title: 'To-do list', description: 'Track tasks with a checklist.' },
    { type: 'code', title: 'Code', description: 'Capture a code snippet.' }
] as const;
 
const INITIAL_BLOCK: Block = { id: `block-${Date.now()}`, type: 'paragraph', content: '' };
 
export const AIInput = ({
    onAddAIConversation,
    timestamp,
    onTimestampChange,
    continueTimestamp,
    onContinueTimestampChange
}: {
    onAddAIConversation: (item: Omit<AIConversationItem, 'id'>) => Promise<void>;
    timestamp: string;
    onTimestampChange: (time: string) => void;
    continueTimestamp: boolean;
    onContinueTimestampChange: (value: boolean) => void;
}) => {
  const [blocks, setBlocks] = useState<Block[]>([INITIAL_BLOCK]);
  const [tags, setTags] = useState<string[]>([]); // Added tags state
  const [autoTags, setAutoTags] = useState<string[]>([]); // Added autoTags state
  const [ignoredTags, setIgnoredTags] = useState<Set<string>>(new Set()); // Added ignoredTags state
  const [currentTag, setCurrentTag] = useState(''); // Added currentTag state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [commandMenu, setCommandMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const { activeFormats, applyFormat, handleFormatBlock, handleLink } = useEditorFormatting(editorRef);

  useEffect(() => {
    if (onTimestampChange && !continueTimestamp) { // Ensure onTimestampChange is defined before using
        // Set initial timestamp
        onTimestampChange(new Date().toISOString());

        // Set up interval for auto-updating timestamp
        const timer = setInterval(() => {
            // Check again before calling inside interval, for maximum safety
            if (onTimestampChange && !continueTimestamp) {
                onTimestampChange(new Date().toISOString());
            }
        }, 60000);
        return () => clearInterval(timer);
    }
    // Clear interval if continueTimestamp becomes true, or onTimestampChange becomes undefined
    return () => {}; 
  }, [continueTimestamp, onTimestampChange]);

  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  useEffect(() => {
    const timer = setTimeout(() => {
        const fullContent = blocks.map(b => b.content).join('\n');
        if (fullContent.trim().length > 3) {
            const detected = generateAutoTags(fullContent);
            const newAutoTags = detected.filter(t => !tags.includes(t) && !ignoredTags.has(t));
            setAutoTags(prev => {
                const prevSet = new Set(prev);
                return (newAutoTags.length === prev.length && newAutoTags.every(t => prevSet.has(t))) ? prev : newAutoTags;
            });
        } else {
            setAutoTags([]);
        }
    }, 800); 
    return () => clearTimeout(timer);
  }, [blocks, tags, ignoredTags]);

  const resetInput = () => {
    setBlocks([{ ...INITIAL_BLOCK, id: `block-${Date.now()}` }]);
    setTags([]); // Reset tags
    setAutoTags([]); // Reset autoTags
    setIgnoredTags(new Set()); // Reset ignoredTags
    setCurrentTag(''); // Reset currentTag
    setIsLoading(false);
    setCommandMenu(null);
  }

  const handleRemoveTag = (tagToRemove: string, isAuto: boolean) => {
      if (isAuto) {
          setIgnoredTags(prev => new Set(prev).add(tagToRemove));
          setAutoTags(prev => prev.filter(t => t !== tagToRemove));
      } else {
          setTags(prev => prev.filter(t => t !== tagToRemove));
      }
  };
  
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && currentTag.trim()) {
      e.preventDefault();
      const newTag = currentTag.trim();
      if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
          if (autoTags.includes(newTag)) setAutoTags(autoTags.filter(t => t !== newTag));
      }
      setCurrentTag('');
    } else if (e.key === 'Backspace' && !currentTag && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const submitPrompt = async () => {
    const contentToSave = blocksToMarkdown(blocks);
    if (!contentToSave.trim()) return;

    const finalTimestamp = continueTimestamp ? timestamp : new Date().toISOString();
    const finalTags = Array.from(new Set([...tags, ...autoTags])); // Include tags
    const userMessage: Omit<AIConversationItem, 'id'> = {
        timestamp: finalTimestamp,
        type: 'user',
        content: contentToSave.trim(),
    };

    setIsLoading(true);
    // No resetInput() here yet, as we need to wait for AI response to be added too for a full conversation turn

    try {
        await onAddAIConversation(userMessage); // Add user's message to the stream first

        // Call Ollama API
        const ollamaResponse = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userMessage.content }),
        });

        if (!ollamaResponse.ok) {
            const errorBody = await ollamaResponse.text();
            throw new Error(`Ollama API error: ${ollamaResponse.status} - ${errorBody}`);
        }

        const data = await ollamaResponse.json();
        const aiMessageContent = data.response || "No response from AI.";
        const aiModelUsed = data.model || "unknown";

        const aiMessage: Omit<AIConversationItem, 'id'> = {
            timestamp: new Date().toISOString(),
            type: 'ai',
            content: aiMessageContent,
            model: aiModelUsed,
        };
        await onAddAIConversation(aiMessage); // Add AI's response to the stream
        resetInput(); // Reset only after full conversation turn is added
    } catch (error) {
        console.error('Error sending AI query:', error);
        await onAddAIConversation({
            timestamp: new Date().toISOString(),
            type: 'ai',
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            model: 'error',
        });
        setIsLoading(false); // Make sure to reset loading state even on error
    }
  };

  const focusBlock = (id: string, position: 'start' | 'end' = 'end') => {
      setTimeout(() => {
          const blockEl = editorRef.current?.querySelector(`[data-block-id="${id}"] [contenteditable="true"], [data-block-id="${id}"] textarea`) as HTMLElement;
          if (blockEl) {
              blockEl.focus();
              const selection = window.getSelection();
              if (selection && blockEl.hasAttribute('contenteditable')) {
                  const range = document.createRange();
                  range.selectNodeContents(blockEl);
                  range.collapse(position === 'start');
                  selection.removeAllRanges();
                  selection.addRange(range);
              }
          }
      }, 0);
  };
  
  const updateBlock = (id: string, updates: Partial<Block>) => {
      setBlocks(prevBlocks => prevBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  
  const addBlock = (afterId: string, type: BlockType = 'paragraph') => {
      const newBlockContent = type === 'code' ? '```bash\n\n```' : '';
      const newBlock: Block = { id: `block-${Date.now()}`, type, content: newBlockContent, checked: false };
      setBlocks(prevBlocks => {
          const index = prevBlocks.findIndex(b => b.id === afterId);
          return [...prevBlocks.slice(0, index + 1), newBlock, ...prevBlocks.slice(index + 1)];
      });
      focusBlock(newBlock.id);
  };

  const deleteBlock = (id: string) => {
      if (blocks.length <= 1) return;
      setBlocks(prevBlocks => {
          const index = prevBlocks.findIndex(b => b.id === id);
          const newBlocks = prevBlocks.filter(b => b.id !== id);
          if (index > 0) focusBlock(newBlocks[index - 1].id);
          return newBlocks;
      });
  };
  
  const changeBlockType = (id: string, type: BlockType) => {
      setBlocks(prevBlocks => prevBlocks.map(b => {
          if (b.id === id) return { ...b, type, content: b.content.replace('/', '') };
          return b;
      }));
      setCommandMenu(null);
      focusBlock(id, 'start');
  };

  const handleContentChange = (blockId: string, content: string) => {
      const block = blocks.find(b => b.id === blockId);
      if (block?.type === 'paragraph' && content.endsWith('/')) {
          const blockEl = editorRef.current?.querySelector(`[data-block-id="${blockId}"]`);
          if (blockEl) {
              const rect = blockEl.getBoundingClientRect();
              setCommandMenu({ x: rect.left, y: rect.bottom, blockId });
          }
      } else {
          setCommandMenu(null);
      }
      updateBlock(blockId, { content });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submitPrompt();
    }
  };
  
  const onFormatBlock = (type: BlockType) => {
    const blockId = handleFormatBlock(type);
    if(blockId) updateBlock(blockId, { type });
  };

  return (
    <div className="memo-input-container">
      <div className="memo-input-wrapper" onKeyDown={handleKeyDown}>
        <div className="editor-toolbar">
            <div className="time-controls">
                <input type="time" value={formattedTime} readOnly />
                <label>
                    <input 
                        type="checkbox" 
                        checked={continueTimestamp} 
                        onChange={(e) => onContinueTimestampChange(e.target.checked)} 
                    />
                    Continue
                </label>
            </div>
            <button className={activeFormats.isBold ? 'active' : ''} onClick={() => applyFormat('bold')} title="Bold">B</button>
            <button className={activeFormats.isItalic ? 'active' : ''} onClick={() => applyFormat('italic')} title="Italic">I</button>
            <button className={activeFormats.isStrikethrough ? 'active' : ''} onClick={() => applyFormat('strikeThrough')} title="Strikethrough">S</button>
            <button className={activeFormats.isCode ? 'active' : ''} onClick={() => applyFormat('code')} title="Inline Code">&lt;/&gt;</button>
            <button onClick={handleLink} title="Link">🔗</button>
            <div className="divider"></div>
            <button onClick={() => onFormatBlock('ul')} title="Bulleted List">• List</button>
            <button onClick={() => onFormatBlock('checklist')} title="Checklist">✓ List</button>
            <button onClick={() => onFormatBlock('blockquote')} title="Blockquote">""</button>
            <div className="divider"></div>
            <button className="action-button" onClick={() => addBlock(blocks[blocks.length - 1].id, 'code')} title="Insert Code Block">Code Block</button>
        </div>
        <div className="memo-editor-area" ref={editorRef}>
          {blocks.map(block => (
             <div key={block.id} className="block-wrapper" data-block-id={block.id}>
                  <div className="block-content" data-block-id={block.id}>
                      <EditableBlock
                          block={block}
                          updateBlock={(updates) => handleContentChange(block.id, updates.content || '')}
                          addBlock={() => addBlock(block.id)}
                          deleteBlock={() => deleteBlock(block.id)}
                          changeBlockType={(type) => changeBlockType(block.id, type)}
                      />
                  </div>
              </div>
          ))}
          {commandMenu && (
              <div className="slash-command-menu" style={{ top: commandMenu.y, left: commandMenu.x }}>
                  {COMMANDS.map(cmd => (
                      <div key={cmd.type} className="slash-command-item" onClick={() => changeBlockType(commandMenu.blockId, cmd.type)}>
                          <h4>{cmd.title}</h4>
                          <p>{cmd.description}</p>
                      </div>
                  ))}
              </div>
          )}
        </div>
        <div className="memo-input-footer">
            <div className="tag-input-area">
                {tags.map(tag => (
                    <div 
                        key={tag} 
                        className="input-tag-pill" 
                        style={{ backgroundColor: `${getTagColor(tag)}22`, color: getTagColor(tag), borderColor: getTagColor(tag)}}
                    >
                        <span>#{tag}</span>
                        <button onClick={() => handleRemoveTag(tag, false)}>&times;</button>
                    </div>
                ))}
                
                {autoTags.map(tag => (
                    <div 
                        key={`auto-${tag}`} 
                        className="input-tag-pill auto-tag" 
                        title="Auto-detected tag"
                        style={{ 
                            backgroundColor: `${getTagColor(tag)}11`, 
                            color: getTagColor(tag), 
                            borderColor: getTagColor(tag), 
                            borderStyle: 'dashed'
                        }}
                    >
                        <span>#{tag}</span>
                        <button onClick={() => handleRemoveTag(tag, true)}>&times;</button>
                    </div>
                ))}

                <input type="text" placeholder="Add tags..." className="tag-input-field" value={currentTag} onChange={e => setCurrentTag(e.target.value)} onKeyDown={handleTagInput} />
            </div>
            <button className="primary-button" onClick={submitPrompt} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send to AI'}
            </button>
        </div>
      </div>
    </div>
  );
};