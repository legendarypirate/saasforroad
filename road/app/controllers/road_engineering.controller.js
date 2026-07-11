const { Op } = require("sequelize");
const db = require("../models");
const { makeCrud } = require("../utils/hseCrud");

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function projectFilter(query) {
  const where = {};
  if (query.q) {
    const q = `%${query.q}%`;
    where[Op.or] = [
      { code: { [Op.iLike]: q } },
      { name: { [Op.iLike]: q } },
      { designer: { [Op.iLike]: q } },
      { contractor: { [Op.iLike]: q } },
      { province: { [Op.iLike]: q } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.road_class) where.road_class = query.road_class;
  return where;
}

const projectsCrud = makeCrud(db.road_projects, {
  order: [["updatedAt", "DESC"]],
  filterWhere: projectFilter,
  buildPayload: (body) => ({
    code: body.code,
    name: body.name,
    road_class: body.road_class,
    description: body.description,
    province: body.province,
    district: body.district,
    start_station: num(body.start_station),
    end_station: num(body.end_station),
    length: num(body.length, Math.max(0, num(body.end_station) - num(body.start_station))),
    status: body.status || "draft",
    progress: num(body.progress),
    designer: body.designer,
    contractor: body.contractor,
    consultant: body.consultant,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    created_by: body.created_by ?? null,
  }),
});

exports.listProjects = projectsCrud.findAll;
exports.getProject = projectsCrud.findOne;
exports.createProject = projectsCrud.create;
exports.updateProject = projectsCrud.update;
exports.deleteProject = projectsCrud.delete;

exports.duplicateProject = async (req, res) => {
  try {
    const src = await db.road_projects.findByPk(req.params.id);
    if (!src) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const copy = await db.road_projects.create({
      ...src.toJSON(),
      id: undefined,
      code: `${src.code}-COPY-${Date.now().toString().slice(-4)}`,
      name: `${src.name} (хуулбар)`,
      status: "draft",
      createdAt: undefined,
      updatedAt: undefined,
    });
    res.json({ success: true, data: copy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const row = await db.road_projects.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({ status: "archived" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const alignmentsCrud = makeCrud(db.alignments, {
  include: [{ model: db.road_projects, as: "project", attributes: ["id", "code", "name"] }],
  order: [["id", "ASC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.type) where.type = q.type;
    if (q.q) where.name = { [Op.iLike]: `%${q.q}%` };
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id,
    name: body.name,
    type: body.type || "CENTERLINE",
    length: num(body.length),
    start_station: num(body.start_station),
    end_station: num(body.end_station),
  }),
});

exports.listAlignments = alignmentsCrud.findAll;
exports.getAlignment = alignmentsCrud.findOne;
exports.createAlignment = alignmentsCrud.create;
exports.updateAlignment = alignmentsCrud.update;
exports.deleteAlignment = alignmentsCrud.delete;

const surveyCrud = makeCrud(db.survey_points, {
  include: [{ model: db.alignments, as: "alignment", attributes: ["id", "name", "project_id"] }],
  order: [["station", "ASC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.alignment_id) where.alignment_id = q.alignment_id;
    if (q.q) {
      where[Op.or] = [
        { point_code: { [Op.iLike]: `%${q.q}%` } },
        { description: { [Op.iLike]: `%${q.q}%` } },
      ];
    }
    return where;
  },
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    station: num(body.station),
    offset: num(body.offset),
    northing: body.northing != null ? num(body.northing) : null,
    easting: body.easting != null ? num(body.easting) : null,
    elevation: body.elevation != null ? num(body.elevation) : null,
    point_code: body.point_code,
    description: body.description,
  }),
});

exports.listSurveyPoints = surveyCrud.findAll;
exports.getSurveyPoint = surveyCrud.findOne;
exports.createSurveyPoint = surveyCrud.create;
exports.updateSurveyPoint = surveyCrud.update;
exports.deleteSurveyPoint = surveyCrud.delete;

exports.importSurveyPoints = async (req, res) => {
  try {
    const { alignment_id, points } = req.body;
    if (!alignment_id || !Array.isArray(points) || !points.length) {
      return res.status(400).json({ success: false, message: "alignment_id болон points шаардлагатай" });
    }
    const alignment = await db.alignments.findByPk(alignment_id);
    if (!alignment) return res.status(404).json({ success: false, message: "Alignment олдсонгүй" });

    const existing = await db.survey_points.findAll({
      where: { alignment_id },
      attributes: ["station", "offset", "northing", "easting"],
    });
    const keyOf = (p) => `${num(p.station).toFixed(3)}|${num(p.offset).toFixed(3)}`;
    const seen = new Set(existing.map(keyOf));
    const created = [];
    const duplicates = [];
    const invalid = [];

    for (const raw of points) {
      const station = num(raw.station, NaN);
      const elevation = raw.elevation != null ? num(raw.elevation, NaN) : null;
      if (!Number.isFinite(station)) {
        invalid.push(raw);
        continue;
      }
      if (elevation != null && !Number.isFinite(elevation)) {
        invalid.push(raw);
        continue;
      }
      const row = {
        alignment_id,
        station,
        offset: num(raw.offset),
        northing: raw.northing != null ? num(raw.northing) : null,
        easting: raw.easting != null ? num(raw.easting) : null,
        elevation,
        point_code: raw.point_code || null,
        description: raw.description || null,
      };
      const k = keyOf(row);
      if (seen.has(k)) {
        duplicates.push(row);
        continue;
      }
      seen.add(k);
      created.push(row);
    }

    const inserted = created.length ? await db.survey_points.bulkCreate(created) : [];
    res.json({
      success: true,
      data: {
        inserted: inserted.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
        rows: inserted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const groundCrud = makeCrud(db.ground_profiles, {
  order: [["station", "ASC"]],
  filterWhere: (q) => (q.alignment_id ? { alignment_id: q.alignment_id } : {}),
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    station: num(body.station),
    ground_elevation: num(body.ground_elevation),
  }),
});
exports.listGroundProfiles = groundCrud.findAll;
exports.createGroundProfile = groundCrud.create;
exports.updateGroundProfile = groundCrud.update;
exports.deleteGroundProfile = groundCrud.delete;

const vaCrud = makeCrud(db.vertical_alignments, {
  include: [{ model: db.alignments, as: "alignment", attributes: ["id", "name", "project_id"] }],
  order: [["id", "ASC"]],
  filterWhere: (q) => (q.alignment_id ? { alignment_id: q.alignment_id } : {}),
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    name: body.name,
    design_speed: body.design_speed != null ? num(body.design_speed) : null,
    min_grade: body.min_grade != null ? num(body.min_grade) : null,
    max_grade: body.max_grade != null ? num(body.max_grade) : null,
  }),
});
exports.listVerticalAlignments = vaCrud.findAll;
exports.getVerticalAlignment = vaCrud.findOne;
exports.createVerticalAlignment = vaCrud.create;
exports.updateVerticalAlignment = vaCrud.update;
exports.deleteVerticalAlignment = vaCrud.delete;

function recalculateGrades(pis) {
  const sorted = [...pis].sort((a, b) => num(a.station) - num(b.station));
  return sorted.map((pi, i) => {
    const grade_in =
      i === 0
        ? 0
        : (num(pi.elevation) - num(sorted[i - 1].elevation)) /
          Math.max(0.001, num(pi.station) - num(sorted[i - 1].station));
    const grade_out =
      i === sorted.length - 1
        ? grade_in
        : (num(sorted[i + 1].elevation) - num(pi.elevation)) /
          Math.max(0.001, num(sorted[i + 1].station) - num(pi.station));
    return {
      ...pi,
      grade_in: Number(grade_in.toFixed(6)),
      grade_out: Number(grade_out.toFixed(6)),
      sort_order: i,
    };
  });
}

function sampleDesignProfile(pis, step = 25) {
  const sorted = [...pis].sort((a, b) => num(a.station) - num(b.station));
  if (sorted.length < 2) return [];
  const start = num(sorted[0].station);
  const end = num(sorted[sorted.length - 1].station);
  const points = [];
  for (let s = start; s <= end + 0.001; s += step) {
    let elev = num(sorted[0].elevation);
    let grade = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (s >= num(a.station) && s <= num(b.station)) {
        const t = (s - num(a.station)) / Math.max(0.001, num(b.station) - num(a.station));
        const L = num(a.curve_length);
        if (L > 0 && Math.abs(num(a.grade_in) - num(a.grade_out)) > 1e-6) {
          // Simple parabolic approximation near PI
          const g1 = num(a.grade_in);
          const g2 = num(a.grade_out);
          elev = num(a.elevation) + g1 * (s - num(a.station)) + ((g2 - g1) / (2 * L)) * Math.pow(s - num(a.station), 2);
        } else {
          elev = num(a.elevation) + t * (num(b.elevation) - num(a.elevation));
        }
        grade = (num(b.elevation) - num(a.elevation)) / Math.max(0.001, num(b.station) - num(a.station));
        break;
      }
    }
    points.push({
      station: Number(s.toFixed(3)),
      design_elevation: Number(elev.toFixed(3)),
      grade: Number(grade.toFixed(6)),
    });
  }
  return points;
}

const piCrud = makeCrud(db.vertical_pis, {
  order: [["station", "ASC"]],
  filterWhere: (q) => (q.vertical_alignment_id ? { vertical_alignment_id: q.vertical_alignment_id } : {}),
  buildPayload: (body) => ({
    vertical_alignment_id: body.vertical_alignment_id,
    station: num(body.station),
    elevation: num(body.elevation),
    curve_type: body.curve_type || "parabola",
    curve_length: num(body.curve_length),
    curve_radius: body.curve_radius != null ? num(body.curve_radius) : null,
    grade_in: body.grade_in != null ? num(body.grade_in) : null,
    grade_out: body.grade_out != null ? num(body.grade_out) : null,
    sort_order: body.sort_order != null ? num(body.sort_order) : 0,
  }),
});
exports.listVerticalPis = piCrud.findAll;
exports.createVerticalPi = piCrud.create;
exports.updateVerticalPi = piCrud.update;
exports.deleteVerticalPi = piCrud.delete;

exports.recalculateVertical = async (req, res) => {
  try {
    const vaId = req.params.id;
    const va = await db.vertical_alignments.findByPk(vaId);
    if (!va) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const pis = await db.vertical_pis.findAll({ where: { vertical_alignment_id: vaId }, raw: true });
    const updated = recalculateGrades(pis);
    for (const pi of updated) {
      await db.vertical_pis.update(
        {
          grade_in: pi.grade_in,
          grade_out: pi.grade_out,
          sort_order: pi.sort_order,
        },
        { where: { id: pi.id } },
      );
    }
    const design = sampleDesignProfile(updated, num(req.body?.step, 25));
    await db.design_profile_points.destroy({ where: { vertical_alignment_id: vaId } });
    if (design.length) {
      await db.design_profile_points.bulkCreate(
        design.map((p) => ({ ...p, vertical_alignment_id: vaId })),
      );
    }
    const freshPis = await db.vertical_pis.findAll({
      where: { vertical_alignment_id: vaId },
      order: [["station", "ASC"]],
    });
    const designPoints = await db.design_profile_points.findAll({
      where: { vertical_alignment_id: vaId },
      order: [["station", "ASC"]],
    });
    res.json({ success: true, data: { pis: freshPis, designPoints } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfileChart = async (req, res) => {
  try {
    const vaId = req.params.id;
    const va = await db.vertical_alignments.findByPk(vaId);
    if (!va) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const [pis, designPoints, ground] = await Promise.all([
      db.vertical_pis.findAll({ where: { vertical_alignment_id: vaId }, order: [["station", "ASC"]] }),
      db.design_profile_points.findAll({
        where: { vertical_alignment_id: vaId },
        order: [["station", "ASC"]],
      }),
      db.ground_profiles.findAll({
        where: { alignment_id: va.alignment_id },
        order: [["station", "ASC"]],
      }),
    ]);

    const groundMap = new Map(ground.map((g) => [Number(g.station), num(g.ground_elevation)]));
    const series = designPoints.map((d) => {
      const st = num(d.station);
      let gElev = groundMap.get(st);
      if (gElev == null && ground.length) {
        // linear interpolate ground
        let lo = ground[0];
        let hi = ground[ground.length - 1];
        for (let i = 0; i < ground.length - 1; i++) {
          if (st >= num(ground[i].station) && st <= num(ground[i + 1].station)) {
            lo = ground[i];
            hi = ground[i + 1];
            break;
          }
        }
        const t =
          (st - num(lo.station)) / Math.max(0.001, num(hi.station) - num(lo.station));
        gElev = num(lo.ground_elevation) + t * (num(hi.ground_elevation) - num(lo.ground_elevation));
      }
      const design = num(d.design_elevation);
      const cut = Math.max(0, (gElev ?? design) - design);
      const fill = Math.max(0, design - (gElev ?? design));
      return {
        station: st,
        ground_elevation: gElev != null ? Number(gElev.toFixed(3)) : null,
        design_elevation: design,
        cut: Number(cut.toFixed(3)),
        fill: Number(fill.toFixed(3)),
        grade: d.grade != null ? num(d.grade) : null,
      };
    });

    res.json({ success: true, data: { verticalAlignment: va, pis, series, ground } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const designCrud = makeCrud(db.design_profile_points, {
  order: [["station", "ASC"]],
  filterWhere: (q) => (q.vertical_alignment_id ? { vertical_alignment_id: q.vertical_alignment_id } : {}),
  buildPayload: (body) => ({
    vertical_alignment_id: body.vertical_alignment_id,
    station: num(body.station),
    design_elevation: num(body.design_elevation),
    grade: body.grade != null ? num(body.grade) : null,
  }),
});
exports.listDesignPoints = designCrud.findAll;
exports.createDesignPoint = designCrud.create;
exports.updateDesignPoint = designCrud.update;
exports.deleteDesignPoint = designCrud.delete;

const xsCrud = makeCrud(db.cross_sections, {
  order: [["station", "ASC"]],
  filterWhere: (q) => (q.alignment_id ? { alignment_id: q.alignment_id } : {}),
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    station: num(body.station),
    road_width: num(body.road_width),
    lane_count: num(body.lane_count, 2),
    shoulder_width: num(body.shoulder_width),
    median_width: num(body.median_width),
    left_slope: body.left_slope != null ? num(body.left_slope) : null,
    right_slope: body.right_slope != null ? num(body.right_slope) : null,
  }),
});
exports.listCrossSections = xsCrud.findAll;
exports.createCrossSection = xsCrud.create;
exports.updateCrossSection = xsCrud.update;
exports.deleteCrossSection = xsCrud.delete;

exports.generateCrossSections = async (req, res) => {
  try {
    const { alignment_id, interval = 25, road_width = 7.5, lane_count = 2, shoulder_width = 1.5 } = req.body;
    const alignment = await db.alignments.findByPk(alignment_id);
    if (!alignment) return res.status(404).json({ success: false, message: "Alignment олдсонгүй" });
    const start = num(alignment.start_station);
    const end = num(alignment.end_station) || start + num(alignment.length);
    const step = Math.max(5, num(interval, 25));
    const rows = [];
    for (let s = start; s <= end + 0.001; s += step) {
      rows.push({
        alignment_id,
        station: Number(s.toFixed(3)),
        road_width: num(road_width),
        lane_count: num(lane_count, 2),
        shoulder_width: num(shoulder_width),
        median_width: 0,
        left_slope: -2,
        right_slope: -2,
      });
    }
    await db.cross_sections.destroy({ where: { alignment_id } });
    const created = await db.cross_sections.bulkCreate(rows);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const ewCrud = makeCrud(db.earthworks, {
  order: [["station", "ASC"]],
  filterWhere: (q) => (q.alignment_id ? { alignment_id: q.alignment_id } : {}),
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    station: num(body.station),
    ground_elevation: num(body.ground_elevation),
    design_elevation: num(body.design_elevation),
    cut_depth: num(body.cut_depth),
    fill_depth: num(body.fill_depth),
    cut_area: num(body.cut_area),
    fill_area: num(body.fill_area),
    cut_volume: num(body.cut_volume),
    fill_volume: num(body.fill_volume),
  }),
});
exports.listEarthworks = ewCrud.findAll;
exports.createEarthwork = ewCrud.create;
exports.updateEarthwork = ewCrud.update;
exports.deleteEarthwork = ewCrud.delete;

exports.calculateEarthwork = async (req, res) => {
  try {
    const { alignment_id, interval = 25, road_width = 7.5 } = req.body;
    const alignment = await db.alignments.findByPk(alignment_id);
    if (!alignment) return res.status(404).json({ success: false, message: "Alignment олдсонгүй" });

    const va = await db.vertical_alignments.findOne({ where: { alignment_id } });
    if (!va) return res.status(400).json({ success: false, message: "Босоо тэнхлэг байхгүй" });

    let design = await db.design_profile_points.findAll({
      where: { vertical_alignment_id: va.id },
      order: [["station", "ASC"]],
      raw: true,
    });
    if (!design.length) {
      const pis = await db.vertical_pis.findAll({
        where: { vertical_alignment_id: va.id },
        order: [["station", "ASC"]],
        raw: true,
      });
      design = sampleDesignProfile(recalculateGrades(pis), num(interval, 25));
    }
    const ground = await db.ground_profiles.findAll({
      where: { alignment_id },
      order: [["station", "ASC"]],
      raw: true,
    });

    const width = num(road_width, 7.5);
    const rows = [];
    let prev = null;
    for (const d of design) {
      const st = num(d.station);
      let gElev = null;
      if (ground.length) {
        let lo = ground[0];
        let hi = ground[ground.length - 1];
        for (let i = 0; i < ground.length - 1; i++) {
          if (st >= num(ground[i].station) && st <= num(ground[i + 1].station)) {
            lo = ground[i];
            hi = ground[i + 1];
            break;
          }
        }
        const t = (st - num(lo.station)) / Math.max(0.001, num(hi.station) - num(lo.station));
        gElev = num(lo.ground_elevation) + t * (num(hi.ground_elevation) - num(lo.ground_elevation));
      } else {
        gElev = num(d.design_elevation) + (Math.sin(st / 80) * 1.2);
      }
      const designElev = num(d.design_elevation);
      const cut_depth = Math.max(0, gElev - designElev);
      const fill_depth = Math.max(0, designElev - gElev);
      const cut_area = cut_depth * width;
      const fill_area = fill_depth * width;
      let cut_volume = 0;
      let fill_volume = 0;
      if (prev) {
        const ds = Math.max(0, st - prev.station);
        cut_volume = ((prev.cut_area + cut_area) / 2) * ds;
        fill_volume = ((prev.fill_area + fill_area) / 2) * ds;
      }
      const row = {
        alignment_id,
        station: st,
        ground_elevation: Number(gElev.toFixed(3)),
        design_elevation: designElev,
        cut_depth: Number(cut_depth.toFixed(3)),
        fill_depth: Number(fill_depth.toFixed(3)),
        cut_area: Number(cut_area.toFixed(3)),
        fill_area: Number(fill_area.toFixed(3)),
        cut_volume: Number(cut_volume.toFixed(3)),
        fill_volume: Number(fill_volume.toFixed(3)),
      };
      rows.push(row);
      prev = row;
    }

    await db.earthworks.destroy({ where: { alignment_id } });
    const created = await db.earthworks.bulkCreate(rows);
    const totalCut = rows.reduce((s, r) => s + r.cut_volume, 0);
    const totalFill = rows.reduce((s, r) => s + r.fill_volume, 0);
    res.json({
      success: true,
      data: {
        rows: created,
        summary: {
          total_cut: Number(totalCut.toFixed(3)),
          total_fill: Number(totalFill.toFixed(3)),
          net_volume: Number((totalCut - totalFill).toFixed(3)),
          borrow: Number(Math.max(0, totalFill - totalCut).toFixed(3)),
          waste: Number(Math.max(0, totalCut - totalFill).toFixed(3)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.earthworkSummary = async (req, res) => {
  try {
    const where = req.query.alignment_id ? { alignment_id: req.query.alignment_id } : {};
    const rows = await db.earthworks.findAll({ where, order: [["station", "ASC"]] });
    const totalCut = rows.reduce((s, r) => s + num(r.cut_volume), 0);
    const totalFill = rows.reduce((s, r) => s + num(r.fill_volume), 0);
    res.json({
      success: true,
      data: {
        rows,
        summary: {
          total_cut: Number(totalCut.toFixed(3)),
          total_fill: Number(totalFill.toFixed(3)),
          net_volume: Number((totalCut - totalFill).toFixed(3)),
          borrow: Number(Math.max(0, totalFill - totalCut).toFixed(3)),
          waste: Number(Math.max(0, totalCut - totalFill).toFixed(3)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function simpleCrud(Model, opts) {
  return makeCrud(Model, opts);
}

const typicalCrud = simpleCrud(db.typical_sections, {
  filterWhere: (q) => (q.project_id ? { project_id: q.project_id } : {}),
  buildPayload: (body) => ({
    project_id: body.project_id,
    name: body.name,
    template_key: body.template_key,
    road_width: num(body.road_width),
    lane_width: num(body.lane_width),
    lane_count: num(body.lane_count, 2),
    shoulder_width: num(body.shoulder_width),
    side_slope: body.side_slope != null ? num(body.side_slope) : null,
    ditch_width: num(body.ditch_width),
    remarks: body.remarks,
  }),
});
exports.listTypicalSections = typicalCrud.findAll;
exports.createTypicalSection = typicalCrud.create;
exports.updateTypicalSection = typicalCrud.update;
exports.deleteTypicalSection = typicalCrud.delete;

const drainageCrud = simpleCrud(db.drainages, {
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.type) where.type = q.type;
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id,
    type: body.type,
    station: body.station != null ? num(body.station) : null,
    length: body.length != null ? num(body.length) : null,
    diameter: body.diameter != null ? num(body.diameter) : null,
    material: body.material,
    remarks: body.remarks,
  }),
});
exports.listDrainages = drainageCrud.findAll;
exports.createDrainage = drainageCrud.create;
exports.updateDrainage = drainageCrud.update;
exports.deleteDrainage = drainageCrud.delete;

const structureCrud = simpleCrud(db.road_structures, {
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.type) where.type = q.type;
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id,
    type: body.type,
    station: body.station != null ? num(body.station) : null,
    length: body.length != null ? num(body.length) : null,
    width: body.width != null ? num(body.width) : null,
    remarks: body.remarks,
  }),
});
exports.listStructures = structureCrud.findAll;
exports.createStructure = structureCrud.create;
exports.updateStructure = structureCrud.update;
exports.deleteStructure = structureCrud.delete;

const horizCrud = simpleCrud(db.horizontal_elements, {
  order: [["sort_order", "ASC"], ["start_station", "ASC"]],
  filterWhere: (q) => (q.alignment_id ? { alignment_id: q.alignment_id } : {}),
  buildPayload: (body) => ({
    alignment_id: body.alignment_id,
    element_type: body.element_type,
    start_station: num(body.start_station),
    end_station: body.end_station != null ? num(body.end_station) : null,
    length: body.length != null ? num(body.length) : null,
    radius: body.radius != null ? num(body.radius) : null,
    spiral_param: body.spiral_param != null ? num(body.spiral_param) : null,
    bearing: body.bearing != null ? num(body.bearing) : null,
    azimuth: body.azimuth != null ? num(body.azimuth) : null,
    northing: body.northing != null ? num(body.northing) : null,
    easting: body.easting != null ? num(body.easting) : null,
    remarks: body.remarks,
    sort_order: body.sort_order != null ? num(body.sort_order) : 0,
  }),
});
exports.listHorizontalElements = horizCrud.findAll;
exports.createHorizontalElement = horizCrud.create;
exports.updateHorizontalElement = horizCrud.update;
exports.deleteHorizontalElement = horizCrud.delete;

const pavementCrud = simpleCrud(db.pavements, {
  filterWhere: (q) => (q.project_id ? { project_id: q.project_id } : {}),
  buildPayload: (body) => ({
    project_id: body.project_id,
    station_from: body.station_from != null ? num(body.station_from) : null,
    station_to: body.station_to != null ? num(body.station_to) : null,
    layer_name: body.layer_name,
    thickness_mm: body.thickness_mm != null ? num(body.thickness_mm) : null,
    material: body.material,
    width: body.width != null ? num(body.width) : null,
    remarks: body.remarks,
  }),
});
exports.listPavements = pavementCrud.findAll;
exports.createPavement = pavementCrud.create;
exports.updatePavement = pavementCrud.update;
exports.deletePavement = pavementCrud.delete;

const qtyCrud = simpleCrud(db.quantity_items, {
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q.q}%` } },
        { description: { [Op.iLike]: `%${q.q}%` } },
      ];
    }
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id,
    code: body.code,
    description: body.description,
    unit: body.unit,
    quantity: num(body.quantity),
    unit_price: num(body.unit_price),
    category: body.category,
    remarks: body.remarks,
  }),
});
exports.listQuantityItems = qtyCrud.findAll;
exports.createQuantityItem = qtyCrud.create;
exports.updateQuantityItem = qtyCrud.update;
exports.deleteQuantityItem = qtyCrud.delete;

const drawingCrud = simpleCrud(db.road_drawings, {
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    if (q.drawing_type) where.drawing_type = q.drawing_type;
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id,
    drawing_type: body.drawing_type,
    title: body.title,
    sheet_no: body.sheet_no,
    status: body.status || "draft",
    file_url: body.file_url,
    remarks: body.remarks,
  }),
});
exports.listDrawings = drawingCrud.findAll;
exports.createDrawing = drawingCrud.create;
exports.updateDrawing = drawingCrud.update;
exports.deleteDrawing = drawingCrud.delete;

const settingsCrud = simpleCrud(db.road_settings, {
  filterWhere: (q) => {
    const where = {};
    if (q.project_id) where.project_id = q.project_id;
    return where;
  },
  buildPayload: (body) => ({
    project_id: body.project_id || null,
    setting_key: body.setting_key,
    setting_value: body.setting_value,
    label: body.label,
    unit: body.unit,
  }),
});
exports.listSettings = settingsCrud.findAll;
exports.createSetting = settingsCrud.create;
exports.updateSetting = settingsCrud.update;
exports.deleteSetting = settingsCrud.delete;

exports.dashboard = async (_req, res) => {
  try {
    const [
      projectCount,
      projects,
      alignments,
      surveyCount,
      xsCount,
      structureCount,
      earthRows,
    ] = await Promise.all([
      db.road_projects.count(),
      db.road_projects.findAll({ order: [["updatedAt", "DESC"]], limit: 8 }),
      db.alignments.findAll(),
      db.survey_points.count(),
      db.cross_sections.count(),
      db.road_structures.count(),
      db.earthworks.findAll({ attributes: ["cut_volume", "fill_volume"] }),
    ]);

    const roadLength = alignments.reduce((s, a) => s + num(a.length), 0);
    const totalCut = earthRows.reduce((s, r) => s + num(r.cut_volume), 0);
    const totalFill = earthRows.reduce((s, r) => s + num(r.fill_volume), 0);

    const byStatus = {};
    for (const p of await db.road_projects.findAll({ attributes: ["status", "length"] })) {
      const st = p.status || "draft";
      if (!byStatus[st]) byStatus[st] = { status: st, count: 0, length: 0 };
      byStatus[st].count += 1;
      byStatus[st].length += num(p.length);
    }

    res.json({
      success: true,
      data: {
        cards: {
          projects: projectCount,
          road_length: Number(roadLength.toFixed(3)),
          earthwork_cut: Number(totalCut.toFixed(3)),
          earthwork_fill: Number(totalFill.toFixed(3)),
          structures: structureCount,
          cross_sections: xsCount,
          survey_points: surveyCount,
        },
        recent_projects: projects,
        charts: {
          progress: projects.map((p) => ({
            name: p.code,
            progress: num(p.progress),
          })),
          earthwork_balance: [
            { name: "Cut", value: Number(totalCut.toFixed(1)) },
            { name: "Fill", value: Number(totalFill.toFixed(1)) },
          ],
          length_by_status: Object.values(byStatus),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reports = async (req, res) => {
  try {
    const type = req.params.type;
    const projectId = req.query.project_id;
    const alignmentId = req.query.alignment_id;

    if (type === "road-summary") {
      const projects = await db.road_projects.findAll({
        where: projectId ? { id: projectId } : {},
        include: [{ model: db.alignments, as: "alignments" }],
      });
      return res.json({ success: true, data: projects });
    }
    if (type === "earthwork-summary") {
      return exports.earthworkSummary(req, res);
    }
    if (type === "alignment") {
      const rows = await db.alignments.findAll({
        where: projectId ? { project_id: projectId } : {},
        include: [{ model: db.horizontal_elements, as: "horizontalElements" }],
      });
      return res.json({ success: true, data: rows });
    }
    if (type === "pi") {
      let where = {};
      if (alignmentId) {
        const vas = await db.vertical_alignments.findAll({ where: { alignment_id: alignmentId } });
        const ids = vas.map((v) => v.id);
        if (!ids.length) return res.json({ success: true, data: [] });
        where = { vertical_alignment_id: ids };
      }
      const pis = await db.vertical_pis.findAll({
        where,
        order: [["station", "ASC"]],
      });
      return res.json({ success: true, data: pis });
    }
    if (type === "cross-section") {
      const rows = await db.cross_sections.findAll({
        where: alignmentId ? { alignment_id: alignmentId } : {},
        order: [["station", "ASC"]],
      });
      return res.json({ success: true, data: rows });
    }
    if (type === "drainage") {
      const rows = await db.drainages.findAll({ where: projectId ? { project_id: projectId } : {} });
      return res.json({ success: true, data: rows });
    }
    if (type === "structure") {
      const rows = await db.road_structures.findAll({ where: projectId ? { project_id: projectId } : {} });
      return res.json({ success: true, data: rows });
    }
    if (type === "boq") {
      const rows = await db.quantity_items.findAll({ where: projectId ? { project_id: projectId } : {} });
      const total = rows.reduce((s, r) => s + num(r.quantity) * num(r.unit_price), 0);
      return res.json({ success: true, data: { rows, total: Number(total.toFixed(2)) } });
    }
    res.status(400).json({ success: false, message: "Тайлангийн төрөл буруу" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
