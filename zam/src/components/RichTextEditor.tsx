'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    [],
  );

  return (
    <div
      className="rich-text-editor rounded-md border border-slate-200 bg-white [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:rounded-b-md [&_.ql-container]:border-0"
      style={{ ['--editor-min-height' as string]: `${minHeight}px` }}
    >
      <QuillEditor
        theme="snow"
        value={value ?? ''}
        onChange={(content) => onChange?.(content)}
        placeholder={placeholder}
        modules={modules}
        className="[&_.ql-editor]:min-h-[var(--editor-min-height)] [&_.ql-container]:min-h-[var(--editor-min-height)]"
      />
    </div>
  );
}
