const db = require("../models");

function num(v) {
  return Number(v);
}

async function seedRoadEngineering() {
  const existing = await db.road_projects.count();
  if (existing > 0) return { skipped: true, count: existing };

  const project = await db.road_projects.create({
    code: "RE-2026-001",
    name: "Улаанбаатар — Налайх замын засвар",
    road_class: "II",
    description: "Хатуу хучилттай замын инженерийн зураг төсөл, шорооны ажил",
    province: "Улаанбаатар",
    district: "Баянзүрх",
    start_station: 0,
    end_station: 5200,
    length: 5200,
    status: "design",
    progress: 42,
    designer: "Инженеринг ХХК",
    contractor: "Замчин ХХК",
    consultant: "Консалт групп",
    start_date: "2026-03-01",
    end_date: "2026-11-30",
  });

  const project2 = await db.road_projects.create({
    code: "RE-2026-002",
    name: "Дархан — Эрдэнэт холбоос",
    road_class: "I",
    description: "Шинэ 4 эгнээт хурдны зам",
    province: "Дархан-Уул",
    district: "Дархан",
    start_station: 0,
    end_station: 12500,
    length: 12500,
    status: "survey",
    progress: 18,
    designer: "Автозам төсөл",
    contractor: "—",
    consultant: "Төслийн нэгж",
    start_date: "2026-05-01",
    end_date: "2027-10-01",
  });

  const al = await db.alignments.create({
    project_id: project.id,
    name: "CL-01 Centerline",
    type: "CENTERLINE",
    length: 5200,
    start_station: 0,
    end_station: 5200,
  });

  await db.alignments.create({
    project_id: project.id,
    name: "EL-Left Edge",
    type: "LEFT",
    length: 5200,
    start_station: 0,
    end_station: 5200,
  });

  await db.alignments.create({
    project_id: project2.id,
    name: "CL-Main",
    type: "CENTERLINE",
    length: 12500,
    start_station: 0,
    end_station: 12500,
  });

  // Horizontal elements
  const horiz = [
    { element_type: "tangent", start_station: 0, end_station: 800, length: 800, bearing: 45.2, azimuth: 45.2, northing: 5301000, easting: 545200, sort_order: 1 },
    { element_type: "spiral", start_station: 800, end_station: 950, length: 150, spiral_param: 80, radius: 450, bearing: 48.1, azimuth: 48.1, sort_order: 2 },
    { element_type: "curve", start_station: 950, end_station: 1450, length: 500, radius: 450, bearing: 62.5, azimuth: 62.5, sort_order: 3 },
    { element_type: "spiral", start_station: 1450, end_station: 1600, length: 150, spiral_param: 80, radius: 450, bearing: 75.0, azimuth: 75.0, sort_order: 4 },
    { element_type: "tangent", start_station: 1600, end_station: 5200, length: 3600, bearing: 78.4, azimuth: 78.4, sort_order: 5 },
  ];
  await db.horizontal_elements.bulkCreate(horiz.map((h) => ({ ...h, alignment_id: al.id })));

  // Survey + ground
  const survey = [];
  const ground = [];
  for (let s = 0; s <= 5200; s += 50) {
    const elev = 1320 + Math.sin(s / 400) * 8 + (s / 5200) * 12;
    survey.push({
      alignment_id: al.id,
      station: s,
      offset: 0,
      northing: 5301000 + s * 0.72,
      easting: 545200 + s * 0.68,
      elevation: Number(elev.toFixed(3)),
      point_code: `SP-${String(s).padStart(4, "0")}`,
      description: "Газрын цэг",
    });
    ground.push({
      alignment_id: al.id,
      station: s,
      ground_elevation: Number(elev.toFixed(3)),
    });
  }
  await db.survey_points.bulkCreate(survey);
  await db.ground_profiles.bulkCreate(ground);

  const va = await db.vertical_alignments.create({
    alignment_id: al.id,
    name: "VA-Main Profile",
    design_speed: 80,
    min_grade: -0.04,
    max_grade: 0.05,
  });

  const pisRaw = [
    { station: 0, elevation: 1322, curve_length: 0 },
    { station: 1200, elevation: 1335, curve_length: 120 },
    { station: 2800, elevation: 1328, curve_length: 160 },
    { station: 4000, elevation: 1342, curve_length: 140 },
    { station: 5200, elevation: 1338, curve_length: 0 },
  ];
  const pis = pisRaw.map((p, i, arr) => {
    const grade_in =
      i === 0 ? 0 : (p.elevation - arr[i - 1].elevation) / Math.max(1, p.station - arr[i - 1].station);
    const grade_out =
      i === arr.length - 1
        ? grade_in
        : (arr[i + 1].elevation - p.elevation) / Math.max(1, arr[i + 1].station - p.station);
    return {
      vertical_alignment_id: va.id,
      station: p.station,
      elevation: p.elevation,
      curve_type: "parabola",
      curve_length: p.curve_length,
      curve_radius: p.curve_length ? 2500 : null,
      grade_in: Number(grade_in.toFixed(6)),
      grade_out: Number(grade_out.toFixed(6)),
      sort_order: i,
    };
  });
  await db.vertical_pis.bulkCreate(pis);

  const design = [];
  for (let s = 0; s <= 5200; s += 25) {
    let elev = pis[0].elevation;
    let grade = 0;
    for (let i = 0; i < pis.length - 1; i++) {
      if (s >= pis[i].station && s <= pis[i + 1].station) {
        const t = (s - pis[i].station) / Math.max(1, pis[i + 1].station - pis[i].station);
        elev = pis[i].elevation + t * (pis[i + 1].elevation - pis[i].elevation);
        grade = (pis[i + 1].elevation - pis[i].elevation) / Math.max(1, pis[i + 1].station - pis[i].station);
        break;
      }
    }
    design.push({
      vertical_alignment_id: va.id,
      station: s,
      design_elevation: Number(elev.toFixed(3)),
      grade: Number(grade.toFixed(6)),
    });
  }
  await db.design_profile_points.bulkCreate(design);

  const xs = [];
  for (let s = 0; s <= 5200; s += 50) {
    xs.push({
      alignment_id: al.id,
      station: s,
      road_width: 7.5,
      lane_count: 2,
      shoulder_width: 1.5,
      median_width: 0,
      left_slope: -2,
      right_slope: -2,
    });
  }
  await db.cross_sections.bulkCreate(xs);

  // Earthwork from ground vs design
  const ew = [];
  let prev = null;
  for (const d of design) {
    const g = ground.find((x) => x.station === d.station) ||
      ground.reduce((a, b) => (Math.abs(b.station - d.station) < Math.abs(a.station - d.station) ? b : a));
    const gElev = g.ground_elevation;
    const cut_depth = Math.max(0, gElev - d.design_elevation);
    const fill_depth = Math.max(0, d.design_elevation - gElev);
    const cut_area = cut_depth * 7.5;
    const fill_area = fill_depth * 7.5;
    let cut_volume = 0;
    let fill_volume = 0;
    if (prev) {
      const ds = d.station - prev.station;
      cut_volume = ((prev.cut_area + cut_area) / 2) * ds;
      fill_volume = ((prev.fill_area + fill_area) / 2) * ds;
    }
    const row = {
      alignment_id: al.id,
      station: d.station,
      ground_elevation: gElev,
      design_elevation: d.design_elevation,
      cut_depth: Number(cut_depth.toFixed(3)),
      fill_depth: Number(fill_depth.toFixed(3)),
      cut_area: Number(cut_area.toFixed(3)),
      fill_area: Number(fill_area.toFixed(3)),
      cut_volume: Number(cut_volume.toFixed(3)),
      fill_volume: Number(fill_volume.toFixed(3)),
    };
    ew.push(row);
    prev = row;
  }
  await db.earthworks.bulkCreate(ew);

  await db.typical_sections.bulkCreate([
    { project_id: project.id, name: "2 эгнээ стандарт", template_key: "2lane", road_width: 7.5, lane_width: 3.5, lane_count: 2, shoulder_width: 1.5, side_slope: 1.5, ditch_width: 1.0, remarks: "Хөдөөгийн зам" },
    { project_id: project.id, name: "4 эгнээ", template_key: "4lane", road_width: 15, lane_width: 3.5, lane_count: 4, shoulder_width: 2.5, side_slope: 1.5, ditch_width: 1.2, remarks: "Хот орчим" },
    { project_id: project.id, name: "Уулын зам", template_key: "mountain", road_width: 6.5, lane_width: 3.0, lane_count: 2, shoulder_width: 0.75, side_slope: 1.0, ditch_width: 0.8, remarks: "Нарийн хэсэг" },
    { project_id: project.id, name: "Хурдны зам", template_key: "expressway", road_width: 22, lane_width: 3.75, lane_count: 4, shoulder_width: 3.0, side_slope: 2.0, ditch_width: 1.5, remarks: "Expressway" },
  ]);

  await db.drainages.bulkCreate([
    { project_id: project.id, type: "culvert", station: 850, length: 18, diameter: 1.2, material: "Төмөр бетон", remarks: "Гол шуудуу" },
    { project_id: project.id, type: "pipe", station: 2100, length: 25, diameter: 0.8, material: "HDPE", remarks: "" },
    { project_id: project.id, type: "ditch", station: 0, length: 5200, diameter: null, material: "Шороон", remarks: "Зүүн хажуу" },
    { project_id: project.id, type: "bridge_drain", station: 3200, length: 12, diameter: 0.4, material: "Ган", remarks: "Гүүрэн дээр" },
  ]);

  await db.road_structures.bulkCreate([
    { project_id: project.id, type: "bridge", station: 3180, length: 45, width: 12, remarks: "Голын гүүр" },
    { project_id: project.id, type: "box_culvert", station: 860, length: 18, width: 3, remarks: "2×2м" },
    { project_id: project.id, type: "retaining_wall", station: 4100, length: 120, width: 0.4, remarks: "Зүүн хажуу" },
    { project_id: project.id, type: "underpass", station: 2400, length: 25, width: 6, remarks: "Мал гаргах" },
  ]);

  await db.pavements.bulkCreate([
    { project_id: project.id, station_from: 0, station_to: 5200, layer_name: "Asphalt wearing", thickness_mm: 50, material: "AC-16", width: 7.5 },
    { project_id: project.id, station_from: 0, station_to: 5200, layer_name: "Binder", thickness_mm: 60, material: "AC-20", width: 7.5 },
    { project_id: project.id, station_from: 0, station_to: 5200, layer_name: "Base", thickness_mm: 200, material: "Буталсан чулуу", width: 8.5 },
    { project_id: project.id, station_from: 0, station_to: 5200, layer_name: "Subbase", thickness_mm: 250, material: "Элс хайрга", width: 9.0 },
  ]);

  await db.quantity_items.bulkCreate([
    { project_id: project.id, code: "EW-CUT", description: "Ухалт (cut)", unit: "м³", quantity: ew.reduce((s, r) => s + r.cut_volume, 0), unit_price: 8500, category: "earthwork" },
    { project_id: project.id, code: "EW-FILL", description: "Дүүргэлт (fill)", unit: "м³", quantity: ew.reduce((s, r) => s + r.fill_volume, 0), unit_price: 7200, category: "earthwork" },
    { project_id: project.id, code: "PV-ASP", description: "Асфальт хучилт", unit: "м²", quantity: 5200 * 7.5, unit_price: 45000, category: "pavement" },
    { project_id: project.id, code: "DR-CUL", description: "Хоолой / culvert", unit: "ш", quantity: 2, unit_price: 12500000, category: "drainage" },
    { project_id: project.id, code: "ST-BR", description: "Гүүр", unit: "м", quantity: 45, unit_price: 8500000, category: "structure" },
  ]);

  await db.road_drawings.bulkCreate([
    { project_id: project.id, drawing_type: "longitudinal_profile", title: "Уртрагийн профиль", sheet_no: "PL-01", status: "approved" },
    { project_id: project.id, drawing_type: "cross_section", title: "Хөндлөн огтлол", sheet_no: "XS-01", status: "draft" },
    { project_id: project.id, drawing_type: "earthwork", title: "Шорооны ажил", sheet_no: "EW-01", status: "review" },
    { project_id: project.id, drawing_type: "typical_section", title: "Ердийн огтлол", sheet_no: "TS-01", status: "approved" },
  ]);

  await db.road_settings.bulkCreate([
    { project_id: null, setting_key: "default_xs_interval", setting_value: "25", label: "Хөндлөн огтлолын алхам", unit: "м" },
    { project_id: null, setting_key: "default_road_width", setting_value: "7.5", label: "Замын өргөн", unit: "м" },
    { project_id: null, setting_key: "station_format", setting_value: "0+000", label: "Станцын формат", unit: "" },
    { project_id: project.id, setting_key: "design_speed", setting_value: "80", label: "Зохион байгуулалтын хурд", unit: "км/ц" },
  ]);

  return { skipped: false, projectId: project.id, alignmentId: al.id };
}

module.exports = { seedRoadEngineering };
