const DEFAULT_MODULES = [
  {
    id: "road-engineering",
    label: "Замын инженеринг",
    blurb: "Трасса, хөндлөн огтлол, газрын ажил, хучилт, зураг төсөл.",
    enabled: true,
  },
  {
    id: "operations",
    label: "Үйл ажиллагаа",
    blurb: "Төсөл, ажлын даалгавар, өдөр тутмын явц, тайлан.",
    enabled: true,
  },
  {
    id: "hr",
    label: "Хүний нөөц",
    blurb: "Ажилтан, бүтэц, чөлөө, цалин, нэгдсэн бүртгэл.",
    enabled: true,
  },
  {
    id: "finance",
    label: "Санхүү",
    blurb: "Гүйлгээ, төсөв, зардал, компанийн санхүүгийн хяналт.",
    enabled: true,
  },
  {
    id: "inventory",
    label: "Агуулах",
    blurb: "Бараа материал, нөөц, хөдөлгөөн, захиалга.",
    enabled: true,
  },
  {
    id: "fleet",
    label: "Шатахуун / авто",
    blurb: "Шатахуун худалдан авалт, зарцуулалт, автопарк.",
    enabled: true,
  },
  {
    id: "equipment",
    label: "Техник",
    blurb: "Машин механизм, түрээс, ашиглалт.",
    enabled: true,
  },
  {
    id: "hse",
    label: "ХАБЭА",
    blurb: "Эрсдэл, осол, сургалт, зөвшөөрөл, аюулгүй ажиллагаа.",
    enabled: true,
  },
  {
    id: "plant",
    label: "Үйлдвэр",
    blurb: "Үйлдвэрийн талбай, бүтээгдэхүүн, өдрийн тайлан.",
    enabled: true,
  },
  {
    id: "tender",
    label: "Тендер",
    blurb: "Тендерийн баримт, санал, AI дэмжлэгтэй бэлтгэл.",
    enabled: true,
  },
  {
    id: "document",
    label: "Баримт бичиг",
    blurb: "Дотоод баримт, стандарт, хадгалалт.",
    enabled: true,
  },
  {
    id: "homepage",
    label: "Нүүр хуудас",
    blurb: "Байгууллагын нийтийн сайт, мэдээ, төслүүд.",
    enabled: true,
  },
];

const DEFAULT_DATA_ITEMS = [
  {
    id: "data-factory",
    label: "Үйлдвэр",
    blurb: "Батлагдсан үйлдвэрийн газрын зураг, нэгдсэн мэдээллийн сан.",
    enabled: true,
  },
  {
    id: "data-technique",
    label: "Техник",
    blurb: "Техникийн бүртгэл, байршил, ашиглалтын өгөгдөл.",
    enabled: true,
  },
  {
    id: "data-brigade",
    label: "Бригад",
    blurb: "Бригадын бүтэц, хүчин чадал, байршил.",
    enabled: true,
  },
  {
    id: "data-laboratory",
    label: "Лаборатори",
    blurb: "Лабораторийн үр дүн, чанарын бүртгэл.",
    enabled: true,
  },
  {
    id: "data-job-seeker",
    label: "Ажил хайгч",
    blurb: "Ажил хайгчдын нэгдсэн бүртгэл.",
    enabled: true,
  },
  {
    id: "data-student",
    label: "Оюутан",
    blurb: "Оюутны дадлага, холбоо барих мэдээлэл.",
    enabled: true,
  },
  {
    id: "data-road-sign",
    label: "Замын тэмдэг",
    blurb: "Замын тэмдгийн каталог, байршил.",
    enabled: true,
  },
];

