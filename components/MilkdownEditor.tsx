import React, { useCallback, useRef, useLayoutEffect } from 'react';
import { useEditor, EditorComponent } from '@milkdown/react';
import { Editor, rootCtx, editorViewCtx, parserCtx, serializerCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';
import { debounce } from 'lodash';

interface MilkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}
 
export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ value, onChange, readOnly = false }) => {
  // `ref` is not strictly needed for EditorComponent, as useEditor handles the root element.
  // However, keeping it for potential future direct DOM manipulation if necessary.
  const ref = useRef<HTMLDivElement>(null);

  const handleEditorChange = useCallback(
    debounce((editorInstance) => {
      editorInstance.action((ctx) => {
        const markdown = ctx.get(serializerCtx).serialize(ctx.get(editorViewCtx).state.doc);
        onChange(markdown);
      });
    }, 200),
    [onChange]
  );

  // useLayoutEffect is used here to ensure the editor is reconfigured synchronously
  // before the browser paints, preventing potential flashes of incorrect state.
  useLayoutEffect(() => {
    // Manually ensure styles for Milkdown (theme-nord) are applied
    // This part might need to be dynamic if multiple themes are used, or handled globally.
    // For now, assume theme-nord's CSS is globally available or handled by Vite.
    // This effect primarily serves to re-render the editor if its configuration changes.
  }, [readOnly, value]);

  const { editor } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, value);
        // Set editable state directly in the config
        ctx.set(editorViewCtx.key, (prev) => ({
            ...prev,
            editable: () => !readOnly,
        }));
      })
      .use(commonmark)
      .use(nord)
      .on('update', (editorInstance) => { // 'update' event is triggered on every editor change
        handleEditorChange(editorInstance);
      });
  }, [readOnly, value, handleEditorChange]); // Re-create editor if readOnly or value changes

  return <EditorComponent />;
};
