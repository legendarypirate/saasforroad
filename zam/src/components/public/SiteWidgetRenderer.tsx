'use client';

import Link from 'next/link';
import PublicBgImage from '@/components/public/PublicBgImage';
import RichContent from '@/components/RichContent';
import { resolveImageUrl } from '@/lib/homepage';
import type { SiteWidget } from '@/lib/siteMenu';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export default function SiteWidgetRenderer({ widget }: { widget: SiteWidget }) {
  const d = widget.data || {};

  switch (widget.type) {
    case 'hero': {
      const image = resolveImageUrl(asString(d.image, '/bg.png'));
      return (
        <section className="relative min-h-[280px] overflow-hidden md:min-h-[360px]">
          <div className="absolute inset-0">
            <PublicBgImage src={image} alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/70 to-[#0a1219]/40" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
            {asString(d.badge) ? (
              <p className="mb-3 text-[11px] font-bold tracking-[0.22em] text-emerald-300">
                {asString(d.badge)}
              </p>
            ) : null}
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              {asString(d.title, 'Гарчиг')}
            </h1>
            {asString(d.subtitle) ? (
              <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
                {asString(d.subtitle)}
              </p>
            ) : null}
          </div>
        </section>
      );
    }

    case 'text':
      return (
        <section className="bg-white py-14 px-4 md:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {asString(d.title) ? (
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                {asString(d.title)}
              </h2>
            ) : null}
            <RichContent
              content={asString(d.body)}
              className="prose prose-slate max-w-none text-slate-600"
            />
          </div>
        </section>
      );

    case 'image': {
      const image = resolveImageUrl(asString(d.image, '/p1.png'));
      return (
        <section className="bg-white py-10 px-4 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-lg">
              <PublicBgImage src={image} alt={asString(d.caption) || 'Зураг'} />
            </div>
            {asString(d.caption) ? (
              <p className="mt-3 text-center text-sm text-slate-500">{asString(d.caption)}</p>
            ) : null}
          </div>
        </section>
      );
    }

    case 'cta':
      return (
        <section className="px-4 py-16 lg:px-8" style={{ backgroundColor: BRAND_DARK }}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">{asString(d.title)}</h2>
            {asString(d.text) ? (
              <p className="mt-3 text-sm text-slate-300 md:text-base">{asString(d.text)}</p>
            ) : null}
            {asString(d.buttonLabel) ? (
              <Link
                href={asString(d.buttonHref, '/#contact')}
                className="mt-8 inline-flex rounded-lg px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                {asString(d.buttonLabel)}
              </Link>
            ) : null}
          </div>
        </section>
      );

    case 'cards': {
      const items = asArray<{ title?: string; desc?: string; image?: string }>(d.items);
      return (
        <section className="bg-[#f6f7f9] py-16 px-4 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {asString(d.title) ? (
              <h2 className="mb-10 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
                {asString(d.title)}
              </h2>
            ) : null}
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((item, i) => (
                <article
                  key={`${item.title}-${i}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {item.image ? (
                    <div className="relative aspect-[4/3]">
                      <PublicBgImage src={resolveImageUrl(item.image)} alt={item.title || ''} />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'gallery': {
      const images = asArray<string>(d.images);
      return (
        <section className="bg-white py-16 px-4 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {asString(d.title) ? (
              <h2 className="mb-10 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
                {asString(d.title)}
              </h2>
            ) : null}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {images.map((src, i) => (
                <div key={`${src}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <PublicBgImage src={resolveImageUrl(src)} alt="" />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
