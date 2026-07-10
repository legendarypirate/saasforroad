'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightOutlined, TrophyOutlined } from '@/components/admin/icons';
import PublicBgImage from '@/components/public/PublicBgImage';
import {
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

export const BRAND_GREEN = '#3daf72';
export const BRAND_DARK = '#121a26';

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
      <span
        className="inline-block h-px w-6 shrink-0"
        style={{ backgroundColor: BRAND_GREEN }}
        aria-hidden
      />
      {children}
    </p>
  );
}

export function HomeHeroSection({
  content,
  priority,
}: {
  content: HomepageContent;
  priority?: boolean;
}) {
  const [heroSlide, setHeroSlide] = useState(0);
  const [visible, setVisible] = useState(true);
  const heroBg = resolveImageUrl(content.hero_bg_image || '/bg.png');
  const heroSlides = content.hero_slides?.length
    ? content.hero_slides
    : getDefaultHomepageContent().hero_slides;
  const slide = heroSlides[heroSlide] ?? heroSlides[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setHeroSlide((s) => (s + 1) % heroSlides.length);
        setVisible(true);
      }, 280);
    }, 7000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goTo = (i: number) => {
    if (i === heroSlide) return;
    setVisible(false);
    window.setTimeout(() => {
      setHeroSlide(i);
      setVisible(true);
    }, 220);
  };

  return (
    <section id="hero" className="relative min-h-[min(88vh,720px)] overflow-hidden">
      <div className="absolute inset-0">
        <PublicBgImage src={heroBg} alt="Замын төсөл" priority={priority} sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/94 via-[#0a1219]/72 to-[#0a1219]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1219]/55 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[min(88vh,720px)] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-20">
        <div
          className={`max-w-2xl transition-all duration-500 ease-out ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <p className="mb-4 text-[11px] font-bold tracking-[0.28em] text-emerald-300/90">
            {slide?.badge}
          </p>
          <h1 className="mb-5 text-[2rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {slide?.title}
          </h1>
          <p className="mb-9 max-w-lg text-[15px] leading-relaxed text-slate-300/95 md:text-base md:leading-7">
            {slide?.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-110"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              Төслүүдийг үзэх
              <ArrowRightOutlined className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/technology"
              className="rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
            >
              Манай технологи
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 md:mt-16">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Слайд ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                heroSlide === i ? 'w-10 bg-white' : 'w-4 bg-white/35 hover:bg-white/55'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeAboutSection({ content }: { content: HomepageContent }) {
  return (
    <section id="about" className="relative overflow-hidden bg-white py-20 md:py-28">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full opacity-[0.07]"
        style={{ background: `radial-gradient(circle, ${BRAND_GREEN}, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <SectionEyebrow>{content.about_label || 'ТЭРГҮҮЛЭГЧ'}</SectionEyebrow>
          <h2 className="mb-6 text-2xl font-extrabold leading-snug tracking-tight text-slate-900 md:text-3xl lg:text-[2.35rem] lg:leading-[1.2]">
            {content.about_title ||
              'Иргэний дэд бүтцийн стандартыг шинэчлэн тодорхойлсон арван жил.'}
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-600 md:text-base md:leading-7">
            <p>{content.about_text1}</p>
            <p>{content.about_text2}</p>
          </div>
          <Link
            href="/about"
            className="group mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            Дэлгэрэнгүй
            <ArrowRightOutlined className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-slate-200/80 pt-8">
            {(content.stats.length
              ? content.stats.slice(0, 2)
              : [
                  { value: '10+ жил', label: 'Салбартаа тэргүүлэгч' },
                  { value: 'ISO 9001', label: 'Чанарын менежмент' },
                ]
            ).map((stat) => (
              <div key={stat.label}>
                <p
                  className="text-2xl font-extrabold tracking-tight md:text-3xl"
                  style={{ color: BRAND_DARK }}
                >
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-3 rounded-[1.75rem] opacity-40"
            style={{
              background: `linear-gradient(135deg, ${BRAND_GREEN}22, transparent 55%)`,
            }}
            aria-hidden
          />
          <div className="relative grid grid-cols-2 gap-3">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(18,26,38,0.45)]">
              <PublicBgImage
                src={resolveImageUrl(content.about_image || '/p1.png')}
                alt="Төсөл"
                className="object-cover transition duration-700 hover:scale-[1.03]"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage
                src="/p2.png"
                alt="Инженерчлэл"
                className="object-cover transition duration-700 hover:scale-[1.04]"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage
                src="/p3.png"
                alt="Барилга"
                className="object-cover transition duration-700 hover:scale-[1.04]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeProjectsSection({ content }: { content: HomepageContent }) {
  return (
    <section id="projects" className="bg-[#f6f7f9] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <SectionEyebrow>{content.projects_label || 'ТӨСЛҮҮД'}</SectionEyebrow>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl lg:text-[2.15rem]">
              {content.projects_title || 'Нутаг дэвсгэр даяарх онцлох төслүүд.'}
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 transition hover:text-slate-900"
          >
            Бүх төслийг үзэх
            <ArrowRightOutlined className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {content.projects.slice(0, 3).map((project, idx) => (
            <article
              key={`${project.title}-${idx}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_48px_-20px_rgba(15,23,42,0.28)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <PublicBgImage
                  src={resolveImageUrl(project.image)}
                  alt={project.title}
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />
                <span
                  className="absolute left-4 top-4 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-white"
                  style={{ backgroundColor: BRAND_GREEN }}
                >
                  {project.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900">
                  {project.title}
                </h3>
                <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {project.desc}
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-800 transition group-hover:gap-2.5"
                  style={{ color: BRAND_DARK }}
                >
                  Кейс судалгаа
                  <ArrowRightOutlined className="text-[10px]" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeAwardsSection({ content }: { content: HomepageContent }) {
  return (
    <section id="awards" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {content.awards_label}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            {content.awards_title}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {content.awards.map((award) => (
            <div
              key={`${award.title}-${award.year}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-300 hover:border-slate-300 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)]"
            >
              {award.image ? (
                <div className="relative aspect-[5/4] bg-slate-50">
                  <PublicBgImage
                    src={resolveImageUrl(award.image)}
                    alt={award.title}
                    className="object-contain p-4 transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="flex items-center px-5 pt-5">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-base"
                    style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}
                  >
                    <TrophyOutlined />
                  </div>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-sm font-bold leading-snug text-slate-900">{award.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{award.issuer}</p>
                <p
                  className="mt-4 text-[11px] font-bold tracking-wider"
                  style={{ color: BRAND_GREEN }}
                >
                  {award.year} он
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePartnersSection({ content }: { content: HomepageContent }) {
  return (
    <section id="partners" className="border-t border-slate-200/80 bg-[#f6f7f9] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {content.partners_label}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            {content.partners_title}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
          {content.partners.map((partner) => (
            <div
              key={partner.name}
              className="flex min-h-[108px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-5 transition duration-300 hover:border-slate-300 hover:shadow-sm"
            >
              {partner.logo ? (
                <div className="relative h-10 w-24 sm:h-12 sm:w-28">
                  <PublicBgImage
                    src={resolveImageUrl(partner.logo)}
                    alt={partner.name}
                    className="object-contain"
                  />
                </div>
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ backgroundColor: BRAND_DARK }}
                  aria-hidden
                >
                  {partner.name.slice(0, 1)}
                </span>
              )}
              <span className="text-center text-xs font-semibold leading-snug text-slate-600 sm:text-sm">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
