/** Standard road construction stage-gate phases (FIDIC / site practice). */
const ROAD_PHASE_TEMPLATE = [
  { name: "Бэлтгэл / Mobilization", color: "#64748b", sort_order: 1, days: 21 },
  { name: "Шорооны ажил / Earthworks", color: "#ea580c", sort_order: 2, days: 90 },
  { name: "Байгууламж / Structures", color: "#7c3aed", sort_order: 3, days: 60 },
  { name: "Ус зайлуулалт / Drainage", color: "#0284c7", sort_order: 4, days: 45 },
  { name: "Хучилт / Pavement", color: "#0f766e", sort_order: 5, days: 75 },
  { name: "Тэмдэглэгээ / Marking & furniture", color: "#ca8a04", sort_order: 6, days: 21 },
  { name: "Хүлээлгэн өгөх / Handover", color: "#16a34a", sort_order: 7, days: 14 },
];

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Create default stage-gate phases for a project if none exist.
 * @returns {Promise<number>} number of phases created
 */
async function seedProjectPhases(db, project, { force = false } = {}) {
  if (!project?.id) return 0;
  const existing = await db.project_phases.count({ where: { project_id: project.id } });
  if (existing > 0 && !force) return 0;

  const start =
    project.planned_start ||
    project.baseline_start ||
    new Date().toISOString().slice(0, 10);

  let cursor = start;
  const rows = ROAD_PHASE_TEMPLATE.map((t) => {
    const start_date = cursor;
    const end_date = addDays(start_date, t.days);
    cursor = end_date;
    return {
      project_id: project.id,
      name: t.name,
      start_date,
      end_date,
      completion_percent: 0,
      color: t.color,
      sort_order: t.sort_order,
    };
  });

  await db.project_phases.bulkCreate(rows);
  return rows.length;
}

module.exports = { ROAD_PHASE_TEMPLATE, seedProjectPhases };
