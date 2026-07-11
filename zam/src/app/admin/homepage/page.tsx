'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Save } from 'lucide-react';

import HomeSectionEditor, {
  type HomeEditSection,
} from '@/app/admin/homepage/HomeSectionEditor';
import MenuWidgetsPanel from '@/app/admin/homepage/MenuWidgetsPanel';
import {
  AimOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
} from '@/components/admin/icons';
import EditableSection from '@/components/public/EditableSection';
import {
  HomeAboutSection,
  HomeAwardsSection,
  HomeHeroSection,
  HomePartnersSection,
  HomeProjectsSection,
} from '@/components/public/homeSections';
import PublicBgImage from '@/components/public/PublicBgImage';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import RichContent from '@/components/RichContent';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  fetchAdminHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  saveHomepage,
  type HomepageContent,
} from '@/lib/homepage';
import { isEmptyRichText } from '@/lib/richText';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

type LandingPageKey =
  | 'menu'
  | 'home'
  | 'about'
  | 'technology'
  | 'projects'
  | 'hr'
  | 'news'
  | 'standart';

const PAGES: Array<{ key: LandingPageKey; label: string; href: string }> = [
  { key: 'menu', label: 'Цэс & Виджет', href: '/' },
  { key: 'home', label: 'Үлэмжийн зам LLC', href: '/' },
  { key: 'about', label: 'Бидний тухай', href: '/about' },
  { key: 'technology', label: 'Технологи', href: '/technology' },
  { key: 'projects', label: 'Төслүүд', href: '/projects' },
  { key: 'hr', label: 'Ажлын байр', href: '/hr' },
  { key: 'news', label: 'Мэдээлэл', href: '/news' },
  { key: 'standart', label: 'Стандарт', href: '/standart' },
];

