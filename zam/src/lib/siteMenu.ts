/** Fixed widget catalog + menu / custom page types for the lightweight CMS. */

export type SiteWidgetType =
  | 'hero'
  | 'text'
  | 'image'
  | 'cta'
  | 'cards'
  | 'gallery';

export type SiteNavItemType = 'system' | 'custom' | 'link';

export interface SiteWidget {
  id: string;
  type: SiteWidgetType;
  /** Widget-specific fields */
  data: Record<string, unknown>;
}

export interface SiteCustomPage {
  id: string;
  slug: string;
  title: string;
  widgets: SiteWidget[];
}

export interface SiteNavItem {
  id: string;
  label: string;
  /** system | custom | link */
  type: SiteNavItemType;
  /** For system: /about etc. For link: any URL. For custom: /p/{slug} */
  href: string;
  /** When type=custom, points to SiteCustomPage.id */
  pageId?: string;
  visible: boolean;
  order: number;
}

export const SYSTEM_PAGES = [
  { href: '/about', label: 'Бидний тухай' },
  { href: '/technology', label: 'Технологи' },
  { href: '/projects', label: 'Төслүүд' },
  { href: '/hr', label: 'Ажлын байр' },
  { href: '/news', label: 'Мэдээлэл' },
  { href: '/standart', label: 'Стандарт' },
] as const;

export const WIDGET_CATALOG: Array<{
  type: SiteWidgetType;
  label: string;
  desc: string;
  defaults: Record<string, unknown>;
}> = [
  {
    type: 'hero',
    label: 'Hero',
    desc: 'Том гарчиг, арын зураг',
    defaults: {
      badge: 'ШИНЭ',
      title: 'Гарчиг',
      subtitle: 'Тайлбар текст',
      image: '/bg.png',
    },
  },
  {
    type: 'text',
    label: 'Текст',
    desc: 'Гарчиг + баялаг текст',
    defaults: {
      title: 'Гарчиг',
      body: '<p>Энд текст бичнэ үү...</p>',
    },
  },
  {
    type: 'image',
    label: 'Зураг',
    desc: 'Нэг зураг + тайлбар',
    defaults: {
      image: '/p1.png',
      caption: '',
    },
  },
  {
    type: 'cta',
    label: 'CTA',
    desc: 'Дуудлага үйлдэл',
    defaults: {
      title: 'Холбоо барих',
      text: 'Бидэнтэй холбогдоорой',
      buttonLabel: 'Холбоо барих',
      buttonHref: '/#contact',
    },
  },
  {
    type: 'cards',
    label: 'Картууд',
    desc: '3 багана карт',
    defaults: {
      title: 'Онцлох',
      items: [
        { title: 'Карт 1', desc: 'Тайлбар', image: '/p1.png' },
        { title: 'Карт 2', desc: 'Тайлбар', image: '/p2.png' },
        { title: 'Карт 3', desc: 'Тайлбар', image: '/p3.png' },
      ],
    },
  },
  {
    type: 'gallery',
    label: 'Галерей',
    desc: 'Зургийн цомог',
    defaults: {
      title: 'Галерей',
      images: ['/p1.png', '/p2.png', '/p3.png'],
    },
  },
];

export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(text: string): string {
  const ascii = String(text)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  // Mongolian / non-latin titles often strip to empty — use stable id slug
  return ascii || `page-${Date.now().toString(36)}`;
}

export function getDefaultNavMenu(): SiteNavItem[] {
  return SYSTEM_PAGES.map((p, i) => ({
    id: `nav_sys_${p.href.replace(/\W/g, '_')}`,
    label: p.label,
    type: 'system' as const,
    href: p.href,
    visible: true,
    order: i,
  }));
}

export function createWidget(type: SiteWidgetType): SiteWidget {
  const catalog = WIDGET_CATALOG.find((w) => w.type === type)!;
  return {
    id: createId('w'),
    type,
    data: JSON.parse(JSON.stringify(catalog.defaults)) as Record<string, unknown>,
  };
}

export function createEmptyCustomPage(title: string, slug?: string): SiteCustomPage {
  const id = createId('page');
  const safeSlug = slugify(slug || title);
  // Prefer ascii slug; if title was non-latin, slugify already fell back to page-*
  return {
    id,
    slug: safeSlug.startsWith('page-') ? id.replace(/^page_/, 'p-') : safeSlug,
    title: title.trim() || 'Шинэ хуудас',
    widgets: [],
  };
}

export function resolveNavItems(items?: SiteNavItem[] | null): SiteNavItem[] {
  if (!items?.length) return getDefaultNavMenu();
  return [...items]
    .map((item, i) => ({
      ...item,
      visible: item.visible !== false,
      order: typeof item.order === 'number' ? item.order : i,
    }))
    .sort((a, b) => a.order - b.order);
}