const DEFAULT_PLATFORM_LANDING = {
  brand_name: "RCOS",
  tagline: "Замын салбарын SaaS платформ",
  meta_title: "RCOS — Замын салбарын SaaS платформ",
  meta_description:
    "Замын барилга, ашиглалт, ХАБЭА, санхүү, хүний нөөцийг нэг SaaS тавцан дээр — компани бүр өөрийн домэйн дээр ажиллана.",
  hero_eyebrow: "rcos.mn",
  hero_title: "Нэг платформ. Олон компани.",
  hero_subtitle:
    "Замын компани бүрт өөрийн ERP — {slug}.rcos.mn эсвэл захиалгат домэйн. Модуль, эрх, өгөгдлийг платформоос удирдана.",
  hero_image: "",
  hero_images: [],
  cta_primary_label: "Платформ нэвтрэх",
  cta_primary_url: "https://admin.rcos.mn",
  cta_secondary_label: "Модуль үзэх",
  cta_secondary_url: "#modules",
  stats: [
    { value: "20+", label: "ERP модуль" },
    { value: "7", label: "Өгөгдлийн сан" },
    { value: "1", label: "Платформ админ" },
    { value: "∞", label: "Tenant" },
  ],
  modules_title: "ERP модулиуд",
  modules_subtitle:
    "Платформ админ компани бүрт эдгээр модулийг асааж/унтраана. Систем {slug}.rcos.mn эсвэл захиалгат домэйн дээр ажиллана.",
  modules: DEFAULT_MODULES,
  data_title: "Дата мэдээлэл",
  data_subtitle:
    "Салбарын нийтлэг өгөгдөл — үйлдвэр, техник, бригад, лаборатори. Модуль эрхээр нээгдэнэ.",
  data_items: DEFAULT_DATA_ITEMS,
  steps_title: "Хэрхэн ажилладаг вэ",
  steps: [
    {
      title: "Бүртгэл",
      text: "admin.rcos.mn дээр компани (tenant) үүсгэнэ.",
    },
    {
      title: "Домэйн",
      text: "Шууд company.rcos.mn — эсвэл өөрийн домэйн (A record).",
    },
    {
      title: "Модуль + эрх",
      text: "Модуль асааж, супер админ / роль permission тохируулна.",
    },
  ],
  footer_text: "RCOS Platform",
  contact_email: "admin@rcos.mn",
  admin_url: "https://admin.rcos.mn",
};

const ARRAY_FIELDS = ["stats", "modules", "data_items", "steps", "hero_images"];

function normalizeHeroImages(list, legacySingle) {
  const fromList = Array.isArray(list)
    ? list.map((u) => String(u || "").trim()).filter(Boolean)
    : [];
  if (fromList.length) return fromList.slice(0, 3);
  const single = String(legacySingle || "").trim();
  return single ? [single] : [];
}

function normalizeItemList(list, fallback) {
  if (!Array.isArray(list)) return fallback.map((x) => ({ ...x }));
  return list.map((item, i) => ({
    id: String(item?.id || `item-${i}`),
    label: String(item?.label || ""),
    blurb: String(item?.blurb || item?.text || ""),
    enabled: item?.enabled !== false,
  }));
}

function normalizeSteps(list, fallback) {
  if (!Array.isArray(list)) return fallback.map((x) => ({ ...x }));
  return list.map((item) => ({
    title: String(item?.title || ""),
    text: String(item?.text || ""),
  }));
}

function normalizeStats(list, fallback) {
  if (!Array.isArray(list)) return fallback.map((x) => ({ ...x }));
  return list.map((item) => ({
    value: String(item?.value || ""),
    label: String(item?.label || ""),
  }));
}

function mergePlatformLandingContent(stored) {
  const base = JSON.parse(JSON.stringify(DEFAULT_PLATFORM_LANDING));
  if (!stored || typeof stored !== "object") return base;

  const merged = { ...base, ...stored };

  for (const key of ARRAY_FIELDS) {
    if (key === "hero_images") continue;
    if (Array.isArray(stored[key])) {
      if (key === "stats") merged.stats = normalizeStats(stored.stats, base.stats);
      else if (key === "modules")
        merged.modules = normalizeItemList(stored.modules, base.modules);
      else if (key === "data_items")
        merged.data_items = normalizeItemList(stored.data_items, base.data_items);
      else if (key === "steps")
        merged.steps = normalizeSteps(stored.steps, base.steps);
    }
  }

  merged.hero_images = normalizeHeroImages(stored.hero_images, stored.hero_image);
  merged.hero_image = merged.hero_images[0] || "";

  return merged;
}

module.exports = {
  DEFAULT_PLATFORM_LANDING,
  mergePlatformLandingContent,
};
