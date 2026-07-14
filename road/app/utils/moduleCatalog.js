/** Canonical zam modules controllable per tenant by platform admin. */
const MODULE_CATALOG = [
  { id: "road-engineering", key: "road:module", label: "Замын инженеринг" },
  { id: "operations", key: "operations:module", label: "Үйл ажиллагаа" },
  { id: "system-access", key: "system:module", label: "Систем / хандалт" },
  { id: "rental", key: "rental:module", label: "Түрээс" },
  { id: "equipment", key: "equipment:module", label: "Техник" },
  { id: "inventory", key: "inventory:module", label: "Агуулах" },
  { id: "hr", key: "hr:module", label: "Хүний нөөц" },
  { id: "homepage", key: "homepage:module", label: "Нүүр хуудас" },
  { id: "tender", key: "tender:module", label: "Тендер" },
  { id: "document", key: "document:module", label: "Баримт бичиг" },
  { id: "notification", key: "notification:module", label: "Мэдэгдэл" },
  { id: "finance", key: "finance:module", label: "Санхүү" },
  { id: "gps", key: "gps:module", label: "GPS" },
  { id: "ai-tender", key: "ai_tender:module", label: "AI тендер" },
  { id: "uniform-supply", key: "uniform:module", label: "Хувцас" },
  { id: "fleet", key: "fuel:module", label: "Шатахуун / авто" },
  { id: "daily-report", key: "daily_report:module", label: "Өдөр тутмын тайлан" },
  { id: "hse", key: "hse:module", label: "ХАБЭА" },
  { id: "plant", key: "plant:module", label: "Үйлдвэр" },
  { id: "budget", key: "budget:module", label: "Төсөв" },
  { id: "data-factory", key: "plant:module", label: "Өгөгдөл · Үйлдвэр" },
  { id: "data-technique", key: "technique:module", label: "Өгөгдөл · Техник" },
  { id: "data-brigade", key: "brigada:module", label: "Өгөгдөл · Бригад" },
  { id: "data-laboratory", key: "laboratory:module", label: "Өгөгдөл · Лаборатори" },
  { id: "data-job-seeker", key: "job_seeker:module", label: "Өгөгдөл · Ажил хайгч" },
  { id: "data-student", key: "student:module", label: "Өгөгдөл · Оюутан" },
  { id: "data-road-sign", key: "road_sign:module", label: "Өгөгдөл · Тэмдэг" },
];

function allModuleIds() {
  return MODULE_CATALOG.map((m) => m.id);
}

function normalizeModules(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return allModuleIds();
  const allowed = new Set(allModuleIds());
  return [...new Set(modules.filter((id) => allowed.has(String(id))))];
}

module.exports = { MODULE_CATALOG, allModuleIds, normalizeModules };
