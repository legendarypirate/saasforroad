import {
  DEFAULT_LANDING_PAGE_FIELDS,
  type HomepageAward,
  type HomepageHeroSlide,
  type HomepageHrBenefit,
  type HomepageHrPosition,
  type HomepageHrStep,
  type HomepageMachinery,
  type HomepageNewsArticle,
  type HomepagePageHero,
  type HomepagePartner,
  type HomepagePlant,
  type HomepageStandartCertificate,
  type HomepageStandartSection,
  type HomepageTechItem,
  type HomepageValue,
} from './landingContent';

export interface HomepageStat {
  value: string;
  label: string;
}

export interface HomepageFeature {
  title: string;
  desc: string;
  icon: string;
}

export interface HomepageProject {
  image: string;
  title: string;
  desc: string;
  tag: string;
}

export interface HomepageContent {
  company_name: string;
  company_tagline: string;
  logo: string;
  hero_badge: string;
  hero_title: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_bg_image: string;
  hero_slides: HomepageHeroSlide[];
  about_label: string;
  about_title: string;
  about_text1: string;
  about_text2: string;
  about_image: string;
  about_hero_badge: string;
  about_hero_title: string;
  director_role: string;
  director_paragraphs: string[];
  mission_text: string;
  vision_text: string;
  values: HomepageValue[];
  awards_label: string;
  awards_title: string;
  awards: HomepageAward[];
  partners_label: string;
  partners_title: string;
  partners: HomepagePartner[];
  features_label: string;
  features_title: string;
  features_subtitle: string;
  projects_label: string;
  projects_title: string;
  projects_hero: HomepagePageHero;
  technology_hero: HomepagePageHero;
  hr_hero: HomepagePageHero;
  news_hero: HomepagePageHero;
  standart_hero: HomepagePageHero;
  technology_machinery_text1: string;
  technology_machinery_text2: string;
  machinery: HomepageMachinery[];
  plants: HomepagePlant[];
  tech_stack: HomepageTechItem[];
  hr_benefits: HomepageHrBenefit[];
  hr_steps: HomepageHrStep[];
  hr_positions: HomepageHrPosition[];
  hr_training_title: string;
  hr_training_text: string;
  news_articles: HomepageNewsArticle[];
  standart_certificates: HomepageStandartCertificate[];
  standart_sections: HomepageStandartSection[];
  footer_services: string[];
  app_download_title: string;
  app_download_text: string;
  login_title: string;
  login_subtitle: string;
  login_bg_image: string;
  phone: string;
  email: string;
  address: string;
  footer_copyright: string;
  stats: HomepageStat[];
  features: HomepageFeature[];
  projects: HomepageProject[];
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

const ARRAY_FIELDS: (keyof HomepageContent)[] = [
  'stats',
  'features',
  'projects',
  'hero_slides',
  'awards',
  'partners',
  'values',
  'director_paragraphs',
  'machinery',
  'plants',
  'tech_stack',
  'hr_benefits',
  'hr_steps',
  'hr_positions',
  'news_articles',
  'standart_certificates',
  'standart_sections',
  'footer_services',
];

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  company_name: 'Үлэмжийн зам LLC',
  company_tagline: 'Замын удирдлагын систем',
  logo: '/logo.jpeg',
  hero_badge: 'Зам бүтээдэг хүч — Ирээдүйг бүтээгч бид',
  hero_title: 'Авто зам, гүүр, дэд бүтцийн төслүүд',
  hero_title_highlight: 'дэд бүтцийн',
  hero_subtitle:
    'Бид чанар, аюулгүй байдал, хугацааны стандартыг баримталж үндэсний хэмжээний замын төслүүдийг гүйцэтгэдэг.',
  hero_bg_image: '/bg.png',
  about_label: 'Бидний тухай',
  about_title: 'Үлэмжийн зам LLC',
  about_text1:
    '2008 оноос хойш авто зам, гүүрийн барилга угсралт, засвар арчлалтаар мэргэшсэн үндэсний хэмжээний компани.',
  about_text2:
    'Манай системээр төсөл, ажилтан, материал, ирц, аюулгүй байдлыг нэг дороос хянах боломжтой.',
  about_image: '/back.png',
  features_label: 'Удирдлагын систем',
  features_title: 'Нэг платформ — бүх үйл явдал',
  features_subtitle: 'Замын компанид зориулсан админ болон ажилчны апп.',
  projects_label: 'Төслүүд',
  projects_title: 'Гүйцэтгэсэн & явагдаж буй ажлууд',
  app_download_title: 'Ажилчны апп татах',
  app_download_text: 'Төслийн мэдээ, ирц бүртгэл — гар утаснаасаа.',
  login_title: 'Админ нэвтрэх',
  login_subtitle: 'Замын удирдлагын системд нэвтэрнэ үү',
  login_bg_image: '/zs.png',
  phone: '7000-0000',
  email: 'info@ulemjin-zam.mn',
  address: 'Улаанбаатар, Сүхбаатар дүүрэг',
  footer_copyright: 'Бүх эрх хуулиар хамгаалагдсан.',
  stats: [
    { value: '15+', label: 'Жилийн туршлага' },
    { value: '120+', label: 'Гүйцэтгэсэн төсөл' },
    { value: '500+', label: 'Мэргэшсэн ажилтан' },
    { value: '24/7', label: 'Төслийн хяналт' },
  ],
  features: [
    { title: 'Төслийн удирдлага', desc: 'Төсөл, даалгавар, явцын нэгдсэн хяналт.', icon: 'project' },
    { title: 'Аюулгүй байдал', desc: 'Ослын мэдээлэл, заавар, бодит цагийн бүртгэл.', icon: 'safety' },
    { title: 'Ирцийн систем', desc: 'Ажилчин өдөр бүр ирсэн, явсан цагаа бүртгэнэ.', icon: 'clock' },
    { title: 'Хүний нөөц', desc: 'Эрх, хэрэглэгч, багийн бүтцийг уян хатан удирдах.', icon: 'team' },
  ],
  projects: [
    {
      image: '/p1.png',
      title: 'Улаанбаатар — Дархан чиглэлийн зам',
      desc: '30 км авто замын шинэчлэлт, хатуу хучилттай замын ажил. 2024 онд ашиглалтад орсон.',
      tag: 'Дууссан',
    },
    {
      image: '/p2.png',
      title: 'Орон нутгийн холболтын зам',
      desc: 'Дэд бүтэц, гүүрийн барилга угсралтын төсөл. Одоогоор үндсэн ажил явагдаж байна.',
      tag: 'Явагдаж буй',
    },
    {
      image: '/p3.png',
      title: 'Хотын дотоод замын сүлжээ',
      desc: 'Замын засвар, арчилгаа, аюулгүй байдлын стандартын шинэчлэлт.',
      tag: 'Төлөвлөгдсөн',
    },
    {
      image: '/p1.png',
      title: 'Хөшгийн хөндий — Улаанбаатар зам',
      desc: 'Шинэ нисэх онгоцны буудал хүртэлх 3.2 км хатуу хучилттай авто замын төсөл.',
      tag: 'Дууссан',
    },
    {
      image: '/p2.png',
      title: 'Баянхонгор — Алтай чиглэлийн зам',
      desc: '126.7 км хатуу хучилттай авто замын барилгын ажил.',
      tag: 'Явагдаж буй',
    },
    {
      image: '/p3.png',
      title: 'Өндөрхаан — Чойбалсан чиглэл',
      desc: '25 км хатуу хучилттай авто замын IIIA, IVA хэсгийн барилга.',
      tag: 'Явагдаж буй',
    },
    {
      image: '/p1.png',
      title: 'Чойр — Сайншанд чиглэлийн зам',
      desc: '50 км хатуу хучилттай авто замын төсөл.',
      tag: 'Төлөвлөгдсөн',
    },
    {
      image: '/p2.png',
      title: 'Чингисийн өргөн чөлөө — Нарны зам',
      desc: '1.6 км хатуу хучилттай авто замын холболтын төсөл.',
      tag: 'Дууссан',
    },
    {
      image: '/p3.png',
      title: 'Баруун-Урт хотын замын сүлжээ',
      desc: 'Хотын төвийн зам, уулзварын өргөтгөл шинэчлэлтийн ажил.',
      tag: 'Төлөвлөгдсөн',
    },
  ],
  ...DEFAULT_LANDING_PAGE_FIELDS,
};