function PageHeroPreview({
  badge,
  title,
  subtitle,
  bg,
}: {
  badge?: string;
  title?: string;
  subtitle?: string;
  bg?: string;
}) {
  return (
    <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
      <div className="absolute inset-0">
        <PublicBgImage src={resolveImageUrl(bg || '/bg.png')} alt="" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{badge}</p>
        <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}

export default function HomepageAdminPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [page, setPage] = useState<LandingPageKey>('menu');
  const [editSection, setEditSection] = useState<HomeEditSection>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchAdminHomepage();
      setContent(data ?? getDefaultHomepageContent());
      setLoading(false);
    })();
  }, []);

  const openEdit = (section: Exclude<HomeEditSection, null>) => setEditSection(section);

  const applyPatch = (patch: Partial<HomepageContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveHomepage(content);
      if (saved) {
        setContent(saved);
        uiToast.success('Контент хадгалагдлаа');
        setDirty(false);
      } else {
        uiToast.error('Хадгалахад алдаа гарлаа');
      }
    } catch {
      uiToast.error('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const current = PAGES.find((p) => p.key === page)!;

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="-m-4 space-y-0">
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Landing — визуал засвар</h2>
            <p className="text-sm text-muted-foreground">
              Хуудас сонгоод хэсэг дээрх «Засах» товчийг дарна уу.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Хадгалаагүй өөрчлөлт
              </span>
            )}
            <Link
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
            >
              <ExternalLink className="size-3.5" />
              Нээлттэй үзэх
            </Link>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving || !dirty}>
              <Save className="size-3.5" />
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-4 pb-3">
          {PAGES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPage(item.key)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                page === item.key
                  ? 'bg-primary text-primary-foreground dark:bg-[var(--neon-green)] dark:text-[#1c1c1e]'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(
        'overflow-x-hidden border-b border-border shadow-sm',
        page === 'menu' ? 'bg-background p-4 text-foreground' : 'keep-light-surface bg-white text-slate-900',
      )}>
        {page === 'menu' && (
          <MenuWidgetsPanel
            content={content}
            onChange={(patch) => {
              setContent((prev) => ({ ...prev, ...patch }));
              setDirty(true);
            }}
          />
        )}

        {page === 'home' && (
          <>
            <EditableSection title="Брэнд / Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('hero')}>
              <HomeHeroSection content={content} />
            </EditableSection>
            <EditableSection title="Бидний тухай" onEdit={() => openEdit('about')}>
              <HomeAboutSection content={content} />
            </EditableSection>
            <EditableSection title="Төслүүд" onEdit={() => openEdit('projects')}>
              <HomeProjectsSection content={content} />
            </EditableSection>
            <EditableSection title="Шагнал" onEdit={() => openEdit('awards')}>
              <HomeAwardsSection content={content} />
            </EditableSection>
            <EditableSection title="Хамтрагч" onEdit={() => openEdit('partners')}>
              <HomePartnersSection content={content} />
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'about' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/about"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('about-hero')}>
              <PageHeroPreview
                badge={content.about_hero_badge}
                title={content.about_hero_title}
                subtitle={content.company_tagline}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Захирал" onEdit={() => openEdit('about-director')}>
              <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">УДИРДЛАГА</p>
                  <h2 className="mb-10 text-2xl font-extrabold text-slate-900 md:text-3xl">
                    Захирлын мэндчилгээ
                  </h2>
                  <div className="grid items-start gap-10 lg:grid-cols-[320px_1fr]">
                    <div>
                      <div className="relative aspect-[3/4] max-w-xs overflow-hidden rounded-2xl shadow-xl">
                        <PublicBgImage
                          src={resolveImageUrl(content.director_image || '/p1.png')}
                          alt="Захирал"
                        />
                      </div>
                      <p className="mt-5 text-lg font-extrabold text-slate-900">{content.director_role}</p>
                    </div>
                    <div className="space-y-5 text-sm leading-relaxed text-slate-600 md:text-base">
                      {content.director_paragraphs.map((p) => (
                        <RichContent key={p.slice(0, 40)} content={p} as="p" className="mb-0" />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Эрхэм зорилго" onEdit={() => openEdit('about-mission')}>
              <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-8" style={{ borderTopWidth: 4, borderTopColor: BRAND_GREEN }}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND_GREEN }}>
                      <AimOutlined />
                    </div>
                    <h3 className="mb-3 text-lg font-extrabold">Эрхэм зорилго</h3>
                    <p className="text-sm text-slate-600">{content.mission_text}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-8" style={{ borderTopWidth: 4, borderTopColor: BRAND_DARK }}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND_DARK }}>
                      <EyeOutlined />
                    </div>
                    <h3 className="mb-3 text-lg font-extrabold">Алсын хараа</h3>
                    <p className="text-sm text-slate-600">{content.vision_text}</p>
                  </div>
                </div>
                <div className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-200 p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND_GREEN }}>
                      <HeartOutlined />
                    </div>
                    <h3 className="text-lg font-extrabold">Үнэт зүйлс</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {content.values.map((v) => (
                      <div key={v.title} className="rounded-xl bg-slate-50 p-4">
                        <p className="mb-1 text-xs font-bold text-emerald-700">{v.title}</p>
                        <p className="text-sm text-slate-600">{v.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'technology' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/technology"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('tech-hero')}>
              <PageHeroPreview
                badge={content.technology_hero?.badge}
                title={content.technology_hero?.title}
                subtitle={content.technology_hero?.subtitle}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Машин механизм" onEdit={() => openEdit('tech-machinery')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND_GREEN }}>
                    <BuildOutlined />
                  </div>
                  <h2 className="mb-4 text-2xl font-extrabold">Машин механизм</h2>
                  <p className="mb-2 text-sm text-slate-600">{content.technology_machinery_text1}</p>
                  <p className="mb-8 text-sm text-slate-600">{content.technology_machinery_text2}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {content.machinery.map((item) => (
                      <div key={item.name} className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-semibold">{item.name}</span>
                        <span className="text-sm font-bold" style={{ color: BRAND_GREEN }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Үйлдвэр" onEdit={() => openEdit('tech-plants')}>
              <section className="bg-slate-50 py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {content.plants.map((plant) => (
                    <div key={plant.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold">{plant.title}</h3>
                      <p className="mt-2 text-sm font-semibold" style={{ color: BRAND_GREEN }}>{plant.capacity}</p>
                      <p className="mt-2 text-sm text-slate-600">{plant.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Технологи" onEdit={() => openEdit('tech-stack')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {content.tech_stack.map((tech) => (
                    <div key={tech.id || tech.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold">{tech.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{tech.summary}</p>
                      <ul className="mt-3 space-y-1 text-sm text-slate-500">
                        {tech.bullets?.map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'projects' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/projects"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('projects-hero')}>
              <PageHeroPreview
                badge={content.projects_hero?.badge}
                title={content.projects_hero?.title}
                subtitle={content.projects_hero?.subtitle}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Төслүүдийн жагсаалт" onEdit={() => openEdit('projects')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {content.projects.map((project, idx) => (
                    <article key={`${project.title}-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="relative aspect-[4/3]">
                        <PublicBgImage src={resolveImageUrl(project.image || '/p1.png')} alt={project.title} />
                        <span className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: BRAND_GREEN }}>
                          {project.tag}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="mb-2 text-lg font-bold">{project.title}</h3>
                        <p className="text-sm text-slate-600">{project.desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'hr' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/hr"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('hr-hero')}>
              <PageHeroPreview
                badge={content.hr_hero?.badge}
                title={content.hr_hero?.title}
                subtitle={content.hr_hero?.subtitle}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Давуу тал" onEdit={() => openEdit('hr-benefits')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {content.hr_benefits.map((b) => (
                    <div key={b.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}>
                        <CheckCircleOutlined />
                      </div>
                      <h3 className="font-bold">{b.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Сургалт" onEdit={() => openEdit('hr-training')}>
              <section className="bg-slate-50 py-16 px-4 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <h2 className="mb-4 text-2xl font-extrabold">{content.hr_training_title}</h2>
                  <p className="max-w-3xl text-sm text-slate-600">{content.hr_training_text}</p>
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Алхам" onEdit={() => openEdit('hr-steps')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {content.hr_steps.map((s) => (
                    <div key={`${s.step}-${s.title}`} className="rounded-2xl border border-slate-200 p-5">
                      <p className="text-xs font-bold" style={{ color: BRAND_GREEN }}>Алхам {s.step}</p>
                      <h3 className="mt-2 font-bold">{s.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Ажлын байр" onEdit={() => openEdit('hr-positions')}>
              <section className="bg-slate-50 py-16 px-4 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-3">
                  {content.hr_positions.map((p) => (
                    <div key={p.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
                      <span className="font-semibold">{p.title}</span>
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: BRAND_GREEN }}>
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'news' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/news"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('news-hero')}>
              <PageHeroPreview
                badge={content.news_hero?.badge}
                title={content.news_hero?.title}
                subtitle={content.news_hero?.subtitle}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Мэдээ" onEdit={() => openEdit('news-articles')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {content.news_articles.map((article) => (
                    <article key={article.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                      <div className="relative aspect-[16/10]">
                        <PublicBgImage src={resolveImageUrl(article.image || '/p1.png')} alt={article.title} />
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-bold text-slate-500">{article.category} · {article.date}</p>
                        <h3 className="mt-2 font-bold">{article.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{article.excerpt}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}

        {page === 'standart' && (
          <>
            <EditableSection title="Header" onEdit={() => openEdit('brand')}>
              <PublicSiteHeader
                companyName={content.company_name || 'Үлэмжийн зам'}
                logo={content.logo}
                activeHref="/standart"
                navItems={content.nav_menu}
                sticky={false}
              />
            </EditableSection>
            <EditableSection title="Hero" onEdit={() => openEdit('standart-hero')}>
              <PageHeroPreview
                badge={content.standart_hero?.badge}
                title={content.standart_hero?.title}
                subtitle={content.standart_hero?.subtitle}
                bg={content.hero_bg_image}
              />
            </EditableSection>
            <EditableSection title="Гэрчилгээ" onEdit={() => openEdit('standart-certs')}>
              <section className="bg-slate-50 py-10 px-4 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {content.standart_certificates.map((cert) => (
                    <div key={cert.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ color: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}14` }}>
                        <SafetyCertificateOutlined />
                      </div>
                      <p className="text-sm font-extrabold">{cert.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{cert.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Хэсгүүд" onEdit={() => openEdit('standart-sections')}>
              <section className="bg-white py-16 px-4 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-8">
                  {content.standart_sections.map((sec) => (
                    <div key={sec.id || sec.title} className="rounded-2xl border border-slate-200 p-6">
                      <p className="text-xs font-bold tracking-wide text-slate-500">{sec.label}</p>
                      <h3 className="mt-2 text-xl font-extrabold">{sec.title}</h3>
                      <div className="mt-4 text-sm text-slate-600">
                        {!isEmptyRichText(sec.body) ? (
                          <RichContent
                            content={sec.body!}
                            className="prose-p:mb-3 prose-ul:mt-4 prose-li:marker:text-[#3daf72]"
                          />
                        ) : (
                          <>
                            <div className="space-y-3">
                              {sec.paragraphs?.map((p) => (
                                <RichContent key={p.slice(0, 32)} content={p} as="p" className="mb-0" />
                              ))}
                            </div>
                            {(sec.bullets?.length ?? 0) > 0 && (
                              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                                {(sec.bullets ?? []).map((b) => (
                                  <li key={b} className="flex gap-2">
                                    <TrophyOutlined className="mt-0.5 shrink-0" style={{ color: BRAND_GREEN }} />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </EditableSection>
            <EditableSection title="Footer" onEdit={() => openEdit('contact')}>
              <PublicSiteFooter content={content} />
            </EditableSection>
          </>
        )}
      </div>

      <HomeSectionEditor
        section={editSection}
        content={content}
        open={editSection !== null}
        onOpenChange={(open) => {
          if (!open) setEditSection(null);
        }}
        onSave={applyPatch}
      />
    </div>
  );
}
