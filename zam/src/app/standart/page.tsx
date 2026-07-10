'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
} from '@/components/admin/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicBgImage from '@/components/public/PublicBgImage';
import RichContent from '@/components/RichContent';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';
import { isEmptyRichText } from '@/lib/richText';

const BRAND_GREEN = '#3daf72';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  quality: <SafetyCertificateOutlined />,
  laboratory: <ExperimentOutlined />,
  'lab-policy': <ExperimentOutlined />,
  monitoring: <GlobalOutlined />,
  hse: <SafetyCertificateOutlined />,
  environment: <GlobalOutlined />,
};

export default function StandartPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    document.title = 'Стандарт & ХЭМАБ';
    fetchPublicHomepage().then(setContent);
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        activeHref="/standart"
        navItems={content.nav_menu}
      />

      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Стандарт" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.standart_hero.badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.standart_hero.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{content.standart_hero.subtitle}</p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-10 px-4 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.standart_certificates.map((cert) => (
            <div
              key={cert.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-full text-lg"
                style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}
              >
                <SafetyCertificateOutlined />
              </div>
              <p className="text-sm font-extrabold text-slate-900">{cert.name}</p>
              <p className="mt-1 text-xs text-slate-500">{cert.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-16 md:space-y-20">
          {content.standart_sections.map((section, index) => (
            <article
              key={section.id}
              id={section.id}
              className={`grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-14 ${
                index > 0 ? 'border-t border-slate-200 pt-16 md:pt-20' : ''
              }`}
            >
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">{section.label}</p>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}
                  >
                    {SECTION_ICONS[section.id]}
                  </div>
                  <h2 className="text-xl font-extrabold leading-snug text-slate-900 md:text-2xl">
                    {section.title}
                  </h2>
                </div>
              </div>

              <div className="standart-section-body text-sm leading-relaxed text-slate-600 md:text-base">
                {!isEmptyRichText(section.body) ? (
                  <RichContent
                    content={section.body!}
                    className="prose-p:mb-4 prose-ul:mt-6 prose-ul:space-y-3 prose-li:marker:text-[#3daf72]"
                  />
                ) : (
                  <>
                    <div className="space-y-4">
                      {section.paragraphs.map((paragraph) => (
                        <RichContent
                          key={paragraph.slice(0, 40)}
                          content={paragraph}
                          as="p"
                          className="mb-0"
                        />
                      ))}
                    </div>
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="mt-6 space-y-3">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet.slice(0, 48)}
                            className="flex gap-3 text-sm leading-relaxed text-slate-600"
                          >
                            <CheckCircleOutlined
                              className="mt-0.5 shrink-0 text-base"
                              style={{ color: BRAND_GREEN }}
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <PublicSiteFooter content={content} />
    </main>
  );
}
