'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, CalendarOutlined } from '@/components/admin/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicBgImage from '@/components/public/PublicBgImage';
import { getNewsArticles, formatNewsDate } from '@/lib/news';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

const CATEGORIES = ['Бүгд', 'Компанийн мэдээлэл', 'Төсөл', 'Тендер'] as const;

export default function NewsPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Бүгд');

  useEffect(() => {
    document.title = 'Мэдээлэл';
    fetchPublicHomepage().then(setContent);
  }, []);

  const articles = getNewsArticles(content);

  const filtered = useMemo(() => {
    if (category === 'Бүгд') return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  const featured = articles.find((a) => a.isNew) ?? articles[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        activeHref="/news"
        navItems={content.nav_menu}
      />

      {/* Hero */}
      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Мэдээлэл" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.news_hero.badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.news_hero.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{content.news_hero.subtitle}</p>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ОНЦЛОХ МЭДЭЭ</p>
            <Link
              href={`/news/${featured.id}`}
              className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition hover:shadow-xl lg:grid-cols-2"
            >
              <div className="relative min-h-[260px] lg:min-h-[340px]">
                <PublicBgImage src={resolveImageUrl(featured.image)} alt={featured.title} />
                {featured.isNew && (
                  <span
                    className="absolute left-4 top-4 rounded px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: BRAND_GREEN }}
                  >
                    Шинэ
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="mb-2 text-xs font-bold tracking-wide text-emerald-700">{featured.category}</p>
                <h2 className="mb-4 text-xl font-extrabold leading-snug text-slate-900 transition group-hover:text-emerald-700 md:text-2xl">
                  {featured.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarOutlined />
                    {formatNewsDate(featured.date)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-800">
                    Цааш унших <ArrowRightOutlined className="text-xs" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* News grid */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">КОМПАНИЙН МЭДЭЭЛЭЛ</p>
          <h2 className="mb-8 text-2xl font-extrabold text-slate-900 md:text-3xl">Бүх мэдээ</h2>

          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === cat
                    ? 'text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                style={category === cat ? { backgroundColor: BRAND_DARK } : undefined}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <PublicBgImage src={resolveImageUrl(article.image)} alt={article.title} />
                  {article.isNew && (
                    <span
                      className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      Шинэ
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wide text-emerald-700">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <CalendarOutlined />
                      {article.date}
                    </span>
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-700">
                    {article.title}
                  </h3>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {article.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold tracking-wide text-slate-800">
                    ЦААШ УНШИХ <ArrowRightOutlined className="rotate-[-45deg] text-[10px]" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicSiteFooter content={content} />
    </main>
  );
}
