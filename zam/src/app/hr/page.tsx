'use client';

import { useEffect, useState } from 'react';
import {
  BookOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  MailOutlined,
  PhoneOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@/components/admin/icons';
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
const BRAND_DARK = '#121a26';

const TYPE_COLORS: Record<string, string> = {
  Байнгын: BRAND_GREEN,
  Гэрээт: '#2563eb',
  'Түр ажлын байр': '#64748b',
};

const HR_ICONS: Record<string, React.ReactNode> = {
  rise: <RiseOutlined />,
  team: <TeamOutlined />,
  heart: <HeartOutlined />,
  check: <CheckCircleOutlined />,
  safety: <SafetyCertificateOutlined />,
};

export default function HrPage() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    document.title = 'Ажлын байр';
    fetchPublicHomepage().then(setContent);
  }, []);

  const company = content.company_name || 'Үлэмжийн зам';

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <PublicSiteHeader companyName={company} logo={content.logo} activeHref="/hr" navItems={content.nav_menu} />

      {/* Hero */}
      <section className="relative min-h-[220px] overflow-hidden border-b border-slate-200 md:min-h-[280px]">
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <PublicBgImage src={resolveImageUrl(content.hero_bg_image || '/bg.png')} alt="Ажлын байр" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1219]/90 via-[#0a1219]/75 to-[#0a1219]/50" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-emerald-300">{content.hr_hero.badge}</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">{content.hr_hero.title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">{content.hr_hero.subtitle}</p>
        </div>
      </section>

      {/* Why join us */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ДАВУУ ТАЛ</p>
          <h2 className="mb-5 text-2xl font-extrabold text-slate-900 md:text-3xl">
            {company}-д ажилласнаар
          </h2>
          <p className="mb-10 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
            Авто зам барилгын чиглэлээр мэргэшсэн инженер, техникийн ажилчдын мэдлэг ур чадвар,
            туршлага болон дэвшилтэт техник, технологийг ашиглан Монгол Улсын хууль, дүрэм,
            олон улсын стандартад нийцсэн, чанарыг эрхэмлэсэн авто зам, гүүрийн төслүүдийг
            амжилттай гүйцэтгэн, эх орныхоо их бүтээн байгуулалтад гар бие оролцоно.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.hr_benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-lg text-white"
                  style={{ backgroundColor: BRAND_GREEN }}
                >
                  {HR_ICONS[b.icon] ?? <CheckCircleOutlined />}
                </div>
                <h3 className="mb-2 font-extrabold text-slate-900">{b.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <PublicBgImage src={resolveImageUrl('/p2.png')} alt="Сургалт хөгжил" />
          </div>
          <div>
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
              style={{ backgroundColor: BRAND_DARK }}
            >
              <BookOutlined />
            </div>
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">ХӨГЖИЛ</p>
            <h2 className="mb-5 text-2xl font-extrabold text-slate-900 md:text-3xl">{content.hr_training_title}</h2>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">{content.hr_training_text}</p>
          </div>
        </div>
      </section>

      {/* Recruitment process */}
      <section className="bg-white py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-center text-xs font-bold tracking-[0.18em] text-slate-500">
            ШАЛГАРУУЛАЛТ
          </p>
          <h2 className="mb-4 text-center text-2xl font-extrabold text-slate-900 md:text-3xl">
            Сонгон шалгаруулах үе шат
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-sm text-slate-600 md:text-base">
            Бид ажилд орох хүсэлт гаргасан иргэн бүрт адил, тэгш боломж олгож, шударга,
            шинийг эрэлхийлэгч, байгууллагын соёлд дасан зохицох чадвартай хэн бүхэнд ажил
            олгохдоо үргэлж таатай байдаг.
          </p>

          <div className="grid gap-4 md:grid-cols-5">
            {content.hr_steps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              >
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ backgroundColor: BRAND_GREEN }}
                >
                  {item.step}
                </div>
                <h3 className="mb-2 text-sm font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="bg-slate-50 py-16 px-4 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-slate-500">НЭЭЛТТЭЙ</p>
          <h2 className="mb-3 text-2xl font-extrabold text-slate-900 md:text-3xl">Нээлттэй ажлын байр</h2>
          <p className="mb-10 text-sm text-slate-600 md:text-base">
            Таныг доорх нээлттэй ажлын байранд урьж байна.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {content.hr_positions.map((job) => (
              <div
                key={job.title}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-slate-900 md:text-base">{job.title}</h3>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold text-white"
                  style={{ backgroundColor: TYPE_COLORS[job.type] ?? BRAND_GREEN }}
                >
                  {job.type}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-10 rounded-2xl border border-slate-200 p-8 md:p-10"
            style={{ borderTopWidth: 4, borderTopColor: BRAND_GREEN }}
          >
            <h3 className="mb-4 text-lg font-extrabold text-slate-900">Анкет илгээх</h3>
            <p className="mb-6 text-sm text-slate-600">
              Сонирсон ажлын байрны нэр, CV болон холбоо барих мэдээллээ и-мэйлээр илгээнэ үү.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-slate-700">
              <a
                href={`mailto:${content.email}?subject=Ажлын%20байр%20-%20Анкет`}
                className="inline-flex items-center gap-2 font-semibold hover:text-emerald-700"
              >
                <MailOutlined />
                {content.email}
              </a>
              <a
                href={`tel:${content.phone?.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 font-semibold hover:text-emerald-700"
              >
                <PhoneOutlined />
                {content.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicSiteFooter content={content} />
    </main>
  );
}
