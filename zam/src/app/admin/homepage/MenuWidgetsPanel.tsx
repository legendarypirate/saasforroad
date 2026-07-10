'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react';

import ImageUploadField from '@/components/admin/ImageUploadField';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { HomepageContent } from '@/lib/homepage';
import {
  createEmptyCustomPage,
  createId,
  createWidget,
  resolveNavItems,
  slugify,
  SYSTEM_PAGES,
  WIDGET_CATALOG,
  type SiteCustomPage,
  type SiteNavItem,
  type SiteWidget,
  type SiteWidgetType,
} from '@/lib/siteMenu';
import { cn } from '@/lib/utils';

type Props = {
  content: HomepageContent;
  onChange: (patch: Partial<HomepageContent>) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return list;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

function WidgetEditor({
  widget,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canUp,
  canDown,
}: {
  widget: SiteWidget;
  onChange: (w: SiteWidget) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const meta = WIDGET_CATALOG.find((c) => c.type === widget.type);
  const d = widget.data;

  const setData = (key: string, value: unknown) => {
    onChange({ ...widget, data: { ...d, [key]: value } });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{meta?.label || widget.type}</p>
          <p className="text-xs text-muted-foreground">{meta?.desc}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" disabled={!canUp} onClick={onMoveUp}>
            <ArrowUp className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" disabled={!canDown} onClick={onMoveDown}>
            <ArrowDown className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {widget.type === 'hero' && (
        <>
          <Field label="Тэмдэглэгээ">
            <Input value={String(d.badge || '')} onChange={(e) => setData('badge', e.target.value)} />
          </Field>
          <Field label="Гарчиг">
            <Input value={String(d.title || '')} onChange={(e) => setData('title', e.target.value)} />
          </Field>
          <Field label="Тайлбар">
            <Textarea rows={2} value={String(d.subtitle || '')} onChange={(e) => setData('subtitle', e.target.value)} />
          </Field>
          <ImageUploadField label="Арын зураг" value={String(d.image || '')} onChange={(v) => setData('image', v)} />
        </>
      )}

      {widget.type === 'text' && (
        <>
          <Field label="Гарчиг">
            <Input value={String(d.title || '')} onChange={(e) => setData('title', e.target.value)} />
          </Field>
          <Field label="Агуулга">
            <RichTextEditor
              minHeight={200}
              value={String(d.body || '')}
              onChange={(html) => setData('body', html)}
            />
          </Field>
        </>
      )}

      {widget.type === 'image' && (
        <>
          <ImageUploadField label="Зураг" value={String(d.image || '')} onChange={(v) => setData('image', v)} />
          <Field label="Тайлбар">
            <Input value={String(d.caption || '')} onChange={(e) => setData('caption', e.target.value)} />
          </Field>
        </>
      )}

      {widget.type === 'cta' && (
        <>
          <Field label="Гарчиг">
            <Input value={String(d.title || '')} onChange={(e) => setData('title', e.target.value)} />
          </Field>
          <Field label="Текст">
            <Textarea rows={2} value={String(d.text || '')} onChange={(e) => setData('text', e.target.value)} />
          </Field>
          <Field label="Товчны текст">
            <Input value={String(d.buttonLabel || '')} onChange={(e) => setData('buttonLabel', e.target.value)} />
          </Field>
          <Field label="Товчны холбоос">
            <Input value={String(d.buttonHref || '')} onChange={(e) => setData('buttonHref', e.target.value)} />
          </Field>
        </>
      )}

      {widget.type === 'cards' && (
        <>
          <Field label="Хэсгийн гарчиг">
            <Input value={String(d.title || '')} onChange={(e) => setData('title', e.target.value)} />
          </Field>
          {(Array.isArray(d.items) ? d.items : []).map((item: any, index: number) => (
            <div key={index} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    const items = [...(Array.isArray(d.items) ? d.items : [])];
                    items.splice(index, 1);
                    setData('items', items);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Input
                placeholder="Гарчиг"
                value={item.title || ''}
                onChange={(e) => {
                  const items = [...(Array.isArray(d.items) ? d.items : [])];
                  items[index] = { ...item, title: e.target.value };
                  setData('items', items);
                }}
              />
              <Textarea
                rows={2}
                placeholder="Тайлбар"
                value={item.desc || ''}
                onChange={(e) => {
                  const items = [...(Array.isArray(d.items) ? d.items : [])];
                  items[index] = { ...item, desc: e.target.value };
                  setData('items', items);
                }}
              />
              <ImageUploadField
                label="Зураг"
                value={item.image || ''}
                onChange={(v) => {
                  const items = [...(Array.isArray(d.items) ? d.items : [])];
                  items[index] = { ...item, image: v };
                  setData('items', items);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setData('items', [
                ...(Array.isArray(d.items) ? d.items : []),
                { title: '', desc: '', image: '/p1.png' },
              ])
            }
          >
            <Plus className="size-3.5" /> Карт нэмэх
          </Button>
        </>
      )}

      {widget.type === 'gallery' && (
        <>
          <Field label="Гарчиг">
            <Input value={String(d.title || '')} onChange={(e) => setData('title', e.target.value)} />
          </Field>
          {(Array.isArray(d.images) ? d.images : []).map((src: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <ImageUploadField
                  label={`Зураг ${index + 1}`}
                  value={src}
                  onChange={(v) => {
                    const images = [...(Array.isArray(d.images) ? d.images : [])];
                    images[index] = v;
                    setData('images', images);
                  }}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mt-6 text-destructive"
                onClick={() => {
                  const images = [...(Array.isArray(d.images) ? d.images : [])];
                  images.splice(index, 1);
                  setData('images', images);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setData('images', [...(Array.isArray(d.images) ? d.images : []), '/p1.png'])}
          >
            <Plus className="size-3.5" /> Зураг нэмэх
          </Button>
        </>
      )}
    </div>
  );
}

export default function MenuWidgetsPanel({ content, onChange }: Props) {
  const nav = useMemo(() => resolveNavItems(content.nav_menu), [content.nav_menu]);
  const pages = content.custom_pages || [];
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null);
  const [newTitle, setNewTitle] = useState('');

  const selectedPage = pages.find((p) => p.id === selectedPageId) || null;

  const setNav = (next: SiteNavItem[]) => {
    onChange({
      nav_menu: next.map((item, i) => ({ ...item, order: i })),
    });
  };

  const setPages = (next: SiteCustomPage[]) => {
    onChange({ custom_pages: next });
  };

  const setNavAndPages = (nextNav: SiteNavItem[], nextPages: SiteCustomPage[]) => {
    onChange({
      nav_menu: nextNav.map((item, i) => ({ ...item, order: i })),
      custom_pages: nextPages,
    });
  };

  const updatePage = (pageId: string, patch: Partial<SiteCustomPage>) => {
    setPages(pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)));
  };

  const addCustomMenu = () => {
    const title = newTitle.trim() || 'Шинэ цэс';
    const page = createEmptyCustomPage(title);
    const item: SiteNavItem = {
      id: createId('nav'),
      label: title,
      type: 'custom',
      href: `/p/${page.slug}`,
      pageId: page.id,
      visible: true,
      order: nav.length,
    };
    // Single update — avoids losing custom_pages when nav_menu patches race
    setNavAndPages([...nav, item], [...pages, page]);
    setSelectedPageId(page.id);
    setNewTitle('');
  };

  const addSystemMenu = (href: string, label: string) => {
    if (nav.some((n) => n.href === href)) return;
    setNav([
      ...nav,
      {
        id: createId('nav'),
        label,
        type: 'system',
        href,
        visible: true,
        order: nav.length,
      },
    ]);
  };

  const addExternalLink = () => {
    const label = window.prompt('Цэсний нэр')?.trim();
    if (!label) return;
    const href = window.prompt('Холбоос (URL)', 'https://')?.trim();
    if (!href) return;
    setNav([
      ...nav,
      {
        id: createId('nav'),
        label,
        type: 'link',
        href,
        visible: true,
        order: nav.length,
      },
    ]);
  };

  const removeNav = (id: string) => {
    const item = nav.find((n) => n.id === id);
    const nextNav = nav.filter((n) => n.id !== id);
    if (item?.type === 'custom' && item.pageId) {
      const nextPages = pages.filter((p) => p.id !== item.pageId);
      setNavAndPages(nextNav, nextPages);
      if (selectedPageId === item.pageId) {
        setSelectedPageId(nextPages[0]?.id ?? null);
      }
    } else {
      setNav(nextNav);
    }
  };

  const addWidget = (type: SiteWidgetType) => {
    if (!selectedPage) return;
    updatePage(selectedPage.id, {
      widgets: [...selectedPage.widgets, createWidget(type)],
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Menu list */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Цэс</h3>
          <p className="text-xs text-muted-foreground">
            Header цэсийг нэмэх, нуух, эрэмбэлэх. Шинэ цэс = хоосон хуудас + виджетүүд.
          </p>
        </div>

        <div className="space-y-2">
          {nav.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'rounded-lg border border-border p-2.5',
                item.type === 'custom' && selectedPageId === item.pageId && 'border-primary/50 bg-primary/5',
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    if (item.type === 'custom' && item.pageId) setSelectedPageId(item.pageId);
                  }}
                >
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.type === 'custom' ? 'Шинэ хуудас' : item.type === 'system' ? 'Системийн' : 'Холбоос'} ·{' '}
                    {item.href}
                  </p>
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() =>
                    setNav(nav.map((n) => (n.id === item.id ? { ...n, visible: !n.visible } : n)))
                  }
                >
                  {item.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 opacity-50" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={index === 0}
                  onClick={() => setNav(moveItem(nav, index, -1))}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={index === nav.length - 1}
                  onClick={() => setNav(moveItem(nav, index, 1))}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => removeNav(item.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <Input
                className="mt-2 h-8 text-xs"
                value={item.label}
                onChange={(e) => {
                  const label = e.target.value;
                  const nextNav = nav.map((n) => (n.id === item.id ? { ...n, label } : n));
                  if (item.type === 'custom' && item.pageId) {
                    setNavAndPages(
                      nextNav,
                      pages.map((p) => (p.id === item.pageId ? { ...p, title: label } : p)),
                    );
                  } else {
                    setNav(nextNav);
                  }
                }}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Шинэ цэс (хоосон хуудас)</p>
          <div className="flex gap-2">
            <Input
              placeholder="Цэсний нэр"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomMenu();
              }}
            />
            <Button type="button" size="sm" onClick={addCustomMenu}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Системийн хуудас нэмэх</p>
          <div className="flex flex-wrap gap-1.5">
            {SYSTEM_PAGES.map((p) => (
              <Button
                key={p.href}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={nav.some((n) => n.href === p.href)}
                onClick={() => addSystemMenu(p.href, p.label)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={addExternalLink}>
            <Plus className="size-3.5" /> Гадаад холбоос
          </Button>
        </div>
      </div>

      {/* Widget canvas for custom page */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        {!selectedPage ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-foreground">Хоосон цэс сонгоно уу</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Зүүн талд «Шинэ цэс» үүсгээд виджетүүд нэмнэ. Системийн хуудсууд (/about гэх мэт) өөрийн
              контенттой тул энд засварлахгүй.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-base font-semibold">{selectedPage.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">/p/</span>
                  <Input
                    className="h-8 w-48 text-xs"
                    value={selectedPage.slug}
                    onChange={(e) => {
                      const slug = slugify(e.target.value) || selectedPage.slug;
                      const nextPages = pages.map((p) =>
                        p.id === selectedPage.id ? { ...p, slug } : p,
                      );
                      const nextNav = nav.map((n) =>
                        n.pageId === selectedPage.id ? { ...n, href: `/p/${slug}` } : n,
                      );
                      setNavAndPages(nextNav, nextPages);
                    }}
                  />
                </div>
              </div>
              <a
                href={`/p/${selectedPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                Нээлттэй үзэх →
              </a>
            </div>

            <div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-3">
              <p className="w-full text-xs font-medium text-muted-foreground">Виджет нэмэх</p>
              {WIDGET_CATALOG.map((w) => (
                <Button
                  key={w.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addWidget(w.type)}
                >
                  <Plus className="size-3.5" />
                  {w.label}
                </Button>
              ))}
            </div>

            {selectedPage.widgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <p className="text-sm text-muted-foreground">Хоосон хуудас — дээрээс виджет нэмнэ үү</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPage.widgets.map((widget, index) => (
                  <WidgetEditor
                    key={widget.id}
                    widget={widget}
                    canUp={index > 0}
                    canDown={index < selectedPage.widgets.length - 1}
                    onMoveUp={() =>
                      updatePage(selectedPage.id, {
                        widgets: moveItem(selectedPage.widgets, index, -1),
                      })
                    }
                    onMoveDown={() =>
                      updatePage(selectedPage.id, {
                        widgets: moveItem(selectedPage.widgets, index, 1),
                      })
                    }
                    onRemove={() =>
                      updatePage(selectedPage.id, {
                        widgets: selectedPage.widgets.filter((w) => w.id !== widget.id),
                      })
                    }
                    onChange={(next) =>
                      updatePage(selectedPage.id, {
                        widgets: selectedPage.widgets.map((w) => (w.id === next.id ? next : w)),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
