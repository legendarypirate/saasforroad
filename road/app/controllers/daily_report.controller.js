const db = require("../models");
const DailyReport = db.daily_reports;
const Project = db.projects;
const User = db.users;
const Attendance = db.attendances;
const Accident = db.accidents;
const Op = db.Sequelize.Op;

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildPayload(body) {
  return {
    report_date: body.report_date || todayISO(),
    project_id: body.project_id,
    created_by: body.created_by || null,
    status: body.status === "draft" ? "draft" : "submitted",
    weather_note: body.weather_note || null,
    progress_planned: num(body.progress_planned),
    progress_actual: num(body.progress_actual),
    progress_unit: body.progress_unit || "%",
    progress_note: body.progress_note || null,
    safety_incidents: Math.max(0, Math.floor(num(body.safety_incidents))),
    safety_near_misses: Math.max(0, Math.floor(num(body.safety_near_misses))),
    safety_note: body.safety_note || null,
    labor_planned: Math.max(0, Math.floor(num(body.labor_planned))),
    labor_present: Math.max(0, Math.floor(num(body.labor_present))),
    labor_absent: Math.max(0, Math.floor(num(body.labor_absent))),
    labor_overtime: Math.max(0, Math.floor(num(body.labor_overtime))),
    labor_note: body.labor_note || null,
    equipment_working: Math.max(0, Math.floor(num(body.equipment_working))),
    equipment_idle: Math.max(0, Math.floor(num(body.equipment_idle))),
    equipment_broken: Math.max(0, Math.floor(num(body.equipment_broken))),
    equipment_note: body.equipment_note || null,
    materials_shortages: Math.max(0, Math.floor(num(body.materials_shortages))),
    materials_note: body.materials_note || null,
    attention_needed: body.attention_needed || null,
    notes: body.notes || null,
  };
}

const include = [
  { model: Project, as: "project", attributes: ["id", "name"] },
  { model: User, as: "author", attributes: ["id", "username"] },
];

