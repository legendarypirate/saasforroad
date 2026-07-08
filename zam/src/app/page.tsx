'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicBgImage from '@/components/public/PublicBgImage';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

const BRAND_GREEN = '#3daf72';

export default function Home() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    fetchPublicHomepage().then(setContent);
  }, []);

  useEffect(() => {
    const slides = content.hero_slides?.length ? content.hero_slides : getDefaultHomepageContent().hero_slides;
    const timer = setInterval(() => setHeroSlide((s) => (s + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [content.hero_slides]);

  const heroBg = resolveImageUrl(content.hero_bg_image || '/bg.png');
  const heroSlides = content.hero_slides?.length
    ? content.hero_slides
    : getDefaultHomepageContent().hero_slides;
  const slide = heroSlides[heroSlide];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader companyName={content.company_name || 'Үлэмжийн зам'} />

      {/* Hero — compact, left-aligned */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <PublicBgImage src={heroBg} alt="Замын төсөл" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/92 via-[#0a1219]/75 to-[#0a1219]/35" />
        </div>

        <div className="relative mx-auto flex min-h-[420px] max-h-[560px] max-w-7xl flex-col justify-center px-4 py-16 md:min-h-[480px] md:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-emerald-300">{slide.badge}</p>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
              {slide.title}
            </h1>
            <p className="mb-8 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              {slide.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                ТӨСЛҮҮДИЙГ ҮЗЭХ
                <ArrowRightOutlined />
              </Link>
              <Link
                href="/technology"
                className="rounded-md border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                МАНАЙ ТЕХНОЛОГИ
              </Link>
            </div>
          </div>

          <div className="mt-10 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Слайд ${i + 1}`}
                onClick={() => setHeroSlide(i)}
                className={`h-1 rounded-full transition-all ${
                  heroSlide === i ? 'w-8 bg-white' : 'w-5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">
              {content.about_label || 'ТЭРГҮҮЛЭГЧ'}
            </p>
            <h2 className="mb-5 text-2xl font-extrabold leading-snug text-slate-900 md:text-3xl lg:text-4xl">
              {content.about_title ||
                'Иргэний дэд бүтцийн стандартыг шинэчлэн тодорхойлсон арван жил.'}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
              {content.about_text1}
            </p>
            <p className="mb-8 text-sm leading-relaxed text-slate-600 md:text-base">
              {content.about_text2}
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              ДЭЛГЭРЭНГҮЙ
              <ArrowRightOutlined />
            </Link>
            <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-6">
              {(content.stats.length ? content.stats.slice(0, 2) : [
                { value: '10+ жил', label: 'Салбартаа тэргүүлэгч' },
                { value: 'ISO 9001', label: 'Чанарын менежмент' },
              ]).map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-extrabold text-slate-900 md:text-2xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl shadow-lg">
              <PublicBgImage src={resolveImageUrl(content.about_image || '/p1.png')} alt="Төсөл" />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage src="/p2.png" alt="Инженерчлэл" />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage src="/p3.png" alt="Барилга" />
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">
                {content.projects_label || 'ТӨСЛҮҮД'}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                {content.projects_title || 'Нутаг дэвсгэр даяарх онцлох төслүүд.'}
              </h2>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-slate-900"
            >
              БҮХ ТӨСЛИЙГ ҮЗЭХ <ArrowRightOutlined className="text-xs" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.projects.slice(0, 3).map((project, idx) => (
              <article
                key={`${project.title}-${idx}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <PublicBgImage src={resolveImageUrl(project.image)} alt={project.title} />
                  <span
                    className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
                    style={{ backgroundColor: BRAND_GREEN }}
                  >
                    {project.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{project.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">{project.desc}</p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-bold tracking-wide text-slate-800"
                  >
                    КЕЙС СУДАЛГАА <ArrowRightOutlined className="rotate-[-45deg] text-[10px]" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section id="awards" className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">{content.awards_label}</p>
            <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{content.awards_title}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {content.awards.map((award) => (
              <div
                key={`${award.title}-${award.year}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg"
                  style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}
                >
                  <TrophyOutlined />
                </div>
                <h3 className="text-sm font-bold leading-snug text-slate-900">{award.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{award.issuer}</p>
                <p className="mt-3 text-xs font-bold tracking-wide text-slate-400">{award.year} он</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="border-t border-slate-200 bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">{content.partners_label}</p>
            <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{content.partners_title}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {content.partners.map((partner) => (
              <span
                key={partner.name}
                className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                {partner.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <PublicSiteFooter content={content} />
    </main>
  );
}
