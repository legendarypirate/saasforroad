'use client';

import { useEffect, useState } from 'react';
import RichContent from '@/components/RichContent';
import PublicBgImage from '@/components/public/PublicBgImage';
import {
  AimOutlined,
  EyeOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
} from '@/components/admin/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

const DEFAULT_STATS = [
  { value: '10+ жил', label: 'Салбартаа тэргүүлэгч' },
  { value: '400+ км', label: 'Хатуу хучилттай зам' },
  { value: 'ISO 9001', label: 'Чанарын менежмент' },
  { value: '100+ км/жил', label: 'Гүйцэтгэлийн хүчин чадал' },
];

export default function AboutPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    document.title = 'Бидний тухай';
    fetchPublicHomepage().then(setContent);
  }, []);

  const stats = content.stats?.length ? content.stats : DEFAULT_STATS;
  const directorImage = resolveImageUrl(content.director_image || '/p1.png');

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        activeHref="/about"
        navItems={content.nav_menu}
      />

      {/* Page hero */}
      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Замын төсөл" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.about_hero_badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.about_hero_title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            {content.company_tagline || 'Зам барилгын салбарт найдвартай түнш, чанарын баталгаатай хамт олон.'}
          </p>
        </div>
      </section>

      {/* Director greeting */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">УДИРДЛАГА</p>
          <h2 className="mb-10 text-2xl font-extrabold text-slate-900 md:text-3xl">Захирлын мэндчилгээ</h2>

          <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            <div className="mx-auto w-full max-w-xs lg:mx-0">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <PublicBgImage src={directorImage} alt="Гүйцэтгэх захирал" />
              </div>
              <div className="mt-5 text-center lg:text-left">
                <p className="text-lg font-extrabold text-slate-900">{content.director_role}</p>
                <p className="text-sm text-slate-500">{content.company_name}</p>
              </div>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-slate-600 md:text-base">
              {content.director_paragraphs.map((paragraph) => (
                <RichContent key={paragraph.slice(0, 48)} content={paragraph} as="p" className="mb-0" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About company */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">
                {content.about_label || 'ТАНИЛЦУУЛГА'}
              </p>
              <h2 className="mb-5 text-2xl font-extrabold leading-snug text-slate-900 md:text-3xl">
                {content.about_title || 'Иргэний дэд бүтцийн стандартыг шинэчлэн тодорхойлсон арван жил.'}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
                {content.about_text1 ||
                  'Монгол Улсын авто замын салбарын төлөөлөгчийн нэг болох манай компани нь хатуу болон хайрган хучилттай авто зам, төмөр бетон гүүр барих, засварлах болон төслийн удирдлагын чиглэлээр үйл ажиллагаагаа тогтвортой явуулж байгаа хамт олон юм.'}
              </p>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                {content.about_text2 ||
                  'Бид нэгэн зэрэг олон төсөл бие даан удирдан зохион байгуулах бүрэн боломж бүхий инженер, техникийн ажилчдын бүрэлдэхүүнтэй бөгөөд олон улсын стандартад нийцсэн аюулгүй ажиллагааг нэвтрүүлсэн, чадварлаг инженерийн баг бүхий хамт олон болон хөгжиж байна.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.slice(0, 4).map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xl font-extrabold text-slate-900 md:text-2xl">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-md md:col-span-2">
              <PublicBgImage src={resolveImageUrl('/p1.png')} alt="Төсөл" />
            </div>
            <div className="grid gap-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
                <PublicBgImage src={resolveImageUrl('/p2.png')} alt="Инженерчлэл" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
                <PublicBgImage src={resolveImageUrl('/p3.png')} alt="Барилга" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, vision, values */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-center text-xs font-bold tracking-[0.18em] text-slate-500">
            БОДЛОГО
          </p>
          <h2 className="mb-12 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
            Компанийн бодлого, зорилтууд
          </h2>

          <div className="mb-14 grid gap-6 md:grid-cols-2">
            <div
              className="rounded-2xl border border-slate-200 p-8 shadow-sm"
              style={{ borderTopWidth: 4, borderTopColor: BRAND_GREEN }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <AimOutlined />
              </div>
              <h3 className="mb-3 text-lg font-extrabold text-slate-900">Эрхэм зорилго</h3>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">{content.mission_text}</p>
            </div>

            <div
              className="rounded-2xl border border-slate-200 p-8 shadow-sm"
              style={{ borderTopWidth: 4, borderTopColor: BRAND_DARK }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ backgroundColor: BRAND_DARK }}
              >
                <EyeOutlined />
              </div>
              <h3 className="mb-3 text-lg font-extrabold text-slate-900">Алсын хараа</h3>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">{content.vision_text}</p>
            </div>
          </div>

          <div
            className="rounded-2xl border border-slate-200 p-8 shadow-sm md:p-10"
            style={{ borderTopWidth: 4, borderTopColor: BRAND_GREEN }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <HeartOutlined />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 md:text-xl">Үнэт зүйлс</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.values.map((v) => (
                <div key={v.title} className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-1 text-xs font-bold tracking-wide text-emerald-700">{v.title}</p>
                  <p className="text-sm leading-relaxed text-slate-600">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications / features */}
      {content.features?.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-center text-xs font-bold tracking-[0.18em] text-slate-500">
              БАТЛАЛТ
            </p>
            <h2 className="mb-10 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
              Стандарт, шагнал урамшуулал
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl"
                    style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}
                  >
                    <SafetyCertificateOutlined />
                  </div>
                  <h3 className="text-sm font-bold leading-snug text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicSiteFooter content={content} />
    </main>
  );
}