exports.create = async (req, res) => {
  try {
    if (!req.body.project_id) {
      return res.status(400).json({ success: false, message: "Төсөл сонгоно уу" });
    }
    const payload = buildPayload(req.body);
    const existing = await DailyReport.findOne({
      where: {
        report_date: payload.report_date,
        project_id: payload.project_id,
      },
    });
    if (existing) {
      await existing.update(payload);
      const full = await DailyReport.findByPk(existing.id, { include });
      return res.json({ success: true, data: full, updated: true });
    }
    const row = await DailyReport.create(payload);
    const full = await DailyReport.findByPk(row.id, { include });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.date) where.report_date = req.query.date;
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.status) where.status = req.query.status;

    const data = await DailyReport.findAll({
      where,
      include,
      order: [
        ["report_date", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const row = await DailyReport.findByPk(req.params.id, { include });
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await DailyReport.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const payload = buildPayload({ ...row.toJSON(), ...req.body, project_id: req.body.project_id || row.project_id });
    await row.update(payload);
    const full = await DailyReport.findByPk(row.id, { include });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const n = await DailyReport.destroy({ where: { id: req.params.id } });
    if (!n) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Short General Director summary for one day */
exports.summary = async (req, res) => {
  try {
    const date = req.query.date || todayISO();
    const reports = await DailyReport.findAll({
      where: { report_date: date, status: { [Op.ne]: "draft" } },
      include,
      order: [["id", "ASC"]],
    });

    const totals = {
      projects_reported: reports.length,
      safety_incidents: 0,
      safety_near_misses: 0,
      labor_planned: 0,
      labor_present: 0,
      labor_absent: 0,
      labor_overtime: 0,
      equipment_working: 0,
      equipment_idle: 0,
      equipment_broken: 0,
      materials_shortages: 0,
      progress_planned: 0,
      progress_actual: 0,
    };

    const attention = [];
    const projectCards = [];

    for (const r of reports) {
      totals.safety_incidents += num(r.safety_incidents);
      totals.safety_near_misses += num(r.safety_near_misses);
      totals.labor_planned += num(r.labor_planned);
      totals.labor_present += num(r.labor_present);
      totals.labor_absent += num(r.labor_absent);
      totals.labor_overtime += num(r.labor_overtime);
      totals.equipment_working += num(r.equipment_working);
      totals.equipment_idle += num(r.equipment_idle);
      totals.equipment_broken += num(r.equipment_broken);
      totals.materials_shortages += num(r.materials_shortages);
      totals.progress_planned += num(r.progress_planned);
      totals.progress_actual += num(r.progress_actual);

      const name = r.project?.name || `Төсөл #${r.project_id}`;
      const planned = num(r.progress_planned);
      const actual = num(r.progress_actual);
      const progressPct =
        planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0;

      projectCards.push({
        id: r.id,
        project_id: r.project_id,
        project_name: name,
        progress_pct: progressPct,
        progress_unit: r.progress_unit,
        safety_incidents: num(r.safety_incidents),
        labor_present: num(r.labor_present),
        labor_planned: num(r.labor_planned),
        equipment_broken: num(r.equipment_broken),
        materials_shortages: num(r.materials_shortages),
        weather_note: r.weather_note,
      });

      if (num(r.safety_incidents) > 0) {
        attention.push({
          level: "critical",
          project: name,
          text: `Осол/ослын дуудлага: ${r.safety_incidents}${r.safety_note ? ` — ${r.safety_note}` : ""}`,
        });
      }
      if (num(r.safety_near_misses) > 0) {
        attention.push({
          level: "warn",
          project: name,
          text: `Осолд дөхсөн: ${r.safety_near_misses}`,
        });
      }
      if (planned > 0 && actual < planned * 0.8) {
        attention.push({
          level: "warn",
          project: name,
          text: `Явц хоцрогдол: төлөвлөсөн ${planned}${r.progress_unit || ""} / гүйцэтгэсэн ${actual}${r.progress_unit || ""}`,
        });
      }
      if (num(r.equipment_broken) > 0) {
        attention.push({
          level: "warn",
          project: name,
          text: `Эвдэрсэн техник: ${r.equipment_broken}${r.equipment_note ? ` — ${r.equipment_note}` : ""}`,
        });
      }
      if (num(r.materials_shortages) > 0) {
        attention.push({
          level: "warn",
          project: name,
          text: `Материалын дутагдал: ${r.materials_shortages}${r.materials_note ? ` — ${r.materials_note}` : ""}`,
        });
      }
      if (r.attention_needed?.trim()) {
        attention.push({
          level: "info",
          project: name,
          text: r.attention_needed.trim(),
        });
      }
    }

    // Live attendance pulse for the same day (company-wide)
    let attendancePulse = null;
    try {
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd = `${date}T23:59:59.999Z`;
      const attendanceRows = await Attendance.findAll({
        where: {
          work_date: date,
        },
        attributes: ["id", "status", "check_in_at", "check_out_at"],
      });
      // Fallback if work_date filter empty — try check_in range
      let rows = attendanceRows;
      if (!rows.length) {
        rows = await Attendance.findAll({
          where: {
            check_in_at: { [Op.between]: [dayStart, dayEnd] },
          },
          attributes: ["id", "status", "check_in_at", "check_out_at"],
        });
      }
      const present = rows.filter((a) => a.check_in_at).length;
      attendancePulse = {
        checked_in: present,
        total_records: rows.length,
      };
    } catch {
      attendancePulse = null;
    }

    // Accidents logged that day (system accidents module)
    let systemAccidents = 0;
    try {
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59`);
      systemAccidents = await Accident.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] },
        },
      });
    } catch {
      systemAccidents = 0;
    }

    const progressPct =
      totals.progress_planned > 0
        ? Math.round((totals.progress_actual / totals.progress_planned) * 100)
        : null;

    res.json({
      success: true,
      data: {
        date,
        totals: {
          ...totals,
          progress_pct: progressPct,
          system_accidents: systemAccidents,
        },
        attendance_pulse: attendancePulse,
        attention: attention.slice(0, 12),
        projects: projectCards,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
