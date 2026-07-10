'use client';

import { useEffect, useMemo, useState } from 'react';
import { EnvironmentOutlined, ProjectOutlined } from '@/components/admin/icons';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import PublicBgImage from '@/components/public/PublicBgImage';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  resolveImageUrl,
  type HomepageContent,
  type HomepageProject,
} from '@/lib/homepage';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

const FILTERS = ['Бүгд', 'Дууссан', 'Явагдаж буй', 'Төлөвлөгдсөн'] as const;

const TAG_COLORS: Record<string, string> = {
  Дууссан: BRAND_GREEN,
  'Явагдаж буй': '#2563eb',
  Төлөвлөгдсөн: '#64748b',
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? BRAND_GREEN;
}

export default function ProjectsPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Бүгд');

  useEffect(() => {
    document.title = 'Төслүүд';
    fetchPublicHomepage().then(setContent);
  }, []);

  const projects = content.projects?.length ? content.projects : getDefaultHomepageContent().projects;

  const filtered = useMemo(() => {
    if (filter === 'Бүгд') return projects;
    return projects.filter((p) => p.tag === filter);
  }, [projects, filter]);

  const counts = useMemo(() => {
    const tally: Record<string, number> = { Бүгд: projects.length };
    for (const p of projects) {
      tally[p.tag] = (tally[p.tag] ?? 0) + 1;
    }
    return tally;
  }, [projects]);

  const featured = projects.find((p) => p.tag === 'Дууссан') ?? projects[0];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        activeHref="/projects"
        navItems={content.nav_menu}
      />

      {/* Hero */}
      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Төслүүд" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.projects_hero.badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.projects_hero.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{content.projects_hero.subtitle}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-8">
          {(content.stats.length ? content.stats : getDefaultHomepageContent().stats).map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center">
              <p className="text-xl font-extrabold text-slate-900 md:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ОНЦЛОХ ТӨСӨЛ</p>
            <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg lg:grid-cols-2">
              <div className="relative min-h-[260px] lg:min-h-[360px]">
                <PublicBgImage src={resolveImageUrl(featured.image)} alt={featured.title} />
                <span
                  className="absolute left-4 top-4 rounded px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: tagColor(featured.tag) }}
                >
                  {featured.tag}
                </span>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{featured.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{featured.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                  <EnvironmentOutlined />
                  <span>Монгол Улс</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Project grid */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">
                {content.projects_label || 'ПОРТФОЛИО'}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 md:text-3xl">Бүх төслүүд</h2>
            </div>
            <p className="text-sm text-slate-500">
              Нийт <span className="font-bold text-slate-800">{projects.length}</span> төсөл
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === item
                    ? 'text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                style={filter === item ? { backgroundColor: BRAND_DARK } : undefined}
              >
                {item}
                {counts[item] != null && (
                  <span className="ml-1.5 opacity-70">({counts[item]})</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <ProjectOutlined className="mb-3 text-3xl text-slate-300" />
              <p className="text-slate-500">Энэ ангилалд төсөл байхгүй байна.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, idx) => (
                <ProjectCard key={`${project.title}-${idx}`} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicSiteFooter content={content} />
    </main>
  );
}

function ProjectCard({ project }: { project: HomepageProject }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <PublicBgImage src={resolveImageUrl(project.image)} alt={project.title} />
        <span
          className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-bold tracking-wide text-white"
          style={{ backgroundColor: tagColor(project.tag) }}
        >
          {project.tag}
        </span>
      </div>
      <div className="p-5">
        <h3 className="mb-2 text-lg font-bold text-slate-900">{project.title}</h3>
        <p className="text-sm leading-relaxed text-slate-600">{project.desc}</p>
      </div>
    </article>
  );
}
