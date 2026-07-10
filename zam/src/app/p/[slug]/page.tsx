'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import SiteWidgetRenderer from '@/components/public/SiteWidgetRenderer';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  type HomepageContent,
} from '@/lib/homepage';

function findCustomPage(content: HomepageContent, rawSlug: string) {
  const slug = decodeURIComponent(String(rawSlug || '')).trim();
  const pages = content.custom_pages || [];
  if (!slug) return null;

  const bySlug = pages.find((p) => p.slug === slug || p.slug === rawSlug);
  if (bySlug) return bySlug;

  // Fallback: match via nav href (/p/xxx)
  const navHit = (content.nav_menu || []).find(
    (n) => n.type === 'custom' && (n.href === `/p/${slug}` || n.href === `/p/${rawSlug}`),
  );
  if (navHit?.pageId) {
    return pages.find((p) => p.id === navHit.pageId) || null;
  }

  return null;
}

export default function CustomPageView() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchPublicHomepage().then((data) => {
      setContent(data);
      setReady(true);
    });
  }, []);

  const page = useMemo(() => findCustomPage(content, slug), [content, slug]);

  useEffect(() => {
    if (page?.title) document.title = page.title;
  }, [page?.title]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-500">
        Ачааллаж байна...
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <PublicSiteHeader
          companyName={content.company_name || 'Үлэмжийн зам'}
          logo={content.logo}
          navItems={content.nav_menu}
        />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold">Хуудас олдсонгүй</h1>
          <p className="mt-2 text-slate-500">
            Энэ цэс/хуудас байхгүй эсвэл хадгалаагүй байна. Админ → Цэс & Виджет дээр дахин хадгална уу.
          </p>
          <p className="mt-2 text-xs text-slate-400">slug: {slug || '—'}</p>
        </div>
        <PublicSiteFooter content={content} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        activeHref={`/p/${page.slug}`}
        navItems={content.nav_menu}
      />
      {page.widgets.length === 0 ? (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold">{page.title}</h1>
          <p className="mt-2 text-slate-500">Энэ хуудас хоосон байна. Админаас виджет нэмнэ үү.</p>
        </div>
      ) : (
        page.widgets.map((widget) => <SiteWidgetRenderer key={widget.id} widget={widget} />)
      )}
      <PublicSiteFooter content={content} />
    </main>
  );
}
