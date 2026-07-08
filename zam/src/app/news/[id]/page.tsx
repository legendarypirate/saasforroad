'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicBgImage from '@/components/public/PublicBgImage';
import { getNewsArticle, getNewsArticles, formatNewsDate } from '@/lib/news';
import RichContent from '@/components/RichContent';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

const BRAND_GREEN = '#3daf72';

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    fetchPublicHomepage().then(setContent);
  }, []);

  const article = getNewsArticle(id, content);
  const related = getNewsArticles(content).filter((a) => a.id !== id).slice(0, 3);

  useEffect(() => {
    if (article) document.title = article.title;
  }, [article]);

  if (!article) {
    return (
      <main className="min-h-screen bg-white">
        <PublicSiteHeader companyName={content.company_name || 'Үлэмжийн зам'} activeHref="/news" />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Мэдээ олдсонгүй</h1>
          <Link href="/news" className="mt-4 inline-block text-emerald-600 hover:underline">
            ← Бүх мэдээ рүү буцах
          </Link>
        </div>
        <PublicSiteFooter content={content} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader companyName={content.company_name || 'Үлэмжийн зам'} activeHref="/news" />

      <article className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
        <Link
          href="/news"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftOutlined />
          Бүх мэдээ
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            {article.category}
          </span>
          {article.isNew && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Шинэ
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarOutlined />
            {formatNewsDate(article.date)}
          </span>
        </div>

        <h1 className="mb-8 text-2xl font-extrabold leading-snug text-slate-900 md:text-3xl lg:text-4xl">
          {article.title}
        </h1>

        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl shadow-lg">
          <PublicBgImage src={resolveImageUrl(article.image)} alt={article.title} />
        </div>

        <RichContent
          content={article.body}
          className="text-sm leading-relaxed text-slate-700 md:text-base"
        />
      </article>

      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-14 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-xl font-extrabold text-slate-900">Бусад мэдээ</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-[16/10]">
                    <PublicBgImage src={resolveImageUrl(item.image)} alt={item.title} />
                  </div>
                  <div className="p-4">
                    <p className="mb-1 text-[11px] text-slate-400">{item.date}</p>
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicSiteFooter content={content} />
    </main>
  );
}
