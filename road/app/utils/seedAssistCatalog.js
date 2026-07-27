/**
 * Seed default roadside assist categories + services (idempotent).
 */
async function seedAssistCatalog(db) {
  const count = await db.assist_service_categories.count();
  if (count > 0) return { skipped: true, count };

  const defs = [
    {
      name: "Tire",
      name_mn: "Дугуй",
      icon: "tire",
      services: [
        { name: "Flat tire", name_mn: "Хагарсан / хатсан дугуй", icon: "tire" },
        { name: "Tire change", name_mn: "Дугуй солих", icon: "tire" },
      ],
    },
    {
      name: "Battery",
      name_mn: "Аккумулятор",
      icon: "battery",
      services: [
        { name: "Jump start", name_mn: "Асаах / цэнэглэх", icon: "battery" },
        { name: "Battery replace", name_mn: "Аккум солих", icon: "battery" },
      ],
    },
    {
      name: "Engine",
      name_mn: "Хөдөлгүүр",
      icon: "engine",
      services: [
        { name: "Engine assist", name_mn: "Хөдөлгүүрийн тусламж", icon: "engine" },
      ],
    },
    {
      name: "Fuel",
      name_mn: "Шатахуун",
      icon: "fuel",
      services: [
        { name: "Fuel delivery", name_mn: "Шатахуун хүргэх", icon: "fuel" },
      ],
    },
    {
      name: "Tow",
      name_mn: "Чирэх",
      icon: "tow",
      services: [
        { name: "Towing", name_mn: "Машин чирэх", icon: "tow" },
      ],
    },
    {
      name: "Other",
      name_mn: "Бусад",
      icon: "other",
      services: [
        { name: "Other help", name_mn: "Бусад техник тусламж", icon: "other" },
      ],
    },
  ];

  let order = 0;
  for (const cat of defs) {
    const created = await db.assist_service_categories.create({
      name: cat.name,
      name_mn: cat.name_mn,
      icon: cat.icon,
      sort_order: order++,
      is_active: true,
    });
    let sOrder = 0;
    for (const s of cat.services) {
      await db.assist_services.create({
        category_id: created.id,
        name: s.name,
        name_mn: s.name_mn,
        icon: s.icon,
        sort_order: sOrder++,
        is_active: true,
      });
    }
  }
  return { skipped: false, count: defs.length };
}

module.exports = { seedAssistCatalog };
