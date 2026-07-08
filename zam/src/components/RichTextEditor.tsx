'use client';

import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('./tiptap/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      Редактор ачааллаж байна...
    </div>
  ),
});

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
  return (
    <TiptapEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
}
