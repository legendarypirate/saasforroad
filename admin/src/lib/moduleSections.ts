import type { ModuleInfo } from "@/lib/api";

/**
 * Categorized zam modules — mirrors the tenant-side dashboard grouping
 * (ADMIN_FOLDER_SECTIONS in zam) so the platform admin picks modules using the
 * same mental model tenants see.
 */
export interface ModuleSection {
  id: string;
  title: string;
  description: string;
  moduleIds: string[];
}

export const MODULE_SECTIONS: ModuleSection[] = [
  {
    id: "management",
    title: "Удирдлагын хэсэг",
    description: "Төсөл, хүний нөөц, санхүү, баримт",
    moduleIds: [
      "operations",
      "inventory",
      "hr",
      "document",
      "notification",
      "finance",
      "ai-tender",
      "daily-report",
      "tender",
    ],
  },
  {
    id: "erp-settings",
    title: "ERP Тохиргоо",
    description: "Системийн тохиргоо, хандалт",
    moduleIds: ["homepage", "system-access"],
  },
  {
    id: "fleet-tech",
    title: "Техник, машин",
    description: "Техник, түрээс, GPS, түлш",
    moduleIds: ["equipment", "rental", "gps", "fleet"],
  },
  {
    id: "engineering",
    title: "Инженерийн хэсэг",
    description: "Зам, төсөв, материал, геодези, ХАБ, үйлдвэр",
    moduleIds: [
      "road-engineering",
      "budget",
      "material",
      "geodesy",
      "hse",
      "plant",
    ],
  },
  {
    id: "data",
    title: "Data",
    description: "Платформын дата — харах / холбогдох",
    moduleIds: [
      "data-factory",
      "data-technique",
      "data-brigade",
      "data-laboratory",
      "data-job-seeker",
      "data-student",
      "data-road-sign",
      "uniform-supply",
    ],
  },
];

export interface GroupedModuleSection extends ModuleSection {
  modules: ModuleInfo[];
}

/**
 * Group the API module list into sections (in declared order). Any module not
 * listed in a section falls into a trailing "Бусад" group so nothing is hidden.
 */
export function groupModulesBySection(
  modules: ModuleInfo[],
): GroupedModuleSection[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const claimed = new Set<string>();

  const grouped: GroupedModuleSection[] = MODULE_SECTIONS.map((section) => {
    const sectionModules = section.moduleIds
      .map((mid) => byId.get(mid))
      .filter((m): m is ModuleInfo => Boolean(m));
    sectionModules.forEach((m) => claimed.add(m.id));
    return { ...section, modules: sectionModules };
  }).filter((s) => s.modules.length > 0);

  const leftovers = modules.filter((m) => !claimed.has(m.id));
  if (leftovers.length > 0) {
    grouped.push({
      id: "other",
      title: "Бусад",
      description: "Ангилагдаагүй модулиуд",
      moduleIds: leftovers.map((m) => m.id),
      modules: leftovers,
    });
  }

  return grouped;
}
