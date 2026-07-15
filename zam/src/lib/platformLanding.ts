const API = process.env.NEXT_PUBLIC_API_URL || '';

export type PlatformLandingItem = {
  id: string;
  label: string;
  blurb: string;
  enabled: boolean;
};

export type PlatformLandingStat = {
  value: string;
  label: string;
};

export type PlatformLandingStep = {
  title: string;
  text: string;
};

export type PlatformLandingContent = {
  brand_name: string;
  tagline: string;
  meta_title: string;
  meta_description: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
  stats: PlatformLandingStat[];
  modules_title: string;
  modules_subtitle: string;
  modules: PlatformLandingItem[];
  data_title: string;
  data_subtitle: string;
  data_items: PlatformLandingItem[];
  steps_title: string;
  steps: PlatformLandingStep[];
  footer_text: string;
  contact_email: string;
  admin_url: string;
};

export const FALLBACK_PLATFORM_LANDING: PlatformLandingContent = {
  brand_name: 'RCOS',
  tagline: 'Замын салбарын SaaS платформ',
  meta_title: 'RCOS — Замын салбарын SaaS платформ',
  meta_description:
    'Замын барилга, ашиглалт, ХАБЭА, санхүү, хүний нөөцийг нэг SaaS тавцан дээр.',
  hero_eyebrow: 'rcos.mn',
  hero_title: 'Нэг платформ. Олон компани.',
  hero_subtitle:
    'Замын компани бүрт өөрийн ERP — {slug}.rcos.mn эсвэл захиалгат домэйн.',
  hero_image: '',
  cta_primary_label: 'Платформ нэвтрэх',
  cta_primary_url: 'https://admin.rcos.mn',
  cta_secondary_label: 'Модуль үзэх',
  cta_secondary_url: '#modules',
  stats: [
    { value: '20+', label: 'ERP модуль' },
    { value: '7', label: 'Өгөгдлийн сан' },
    { value: '1', label: 'Платформ админ' },
    { value: '∞', label: 'Tenant' },
  ],
  modules_title: 'ERP модулиуд',
  modules_subtitle: 'Платформ админ компани бүрт модулийг асааж/унтраана.',
  modules: [],
  data_title: 'Өгөгдлийн сангууд',
  data_subtitle: 'Салбарын нийтлэг өгөгдөл.',
  data_items: [],
  steps_title: 'Хэрхэн ажилладаг вэ',
  steps: [
    { title: 'Бүртгэл', text: 'admin.rcos.mn дээр компани үүсгэнэ.' },
    { title: 'Домэйн', text: 'company.rcos.mn эсвэл өөрийн домэйн.' },
    { title: 'Модуль + эрх', text: 'Модуль асааж, эрх тохируулна.' },
  ],
  footer_text: 'RCOS Platform',
  contact_email: 'admin@rcos.mn',
  admin_url: 'https://admin.rcos.mn',
};

export async function fetchPlatformLanding(): Promise<PlatformLandingContent> {
  try {
    const res = await fetch(`${API}/api/platform/landing`, {
      cache: 'no-store',
    });
    if (!res.ok) return FALLBACK_PLATFORM_LANDING;
    const data = await res.json();
    if (!data.success || !data.data) return FALLBACK_PLATFORM_LANDING;
    return { ...FALLBACK_PLATFORM_LANDING, ...data.data } as PlatformLandingContent;
  } catch {
    return FALLBACK_PLATFORM_LANDING;
  }
}

export function enabledItems(items: PlatformLandingItem[] | undefined) {
  return (items || []).filter((i) => i && i.enabled !== false && (i.label || i.blurb));
}
