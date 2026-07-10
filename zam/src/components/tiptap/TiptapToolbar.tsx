'use client';

import type { Editor } from '@tiptap/react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  TableOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@/components/admin/icons';

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`tiptap-toolbar-btn${active ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function setLink(editor: Editor) {
  const previous = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('Холбоосын URL', previous || 'https://');
  if (url === null) return;
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function insertImage(editor: Editor) {
  const url = window.prompt('Зургийн URL');
  if (!url) return;
  editor.chain().focus().setImage({ src: url }).run();
}

function insertTable(editor: Editor) {
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}

export default function TiptapToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  return (
    <div className="tiptap-editor__toolbar">
      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Буцаах">
          <UndoOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Дахин хийх">
          <RedoOutlined />
        </ToolbarButton>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <select
          className="tiptap-toolbar-select"
          value={currentHeading}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'p') {
              editor.chain().focus().setParagraph().run();
              return;
            }
            const level = Number(value.replace('h', '')) as 1 | 2 | 3;
            editor.chain().focus().toggleHeading({ level }).run();
          }}
        >
          <option value="p">Энгийн текст</option>
          <option value="h1">Гарчиг 1</option>
          <option value="h2">Гарчиг 2</option>
          <option value="h3">Гарчиг 3</option>
        </select>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Тод">
          <BoldOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Налуу">
          <ItalicOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Доогуур зураас">
          <UnderlineOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Дундуур зураас">
          <StrikethroughOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Код">
          <CodeOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          X<sub style={{ fontSize: 10 }}>2</sub>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          X<sup style={{ fontSize: 10 }}>2</sup>
        </ToolbarButton>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <input
          type="color"
          className="tiptap-color-input"
          title="Текстийн өнгө"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#334155'}
        />
        <input
          type="color"
          className="tiptap-color-input"
          title="Тодруулах өнгө"
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          defaultValue="#fef08a"
        />
      </div>

      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Зүүн тийш">
          <AlignLeftOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Төвд">
          <AlignCenterOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Баруун тийш">
          <AlignRightOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Тэгшлэх">
          ≡
        </ToolbarButton>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Жагсаалт">
          <UnorderedListOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Дугаарласан жагсаалт">
          <OrderedListOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Ишлэл">
          “
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Код блок">
          {'{ }'}
        </ToolbarButton>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => setLink(editor)} active={editor.isActive('link')} title="Холбоос">
          <LinkOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertImage(editor)} title="Зураг">
          <PictureOutlined />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Хэвтээ шугам">
          ―
        </ToolbarButton>
        <ToolbarButton onClick={() => insertTable(editor)} title="Хүснэгт">
          <TableOutlined />
        </ToolbarButton>
      </div>

      <div className="tiptap-editor__toolbar-group">
        <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} title="Багана нэмэх">
          Col+
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} title="Мөр нэмэх">
          Row+
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} title="Хүснэгт устгах">
          Tbl×
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Цэвэрлэх"
        >
          Clear
        </ToolbarButton>
      </div>
    </div>
  );
}
