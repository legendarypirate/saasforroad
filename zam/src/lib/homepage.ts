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
  about_label: string;
  about_title: string;
  about_text1: string;
  about_text2: string;
  about_image: string;
  features_label: string;
  features_title: string;
  features_subtitle: string;
  projects_label: string;
  projects_title: string;
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

export function resolveImageUrl(path: string): string {
  if (!path) return '/logo.jpeg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/assets/')) return `${API}${path}`;
  return path;
}

export async function fetchPublicHomepage(): Promise<HomepageContent | null> {
  try {
    const res = await fetch(`${API}/api/homepage/public`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchAdminHomepage(): Promise<HomepageContent | null> {
  try {
    const res = await fetch(`${API}/api/homepage`);
    const json = await res.json();
    return json.success ? json.data : null;
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
