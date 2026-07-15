/** Neutral multi-tenant defaults — never another company's branding. */
const DEFAULT_HOMEPAGE = {
  company_name: "Company title",
  company_tagline: "Your company tagline",
  logo: "",
  hero_badge: "Your badge",
  hero_title: "Your headline goes here",
  hero_title_highlight: "headline",
  hero_subtitle:
    "Add your company story, services, and strengths from the homepage editor.",
  hero_bg_image: "",
  about_label: "About",
  about_title: "Company title",
  about_text1:
    "Introduce your company here. Edit this text from Admin → Homepage.",
  about_text2:
    "Add a second paragraph about projects, people, and quality.",
  about_image: "",
  director_image: "",
  features_label: "Platform",
  features_title: "One platform — every workflow",
  features_subtitle:
    "Projects, attendance, HSE, HR, and more — enable modules for your company.",
  projects_label: "Projects",
  projects_title: "Featured projects",
  app_download_title: "Worker app",
  app_download_text: "Project news, attendance, and safety alerts on mobile.",
  login_title: "Sign in",
  login_subtitle: "Sign in to your company workspace",
  login_bg_image: "",
  phone: "",
  email: "",
  address: "",
  footer_copyright: "All rights reserved.",
  nav_menu: [],
  custom_pages: [],
  stats: [
    { value: "—", label: "Experience" },
    { value: "—", label: "Projects" },
    { value: "—", label: "People" },
    { value: "—", label: "Support" },
  ],
  features: [
    {
      title: "Project management",
      desc: "Projects, tasks, and progress in one place.",
      icon: "project",
    },
    {
      title: "Safety",
      desc: "Incidents, briefings, and live registers.",
      icon: "safety",
    },
    {
      title: "Attendance",
      desc: "Daily check-in and check-out for crews.",
      icon: "clock",
    },
    {
      title: "Human resources",
      desc: "Roles, users, and org structure.",
      icon: "team",
    },
  ],
  projects: [],
};

const PLACEHOLDER_BRANDS = new Set([
  "",
  "company title",
  "your company",
  "your logo",
  "компани",
  "үлэмжийн зам",
  "үлэмжийн зам llc",
]);

function isPlaceholderBrand(value) {
  return PLACEHOLDER_BRANDS.has(String(value || "").trim().toLowerCase());
}

const ARRAY_FIELDS = [
  "stats",
  "features",
  "projects",
  "hero_slides",
  "awards",
  "partners",
  "values",
  "director_paragraphs",
  "machinery",
  "plants",
  "tech_stack",
  "hr_benefits",
  "hr_steps",
  "hr_positions",
  "news_articles",
  "standart_certificates",
  "standart_sections",
  "footer_services",
  "nav_menu",
  "custom_pages",
];

function mergeHomepageContent(stored) {
  const base = { ...DEFAULT_HOMEPAGE };
  if (!stored || typeof stored !== "object") return base;

  const merged = { ...base, ...stored };

  for (const key of ARRAY_FIELDS) {
    const value = stored[key];
    if (Array.isArray(value) && value.length > 0) {
      merged[key] = value;
    }
  }

  // Allow empty custom_pages / nav_menu when explicitly saved
  if (Array.isArray(stored.nav_menu)) merged.nav_menu = stored.nav_menu;
  if (Array.isArray(stored.custom_pages)) merged.custom_pages = stored.custom_pages;

  const heroObjects = ["technology_hero", "projects_hero", "hr_hero", "news_hero", "standart_hero"];
  for (const key of heroObjects) {
    if (stored[key] && typeof stored[key] === "object") {
      merged[key] = { ...(base[key] || {}), ...stored[key] };
    }
  }

  // Empty / shared demo logo stays empty so tenants don't inherit another brand mark
  const logo = String(stored.logo || "").trim();
  if (!logo || logo === "/logo.jpeg" || logo === "logo.jpeg") {
    merged.logo = "";
  }

  return merged;
}

/** Prefer real tenant name over CMS placeholders. */
function applyTenantBranding(content, tenant, raw) {
  if (!content || !tenant) return content;
  const rawName = raw && typeof raw === "object" ? raw.company_name : undefined;
  if (isPlaceholderBrand(rawName) || isPlaceholderBrand(content.company_name)) {
    content.company_name =
      tenant.company_name || tenant.name || "Company title";
  }
  if (isPlaceholderBrand(content.about_title)) {
    content.about_title = content.company_name;
  }
  return content;
}

module.exports = {
  DEFAULT_HOMEPAGE,
  mergeHomepageContent,
  applyTenantBranding,
  isPlaceholderBrand,
};
