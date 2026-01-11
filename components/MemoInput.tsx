import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Block, BlockType } from '../types';
import { blocksToMarkdown } from '../utils';
import { EditableBlock } from './EditableBlock';
import { useEditorFormatting } from './useEditorFormatting';
import { getServerUrl } from '../utils';
import * as db from '../services/db'; 
import { generateAutoTags, getTagColor } from '../utils/tagUtils';
import CalendarInput from './CalendarInput'; 
import moment from 'moment';

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
 
export const MemoInput = ({ 
    onAddMemo,
    timestamp,
    onTimestampChange,
    continueTimestamp,
    onContinueTimestampChange,
    onUpdateMemoLinkPreview 
}: { 
    onAddMemo: (type: 'text' | 'image' | 'link', content: string, tags: string[]) => Promise<number>,
    timestamp: string,
    onTimestampChange: (time: string) => void,
    continueTimestamp: boolean,
    onContinueTimestampChange: (value: boolean) => void,
    onUpdateMemoLinkPreview: (memoId: number, linkPreview: db.LinkPreviewData) => void
}) => {
  const [blocks, setBlocks] = useState<Block[]>([INITIAL_BLOCK]);
  const [tags, setTags] = useState<string[]>([]);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [ignoredTags, setIgnoredTags] = useState<Set<string>>(new Set());
  const [currentTag, setCurrentTag] = useState('');
  const [commandMenu, setCommandMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeFormats, applyFormat, handleFormatBlock, handleLink } = useEditorFormatting(editorRef);

  useEffect(() => {
    if (!continueTimestamp) {
        onTimestampChange(new Date().toISOString());
        const timer = setInterval(() => onTimestampChange(new Date().toISOString()), 60000);
        return () => clearInterval(timer);
    }
  }, [continueTimestamp, onTimestampChange]);

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
    setTags([]);
    setAutoTags([]);
    setIgnoredTags(new Set());
    setCurrentTag('');
    setCommandMenu(null);
  }

  const submitMemo = async () => {
    const contentToSave = blocksToMarkdown(blocks);
    if (!contentToSave.trim()) return;

    const finalTags = Array.from(new Set([...tags, ...autoTags]));
    const urlRegex = /^(https?:\/\/[^\s]+)\/?$/i;
    const isLink = blocks.length === 1 && blocks[0].type === 'paragraph' && urlRegex.test(contentToSave.trim());

    if (isLink) {
        const url = contentToSave.trim();
        try {
            const newMemoId = await onAddMemo('link', url, finalTags);
            resetInput(); 
            const previewData = await db.getLinkPreview(url);
            if (previewData && (previewData.title || previewData.description)) {
                onUpdateMemoLinkPreview(newMemoId, previewData);
            }
        } catch (e) {
            console.error("Failed to save link memo:", e);
        }
    } else {
        try {
            await onAddMemo('text', contentToSave.trim(), finalTags);
            resetInput();
        } catch (e) {
            console.error("Failed to save text memo:", e);
        }
    }
  };

  const handleRemoveTag = (tagToRemove: string, isAuto: boolean) => {
      if (isAuto) {
          setIgnoredTags(prev => new Set(prev).add(tagToRemove));
          setAutoTags(prev => prev.filter(t => t !== tagToRemove));
      } else {
          setTags(prev => prev.filter(t => t !== tagToRemove));
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
        submitMemo();
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const response = await fetch(`${API_URL}/api/upload/image`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Image upload failed');
        const data = await response.json();
        onAddMemo('image', data.url, []); 
    } catch (error) {
        console.error('Error uploading image:', error);
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))?.getAsFile();
    if (file) {
      e.preventDefault();
      await uploadImage(file);
    }
  }, [onAddMemo]);

  const handleScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = async () => {
        video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const screenshotFile = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
        await uploadImage(screenshotFile);
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (err) { console.error("Screenshot error:", err); }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) await uploadImage(file);
      e.target.value = '';
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
  
  const onFormatBlock = (type: BlockType) => {
    const blockId = handleFormatBlock(type);
    if(blockId) updateBlock(blockId, { type });
  };

  return (
    <div className="memo-input-container">
      <div className="memo-input-wrapper" onKeyDown={handleKeyDown} onPaste={handlePaste}>
        <div className="editor-toolbar">
            <div className="time-controls flex items-center gap-2">
                {/* Wrapped Time Input */}
                <CalendarInput
                    mode="time"
                    value={timestamp ? new Date(timestamp) : new Date()}
                    onChange={(date) => {
                        if (date) onTimestampChange(date.toISOString());
                    }}
                >
                    <input
                        type="text"
                        value={moment(timestamp).format('HH:mm')}
                        onChange={(e) => {
                            const newTime = e.target.value;
                            const [hours, minutes] = newTime.split(':').map(Number);
                            const baseDate = timestamp ? moment(timestamp) : moment();
                            const newDate = baseDate.hour(hours || 0).minute(minutes || 0).toDate();
                            onTimestampChange(newDate.toISOString());
                        }}
                        placeholder="HH:mm"
                        className="tech-input p-2 w-20 relative focus:border-techCyan text-center"
                    />
                </CalendarInput>
                
                <label className="flex items-center gap-1 text-sm text-gray-400 font-mono select-none cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={continueTimestamp} 
                        onChange={(e) => onContinueTimestampChange(e.target.checked)} 
                        className="form-checkbox h-4 w-4 text-techCyan transition duration-150 ease-in-out border-gray-600 rounded bg-gray-800"
                    />
                    CONTINUE
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display: 'none'}} />
            <button className="action-button" onClick={() => addBlock(blocks[blocks.length - 1].id, 'code')} title="Insert Code Block">Code Block</button>
            <button className="action-button" onClick={handleScreenshot} title="Take Screenshot">📷</button>
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
            <button className="primary-button" onClick={submitMemo}>Save</button>
        </div>
      </div>
    </div>
  );
};