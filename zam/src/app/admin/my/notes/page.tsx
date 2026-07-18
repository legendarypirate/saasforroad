'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  StarOutlined,
} from '@/components/admin/icons';
import { Button, Input, message } from '@/components/admin/primitives';
import RichTextEditor from '@/components/RichTextEditor';
import {
  buildNoteTree,
  personalNotesApi,
  type NoteTreeNode,
  type PersonalNote,
} from '@/lib/personalNotes';
import { cn } from '@/lib/utils';

function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return useCallback(
    (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  );
}

function NoteTreeItem({
  node,
  depth,
  activeId,
  onSelect,
}: {
  node: NoteTreeNode;
  depth: number;
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          activeId === node.id
            ? 'bg-primary/10 font-semibold text-primary'
            : 'text-foreground hover:bg-muted',
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <span className="shrink-0 text-base leading-none">
          {node.icon || '📄'}
        </span>
        <span className="min-w-0 flex-1 truncate">
          {node.title || 'Гарчиггүй'}
        </span>
        {node.is_favorite ? (
          <StarOutlined className="size-3.5 shrink-0 fill-amber-500 text-amber-500" />
        ) : null}
      </button>
      {node.children.map((child) => (
        <NoteTreeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function PersonalNotesPage() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const active = notes.find((n) => n.id === activeId) || null;

  const tree = useMemo(() => buildNoteTree(notes), [notes]);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const rows = await personalNotesApi.list(search);
      setNotes(rows);
      return rows;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
      return [] as PersonalNote[];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Тэмдэглэл';
    void load().then((rows) => {
      if (rows.length && activeId == null) {
        setActiveId(rows[0].id);
        setTitle(rows[0].title || '');
        setContent(rows[0].content || '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectNote = (id: number) => {
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    setActiveId(id);
    setTitle(n.title || '');
    setContent(n.content || '');
    setDirty(false);
  };

  const persist = useCallback(
    async (id: number, patch: { title?: string; content?: string }) => {
      setSaving(true);
      try {
        const updated = await personalNotesApi.update(id, patch);
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
        setDirty(false);
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Хадгалж чадсангүй');
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const debouncedSave = useDebouncedCallback(
    (id: number, nextTitle: string, nextContent: string) => {
      void persist(id, { title: nextTitle, content: nextContent });
    },
    600,
  );

  const onTitleChange = (value: string) => {
    setTitle(value);
    setDirty(true);
    if (activeId != null) debouncedSave(activeId, value, content);
  };

  const onContentChange = (value: string) => {
    setContent(value);
    setDirty(true);
    if (activeId != null) debouncedSave(activeId, title, value);
  };

  const createNote = async (parentId: number | null = null) => {
    try {
      const created = await personalNotesApi.create({
        title: 'Гарчиггүй',
        content: '',
        parent_id: parentId,
      });
      setNotes((prev) => [created, ...prev]);
      setActiveId(created.id);
      setTitle(created.title);
      setContent(created.content || '');
      setDirty(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Үүсгэж чадсангүй');
    }
  };

  const toggleFavorite = async () => {
    if (!active) return;
    try {
      const updated = await personalNotesApi.update(active.id, {
        is_favorite: !active.is_favorite,
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === active.id ? { ...n, ...updated } : n)),
      );
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    }
  };

  const deleteNote = async () => {
    if (!active) return;
    if (!window.confirm('Энэ хуудас болон дэд хуудсуудыг устгах уу?')) return;
    try {
      await personalNotesApi.remove(active.id);
      const remaining = await load(q);
      if (remaining.length) {
        setActiveId(remaining[0].id);
        setTitle(remaining[0].title || '');
        setContent(remaining[0].content || '');
        setDirty(false);
      } else {
        setActiveId(null);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Устгаж чадсангүй');
    }
  };

  const onSearch = async (value: string) => {
    setQ(value);
    const rows = await load(value);
    if (activeId && !rows.some((r) => r.id === activeId) && rows[0]) {
      setActiveId(rows[0].id);
      setTitle(rows[0].title || '');
      setContent(rows[0].content || '');
      setDirty(false);
    }
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-7.5rem)] min-h-[520px] overflow-hidden border border-border bg-background md:-m-6">
      {/* Sidebar */}
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-border bg-muted/30">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="relative min-w-0 flex-1">
            <SearchOutlined className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              allowClear
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onPressEnter={() => onSearch(q)}
              placeholder="Хайх..."
              className="pl-8"
            />
          </div>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => createNote(null)}
            title="Шинэ хуудас"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && !notes.length ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Ачаалж байна...
            </p>
          ) : tree.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Тэмдэглэл байхгүй
              </p>
              <Button type="primary" onClick={() => createNote(null)}>
                Шинэ хуудас үүсгэх
              </Button>
            </div>
          ) : (
            tree.map((node) => (
              <NoteTreeItem
                key={node.id}
                node={node}
                depth={0}
                activeId={activeId}
                onSelect={selectNote}
              />
            ))
          )}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex min-w-0 flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
            <p className="text-muted-foreground">Шинэ хуудас үүсгэх</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => createNote(null)}>
              Шинэ хуудас
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
              <Button
                size="small"
                icon={<StarOutlined className={active.is_favorite ? 'fill-amber-500 text-amber-500' : undefined} />}
                onClick={toggleFavorite}
              >
                {active.is_favorite ? 'Дуртай' : 'Дуртай болгох'}
              </Button>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => createNote(active.id)}
              >
                Дэд хуудас
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={deleteNote}
              >
                Устгах
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {saving ? 'Хадгалж байна…' : dirty ? 'Өөрчлөгдсөн' : 'Хадгалсан'}
              </span>
            </div>
            <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-8">
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Гарчиггүй"
                className="mb-6 w-full border-0 bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50"
              />
              <RichTextEditor
                value={content}
                onChange={onContentChange}
                placeholder="Энд бичиж эхлээрэй…"
                minHeight={360}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
