'use client';

import { useEffect, useState } from 'react';
import PublicBgImage from '@/components/public/PublicBgImage';
import {
  ApiOutlined,
  BuildOutlined,
  CloudOutlined,
  ExperimentOutlined,
  RadarChartOutlined,
  ToolOutlined,
} from '@ant-design/icons';
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

const TECH_ICONS: Record<string, React.ReactNode> = {
  dekispart: <ApiOutlined />,
  trimble: <RadarChartOutlined />,
  'excavator-scale': <ExperimentOutlined />,
};

export default function TechnologyPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    document.title = 'Технологи';
    fetchPublicHomepage().then(setContent);
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader companyName={content.company_name || 'Үлэмжийн зам'} activeHref="/technology" />

      {/* Hero */}
      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Технологи" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.technology_hero.badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.technology_hero.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{content.technology_hero.subtitle}</p>
        </div>
      </section>

      {/* Machinery */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <BuildOutlined />
              </div>
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ТЕХНИК</p>
              <h2 className="mb-5 text-2xl font-extrabold text-slate-900 md:text-3xl">Машин механизм</h2>
              <p className="text-sm leading-relaxed text-slate-600 md:text-base">{content.technology_machinery_text1}</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{content.technology_machinery_text2}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <PublicBgImage src={resolveImageUrl('/p2.png')} alt="Машин механизм" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {content.machinery.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5"
              >
                <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                <span className="text-sm font-bold" style={{ color: BRAND_GREEN }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plants */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white"
              style={{ backgroundColor: BRAND_DARK }}
            >
              <ToolOutlined />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ҮЙЛДВЭР</p>
              <h2 className="mb-4 text-2xl font-extrabold text-slate-900 md:text-3xl">Үйлдвэр, завод</h2>
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                Манай үйлдвэрийн хамт олон дээрх үйлдвэрүүд дээр дадлага туршлага хуримтлуулан
                тогтвортой ажиллаж байна. Төмөр бетон бүтээц бэлтгэх, эрдэс нунтаг тээрэмдэх,
                эмульс хольц бэлтгэх үйлдвэрүүд тус тус ажиллаж байна.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {content.plants.map((plant) => (
              <div
                key={plant.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <p className="text-xs font-bold tracking-wide text-emerald-700">{plant.capacity}</p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-900">{plant.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{plant.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage src={resolveImageUrl('/p1.png')} alt="Үйлдвэр" />
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-md">
              <PublicBgImage src={resolveImageUrl('/p3.png')} alt="Технологийн парк" />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced tech overview */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-center text-xs font-bold tracking-[0.18em] text-slate-500">
            ПРОГРАМ
          </p>
          <h2 className="mb-12 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
            Дэвшилтэт технологи
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.tech_stack.map((tech, idx) => (
              <a
                key={tech.id}
                href={`#${tech.id}`}
                className="group rounded-2xl border border-slate-200 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white transition group-hover:scale-105"
                  style={{ backgroundColor: idx === 1 ? BRAND_DARK : BRAND_GREEN }}
                >
                  {TECH_ICONS[tech.id] ?? <ApiOutlined />}
                </div>
                <p className="mb-1 text-xs font-bold text-slate-400">{idx + 1}.</p>
                <h3 className="text-base font-extrabold text-slate-900">{tech.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{tech.summary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tech detail sections */}
      {content.tech_stack.map((tech, idx) => (
        <section
          key={tech.id}
          id={tech.id}
          className={`py-16 px-4 md:py-20 lg:px-8 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-white"
                    style={{ backgroundColor: idx === 1 ? BRAND_DARK : BRAND_GREEN }}
                  >
                    {TECH_ICONS[tech.id] ?? <ApiOutlined />}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 md:text-2xl">{tech.title}</h3>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-slate-600 md:text-base">{tech.summary}</p>
                <ul className="space-y-3">
                  {tech.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-slate-600 md:text-base">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: BRAND_GREEN }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="rounded-2xl border border-slate-200 p-6 shadow-sm"
                style={{ borderTopWidth: 4, borderTopColor: BRAND_GREEN }}
              >
                <div className="mb-3 flex items-center gap-2 text-emerald-700">
                  <CloudOutlined />
                  <span className="text-xs font-bold tracking-wide">ДАВУУ ТАЛ</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {idx === 0 &&
                    'Ашиглахад хялбар, ойлгомжтой, эмх цэгцтэй — цаг хугацаа хэмнэж, байгальд ээлтэй цахим ажиллагаа.'}
                  {idx === 1 &&
                    'Оффис болон талбарын хооронд мэдээллийн урсгалыг хянаж, төслийн зардлыг бууруулна.'}
                  {idx === 2 &&
                    'Газар шорооны ажлын бодит хэмжээг өдөр бүр бүртгэж, төлөвлөгөөний явцыг хянах.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}

      <PublicSiteFooter content={content} />
    </main>
  );
}