export function getDefaultHomepageContent(): HomepageContent {
  return DEFAULT_HOMEPAGE_CONTENT;
}

export function mergeHomepageContent(stored?: Partial<HomepageContent> | null): HomepageContent {
  const base = getDefaultHomepageContent();
  if (!stored || typeof stored !== 'object') return base;

  const merged: HomepageContent = { ...base, ...stored };

  for (const key of ARRAY_FIELDS) {
    const value = stored[key as keyof HomepageContent];
    if (Array.isArray(value) && value.length > 0) {
      Object.assign(merged, { [key]: value });
    }
  }

  if (stored.technology_hero) merged.technology_hero = { ...base.technology_hero, ...stored.technology_hero };
  if (stored.projects_hero) merged.projects_hero = { ...base.projects_hero, ...stored.projects_hero };
  if (stored.hr_hero) merged.hr_hero = { ...base.hr_hero, ...stored.hr_hero };
  if (stored.news_hero) merged.news_hero = { ...base.news_hero, ...stored.news_hero };
  if (stored.standart_hero) merged.standart_hero = { ...base.standart_hero, ...stored.standart_hero };

  if (!merged.hero_slides?.length) {
    merged.hero_slides = [
      {
        badge: merged.hero_badge,
        title: merged.hero_title,
        subtitle: merged.hero_subtitle,
      },
      ...base.hero_slides.slice(1),
    ];
  }

  return merged;
}

export function resolveImageUrl(path: string): string {
  if (!path) return '/logo.jpeg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/assets/')) return `${API}${path}`;
  return path;
}

export async function fetchPublicHomepage(): Promise<HomepageContent> {
  try {
    const res = await fetch(`${API}/api/homepage/public`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? mergeHomepageContent(json.data) : getDefaultHomepageContent();
  } catch {
    return getDefaultHomepageContent();
  }
}

export async function fetchAdminHomepage(): Promise<HomepageContent | null> {
  try {
    const res = await fetch(`${API}/api/homepage`);
    const json = await res.json();
    return json.success ? mergeHomepageContent(json.data) : null;
  } catch {
    return null;
  }
}

export async function saveHomepage(content: HomepageContent): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function uploadHomepageImage(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API}/api/homepage/upload`, { method: 'POST', body: form });
    const json = await res.json();
    return json.success ? json.data.path : null;
  } catch {
    return null;
  }
}

export type {
  HomepageAward,
  HomepageHeroSlide,
  HomepageHrBenefit,
  HomepageHrPosition,
  HomepageHrStep,
  HomepageMachinery,
  HomepageNewsArticle,
  HomepagePageHero,
  HomepagePartner,
  HomepagePlant,
  HomepageStandartCertificate,
  HomepageStandartSection,
  HomepageTechItem,
  HomepageValue,
};
