/** Canonical zam modules controllable per tenant by platform admin. */
const MODULE_CATALOG = [
  { id: "operations", key: "operations:module", label: "Төсөл/Ажил" },
  { id: "inventory", key: "inventory:module", label: "Бараа материал" },
  { id: "hr", key: "hr:module", label: "HR удирдлага" },
  { id: "document", key: "document:module", label: "Баримт бичиг" },
  { id: "notification", key: "notification:module", label: "Мэдэгдэл" },
  { id: "finance", key: "finance:module", label: "Санхүү" },
  { id: "ai-tender", key: "ai_tender:module", label: "AI Тендер" },
  { id: "daily-report", key: "daily_report:module", label: "Daily report" },
  { id: "tender", key: "tender:module", label: "Тендер материал" },
  { id: "homepage", key: "homepage:module", label: "Нүүр хуудас" },
  { id: "system-access", key: "system:module", label: "Эрхийн зохицуулалт" },
  { id: "equipment", key: "equipment:module", label: "Техник" },
  { id: "rental", key: "rental:module", label: "Түрээс" },
  { id: "gps", key: "gps:module", label: "GPS" },
  { id: "fleet", key: "fuel:module", label: "Түлш" },
  { id: "road-engineering", key: "road:module", label: "Замын инженеринг /Талбай/" },
  { id: "budget", key: "budget:module", label: "Төсөв" },
  { id: "material", key: "material:module", label: "Материал" },
  { id: "geodesy", key: "geodesy:module", label: "Геодези" },
  { id: "hse", key: "hse:module", label: "ХАБ" },
  { id: "plant", key: "plant:module", label: "Үйлдвэр" },
  { id: "data-factory", key: "plant:module", label: "Data · Үйлдвэр" },
  { id: "data-technique", key: "technique:module", label: "Data · Техник" },
  { id: "data-brigade", key: "brigada:module", label: "Data · Бригада" },
  { id: "data-laboratory", key: "laboratory:module", label: "Data · Лаборатори" },
  { id: "data-job-seeker", key: "job_seeker:module", label: "Data · Ажил горилогч" },
  { id: "data-student", key: "student:module", label: "Data · Оюутан" },
  { id: "data-road-sign", key: "road_sign:module", label: "Data · Замын тэмдэг" },
  { id: "uniform-supply", key: "uniform:module", label: "Хувцас хэрэглэл хангамж" },
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
