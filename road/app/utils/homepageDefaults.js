const DEFAULT_HOMEPAGE = {
  company_name: "Үлэмжийн зам LLC",
  company_tagline: "Замын удирдлагын систем",
  logo: "/logo.jpeg",
  hero_badge: "Зам бүтээдэг хүч — Ирээдүйг бүтээгч бид",
  hero_title: "Авто зам, гүүр, дэд бүтцийн төслүүд",
  hero_title_highlight: "дэд бүтцийн",
  hero_subtitle:
    "Бид чанар, аюулгүй байдал, хугацааны стандартыг баримталж үндэсний хэмжээний замын төслүүдийг гүйцэтгэдэг.",
  hero_bg_image: "/bg.png",
  about_label: "Бидний тухай",
  about_title: "Үлэмжийн зам LLC",
  about_text1:
    "2008 оноос хойш авто зам, гүүрийн барилга угсралт, засвар арчлалтаар мэргэшсэн үндэсний хэмжээний компани. Бид төслийн бүх үе шатыг нэг платформоор удирдана.",
  about_text2:
    "Манай системээр төсөл, ажилтан, материал, ирц, аюулгүй байдлыг нэг дороос хянах боломжтой.",
  about_image: "/back.png",
  director_image: "/p1.png",
  features_label: "Удирдлагын систем",
  features_title: "Нэг платформ — бүх үйл явдал",
  features_subtitle:
    "Замын компанид зориулсан админ болон ажилчны апп — төсөл, ирц, аюулгүй байдал.",
  projects_label: "Төслүүд",
  projects_title: "Гүйцэтгэсэн & явагдаж буй ажлууд",
  app_download_title: "Ажилчны апп татах",
  app_download_text:
    "Төслийн мэдээ, ирц бүртгэл, аюулгүй байдлын мэдэгдэл — гар утаснаасаа.",
  login_title: "Админ нэвтрэх",
  login_subtitle: "Замын удирдлагын системд нэвтэрнэ үү",
  login_bg_image: "/zs.png",
  phone: "7000-0000",
  email: "info@ulemjin-zam.mn",
  address: "Улаанбаатар, Сүхбаатар дүүрэг",
  footer_copyright: "Бүх эрх хуулиар хамгаалагдсан.",
  nav_menu: [],
  custom_pages: [],
  stats: [
    { value: "15+", label: "Жилийн туршлага" },
    { value: "120+", label: "Гүйцэтгэсэн төсөл" },
    { value: "500+", label: "Мэргэшсэн ажилтан" },
    { value: "24/7", label: "Төслийн хяналт" },
  ],
  features: [
    {
      title: "Төслийн удирдлага",
      desc: "Төсөл, даалгавар, явцын нэгдсэн хяналт.",
      icon: "project",
    },
    {
      title: "Аюулгүй байдал",
      desc: "Ослын мэдээлэл, заавар, бодит цагийн бүртгэл.",
      icon: "safety",
    },
    {
      title: "Ирцийн систем",
      desc: "Ажилчин өдөр бүр ирсэн, явсан цагаа бүртгэнэ.",
      icon: "clock",
    },
    {
      title: "Хүний нөөц",
      desc: "Эрх, хэрэглэгч, багийн бүтцийг уян хатан удирдах.",
      icon: "team",
    },
  ],
  projects: [
    {
      image: "/p1.png",
      title: "Улаанбаатар — Дархан чиглэлийн зам",
      desc: "30 км авто замын шинэчлэлт, 2024 онд ашиглалтад орсон.",
      tag: "Дууссан",
    },
    {
      image: "/p2.png",
      title: "Орон нутгийн холболтын зам",
      desc: "Дэд бүтэц, гүүрийн барилга угсралтын төсөл.",
      tag: "Явагдаж буй",
    },
    {
      image: "/p3.png",
      title: "Хотын дотоод замын сүлжээ",
      desc: "Замын засвар, арчилгаа, аюулгүй байдлын стандарт.",
      tag: "Төлөвлөгдсөн",
    },
  ],
};

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

  return merged;
}

module.exports = { DEFAULT_HOMEPAGE, mergeHomepageContent };
