'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

import TiptapToolbar from './TiptapToolbar';
import './tiptap.css';

type TiptapEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export default function TiptapEditor({
  value,
  onChange,
  placeholder = 'Текст бичнэ үү...',
  minHeight = 220,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      Image.configure({ HTMLAttributes: { class: 'tiptap-image' } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Subscript,
      Superscript,
    ],
    content: value || '',
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className="tiptap-editor"
      style={{ ['--editor-min-height' as string]: `${minHeight}px` }}
    >
      <TiptapToolbar editor={editor} />
      <div className="tiptap-editor__content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
