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
import {
  getDefaultNavMenu,
  type SiteCustomPage,
  type SiteNavItem,
} from './siteMenu';
import { tenantHeaders } from '@/lib/tenant';

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
  director_image: string;
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
  /** Editable header menu */
  nav_menu: SiteNavItem[];
  /** Custom pages built from fixed widgets */
  custom_pages: SiteCustomPage[];
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
  'nav_menu',
  'custom_pages',
];

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  company_name: 'Company title',
  company_tagline: 'Your company tagline',
  logo: '',
  hero_badge: 'Your badge',
  hero_title: 'Your headline goes here',
  hero_title_highlight: 'headline',
  hero_subtitle:
    'Add your company story, services, and strengths from the homepage editor.',
  hero_bg_image: '',
  about_label: 'About',
  about_title: 'Company title',
  about_text1:
    'Introduce your company here. Edit this text from Admin → Homepage.',
  about_text2:
    'Add a second paragraph about projects, people, and quality.',
  about_image: '',
  features_label: 'Platform',
  features_title: 'One platform — every workflow',
  features_subtitle: 'Projects, attendance, HSE, HR, and more — enable modules for your company.',
  projects_label: 'Projects',
  projects_title: 'Featured projects',
  app_download_title: 'Worker app',
  app_download_text: 'Project news, attendance, and safety alerts on mobile.',
  login_title: 'Sign in',
  login_subtitle: 'Sign in to your company workspace',
  login_bg_image: '',
  phone: '',
  email: '',
  address: '',
  footer_copyright: 'All rights reserved.',
  stats: [
    { value: '—', label: 'Experience' },
    { value: '—', label: 'Projects' },
    { value: '—', label: 'People' },
    { value: '—', label: 'Support' },
  ],
  features: [
    { title: 'Project management', desc: 'Projects, tasks, and progress in one place.', icon: 'project' },
    { title: 'Safety', desc: 'Incidents, briefings, and live registers.', icon: 'safety' },
    { title: 'Attendance', desc: 'Daily check-in and check-out for crews.', icon: 'clock' },
    { title: 'Human resources', desc: 'Roles, users, and org structure.', icon: 'team' },
  ],
  projects: [],
  ...DEFAULT_LANDING_PAGE_FIELDS,
  nav_menu: getDefaultNavMenu(),
  custom_pages: [],
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

  // Allow empty arrays when explicitly saved
  if (Array.isArray(stored.nav_menu)) merged.nav_menu = stored.nav_menu;
  if (Array.isArray(stored.custom_pages)) merged.custom_pages = stored.custom_pages;

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

  const logo = String(stored.logo || '').trim();
  if (!logo || logo === '/logo.jpeg' || logo === 'logo.jpeg') {
    merged.logo = '';
  }

  return merged;
}

export function resolveImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/assets/')) return `${API}${path}`;
  if (path.startsWith('/')) return path;
  return path;
}

export async function fetchPublicHomepage(): Promise<HomepageContent> {
  try {
    const res = await fetch(`${API}/api/homepage/public`, {
      cache: 'no-store',
      headers: tenantHeaders(),
    });
    if (res.status === 404) {
      throw new Error('TENANT_NOT_FOUND');
    }
    const json = await res.json();
    return json.success ? mergeHomepageContent(json.data) : getDefaultHomepageContent();
  } catch (err) {
    if (err instanceof Error && err.message === 'TENANT_NOT_FOUND') throw err;
    return getDefaultHomepageContent();
  }
}

export async function fetchAdminHomepage(): Promise<HomepageContent | null> {
  try {
    const res = await fetch(`${API}/api/homepage`, {
      headers: tenantHeaders(),
    });
    const json = await res.json();
    return json.success ? mergeHomepageContent(json.data) : null;
  } catch {
    return null;
  }
}

export async function saveHomepage(content: HomepageContent): Promise<HomepageContent | null> {
  try {
    const res = await fetch(`${API}/api/homepage`, {
      method: 'PUT',
      headers: tenantHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(content),
    });
    const json = await res.json();
    if (!json.success) return null;
    return mergeHomepageContent(json.data ?? content);
  } catch {
    return null;
  }
}

export async function uploadHomepageImage(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API}/api/homepage/upload`, {
      method: 'POST',
      body: form,
      headers: tenantHeaders(),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Зураг байршуулахад алдаа гарлаа');
    }
    return json.data?.url || json.data?.path || null;
  } catch (err) {
    if (err instanceof Error) throw err;
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
