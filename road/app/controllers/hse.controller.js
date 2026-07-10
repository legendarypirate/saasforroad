const db = require("../models");
const { Op } = db.Sequelize;
const { todayISO, makeCrud } = require("../utils/hseCrud");
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");
const multer = require("multer");

const User = db.users;
const Project = db.projects;
const Equipment = db.equipments;
const DailyInstruction = db.hse_daily_instructions;
const DailyAck = db.hse_daily_instruction_acks;
const ToolboxMeeting = db.hse_toolbox_meetings;
const ToolboxAttendee = db.hse_toolbox_attendees;
const Observation = db.hse_observations;
const NearMiss = db.hse_near_misses;
const Incident = db.hse_incidents;
const RiskAssessment = db.hse_risk_assessments;
const Permit = db.hse_permits;
const InspectionTemplate = db.hse_inspection_templates;
const Inspection = db.hse_inspections;
const InspectionItem = db.hse_inspection_items;
const PpeItem = db.hse_ppe_items;
const PpeAssignment = db.hse_ppe_assignments;
const Training = db.hse_trainings;
const TrainingRecord = db.hse_training_records;
const EquipmentInspection = db.hse_equipment_inspections;
const Environmental = db.hse_environmental_records;
const Capa = db.hse_capas;
const HseDocument = db.hse_documents;

const upload = memoryUpload().single("file");

const projectInc = [{ model: Project, as: "project", attributes: ["id", "name"] }];
const userInc = [{ model: User, as: "user", attributes: ["id", "username", "phone", "position"] }];

// ─── Dashboard ───────────────────────────────────────────────────────────────

exports.dashboard = async (req, res) => {
  try {
    const date = req.query.date || todayISO();
    const openStatuses = ["open", "assigned", "reported", "investigating", "action", "requested", "in_progress"];
    const [
      instructionAcks,
      totalEmployees,
      openObservations,
      nearMissCount,
      openIncidents,
      pendingCapa,
      expiredTraining,
      expiredPpe,
      upcomingInspections,
      activePermits,
    ] = await Promise.all([
      DailyAck.count({ where: { ack_date: date } }),
      User.count(),
      Observation.count({ where: { status: { [Op.in]: ["open", "assigned", "corrected"] } } }),
      NearMiss.count({ where: { status: { [Op.ne]: "closed" } } }),
      Incident.count({ where: { status: { [Op.in]: ["reported", "investigating", "action"] } } }),
      Capa.count({ where: { status: { [Op.in]: ["open", "in_progress"] } } }),
      TrainingRecord.count({
        where: { expires_at: { [Op.and]: [{ [Op.ne]: null }, { [Op.lt]: date }] } },
      }),
      PpeAssignment.count({ where: { status: "active", replacement_due_at: { [Op.lt]: date } } }),
      Inspection.count({ where: { inspected_at: { [Op.gte]: new Date() } } }),
      Permit.count({ where: { status: { [Op.in]: ["supervisor", "hse", "manager", "active"] } } }),
    ]);

    const completedToday = instructionAcks;
    const notCompleted = Math.max(0, totalEmployees - completedToday);
    const completionPct = totalEmployees > 0 ? Math.round((completedToday / totalEmployees) * 100) : 0;

    res.json({
      success: true,
      data: {
        date,
        daily_instruction: {
          total_employees: totalEmployees,
          completed_today: completedToday,
          not_completed: notCompleted,
          completion_percentage: completionPct,
        },
        widgets: {
          open_observations: openObservations,
          near_miss_count: nearMissCount,
          open_incidents: openIncidents,
          pending_corrective_actions: pendingCapa,
          expired_certificates: expiredTraining,
          expired_ppe: expiredPpe,
          upcoming_inspections: upcomingInspections,
          active_permits: activePermits,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Daily Safety Instruction ────────────────────────────────────────────────

const instructionInclude = [
  { model: Project, as: "project", attributes: ["id", "name"] },
  { model: User, as: "creator", attributes: ["id", "username"] },
];

exports.listInstructions = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.project_id) where.project_id = req.query.project_id;
    const data = await DailyInstruction.findAll({
      where,
      include: instructionInclude,
      order: [["publish_date", "DESC"], ["version", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInstruction = async (req, res) => {
  try {
    const { title, content, project_id, department, publish_date, expiry_date, status } = req.body;
    if (!title || !content || !publish_date) {
      return res.status(400).json({ success: false, message: "Гарчиг, агуулга, огноо шаардлагатай" });
    }
    const row = await DailyInstruction.create({
      title,
      content,
      version: 1,
      project_id: project_id || null,
      department: department || null,
      publish_date,
      expiry_date: expiry_date || null,
      status: status || "draft",
      created_by: req.body.created_by || null,
      updated_by: req.body.created_by || null,
    });
    const full = await DailyInstruction.findByPk(row.id, { include: instructionInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInstruction = async (req, res) => {
  try {
    const row = await DailyInstruction.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const contentChanged = req.body.content && req.body.content !== row.content;
    const updates = {
      title: req.body.title ?? row.title,
      content: req.body.content ?? row.content,
      project_id: req.body.project_id !== undefined ? req.body.project_id : row.project_id,
      department: req.body.department !== undefined ? req.body.department : row.department,
      publish_date: req.body.publish_date ?? row.publish_date,
      expiry_date: req.body.expiry_date !== undefined ? req.body.expiry_date : row.expiry_date,
      status: req.body.status ?? row.status,
      updated_by: req.body.updated_by || row.updated_by,
    };
    if (contentChanged) updates.version = row.version + 1;

    await row.update(updates);
    const full = await DailyInstruction.findByPk(row.id, { include: instructionInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInstruction = async (req, res) => {
  try {
    const num = await DailyInstruction.destroy({ where: { id: req.params.id } });
    if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTodayInstruction = async (req, res) => {
  try {
    const date = req.query.date || todayISO();
    const projectId = req.query.project_id || null;
    const where = {
      status: "published",
      publish_date: { [Op.lte]: date },
      [Op.or]: [{ expiry_date: null }, { expiry_date: { [Op.gte]: date } }],
    };
    if (projectId) {
      where[Op.and] = [{ [Op.or]: [{ project_id: null }, { project_id: projectId }] }];
    }

    const instruction = await DailyInstruction.findOne({
      where,
      include: instructionInclude,
      order: [["publish_date", "DESC"], ["version", "DESC"]],
    });

    let alreadyAcked = false;
    const userId = req.query.user_id || req.user?.id;
    if (userId) {
      const ack = await DailyAck.findOne({
        where: { user_id: userId, ack_date: date },
      });
      alreadyAcked = !!ack;
    }

    res.json({ success: true, data: { instruction, already_acked: alreadyAcked, date } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.acknowledgeInstruction = async (req, res) => {
  try {
    const user_id = req.body.user_id || req.user?.id;
    const { instruction_id, project_id, latitude, longitude, device_info, signature_url, offline_synced } =
      req.body;
    if (!user_id || !instruction_id) {
      return res.status(400).json({ success: false, message: "user_id, instruction_id шаардлагатай" });
    }

    const instruction = await DailyInstruction.findByPk(instruction_id);
    if (!instruction) return res.status(404).json({ success: false, message: "Заавар олдсонгүй" });

    const ackDate = req.body.ack_date || todayISO();
    const existing = await DailyAck.findOne({ where: { user_id, ack_date: ackDate } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Өнөөдөр аль хэдийн баталгаажуулсан байна", data: existing });
    }

    const ack = await DailyAck.create({
      instruction_id,
      user_id,
      ack_date: ackDate,
      ack_time: new Date(),
      project_id: project_id || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      device_info: device_info || null,
      signature_url: signature_url || null,
      instruction_version: instruction.version,
      offline_synced: !!offline_synced,
    });

    const full = await DailyAck.findByPk(ack.id, {
      include: [
        { model: DailyInstruction, as: "instruction" },
        { model: User, as: "user", attributes: ["id", "username"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
      ],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ success: false, message: "Өнөөдөр аль хэдийн баталгаажуулсан байна" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.instructionCompletionStatus = async (req, res) => {
  try {
    const date = req.query.date || todayISO();
    const projectId = req.query.project_id;

    const acks = await DailyAck.findAll({
      where: { ack_date: date, ...(projectId ? { project_id: projectId } : {}) },
      include: [{ model: User, as: "user", attributes: ["id", "username", "phone", "position"] }],
    });

    const ackedUserIds = new Set(acks.map((a) => a.user_id));
    const allUsers = await User.findAll({ attributes: ["id", "username", "phone", "position"] });
    const notCompleted = allUsers.filter((u) => !ackedUserIds.has(u.id));

    const byProject = {};
    for (const ack of acks) {
      const key = ack.project_id || "general";
      if (!byProject[key]) byProject[key] = { completed: 0, project_id: ack.project_id };
      byProject[key].completed += 1;
    }

    res.json({
      success: true,
      data: {
        date,
        total_employees: allUsers.length,
        completed: acks.length,
        not_completed: notCompleted.length,
        completion_percentage: allUsers.length ? Math.round((acks.length / allUsers.length) * 100) : 0,
        completed_users: acks,
        pending_users: notCompleted,
        by_project: Object.values(byProject),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listAcknowledgments = async (req, res) => {
  try {
    const where = {};
    if (req.query.date) where.ack_date = req.query.date;
    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.project_id) where.project_id = req.query.project_id;
    const data = await DailyAck.findAll({
      where,
      include: [
        { model: DailyInstruction, as: "instruction", attributes: ["id", "title", "version"] },
        { model: User, as: "user", attributes: ["id", "username"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
      ],
      order: [["ack_time", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Toolbox Meetings ────────────────────────────────────────────────────────

const toolboxInclude = [
  { model: Project, as: "project", attributes: ["id", "name"] },
  { model: User, as: "supervisor", attributes: ["id", "username"] },
  {
    model: ToolboxAttendee,
    as: "attendees",
    include: [{ model: User, as: "user", attributes: ["id", "username"] }],
  },
];

exports.listToolboxMeetings = async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = req.query.project_id;
    const data = await ToolboxMeeting.findAll({ where, include: toolboxInclude, order: [["meeting_at", "DESC"]] });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createToolboxMeeting = async (req, res) => {
  try {
    const { topic, project_id, supervisor_id, meeting_at, notes, photos, signature_url, attendee_ids } = req.body;
    if (!topic || !meeting_at) {
      return res.status(400).json({ success: false, message: "Сэдэв, огноо шаардлагатай" });
    }
    const meeting = await ToolboxMeeting.create({
      topic,
      project_id: project_id || null,
      supervisor_id: supervisor_id || null,
      meeting_at,
      notes: notes || null,
      photos: photos || null,
      signature_url: signature_url || null,
      created_by: req.body.created_by || null,
    });
    if (Array.isArray(attendee_ids)) {
      for (const uid of attendee_ids) {
        await ToolboxAttendee.create({ meeting_id: meeting.id, user_id: uid, signed_at: new Date() });
      }
    }
    const full = await ToolboxMeeting.findByPk(meeting.id, { include: toolboxInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateToolboxMeeting = async (req, res) => {
  try {
    const row = await ToolboxMeeting.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      topic: req.body.topic ?? row.topic,
      project_id: req.body.project_id !== undefined ? req.body.project_id : row.project_id,
      supervisor_id: req.body.supervisor_id !== undefined ? req.body.supervisor_id : row.supervisor_id,
      meeting_at: req.body.meeting_at ?? row.meeting_at,
      notes: req.body.notes !== undefined ? req.body.notes : row.notes,
      photos: req.body.photos !== undefined ? req.body.photos : row.photos,
      signature_url: req.body.signature_url !== undefined ? req.body.signature_url : row.signature_url,
      updated_by: req.body.updated_by || row.updated_by,
    });
    if (Array.isArray(req.body.attendee_ids)) {
      await ToolboxAttendee.destroy({ where: { meeting_id: row.id } });
      for (const uid of req.body.attendee_ids) {
        await ToolboxAttendee.create({ meeting_id: row.id, user_id: uid, signed_at: new Date() });
      }
    }
    const full = await ToolboxMeeting.findByPk(row.id, { include: toolboxInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteToolboxMeeting = async (req, res) => {
  try {
    await ToolboxAttendee.destroy({ where: { meeting_id: req.params.id } });
    const num = await ToolboxMeeting.destroy({ where: { id: req.params.id } });
    if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Generic CRUD modules ────────────────────────────────────────────────────

const observationCrud = makeCrud(Observation, {
  include: [
    ...projectInc,
    { model: User, as: "reporter", attributes: ["id", "username"] },
    { model: User, as: "responsible", attributes: ["id", "username"] },
  ],
  buildPayload: (body) => ({
    observation_type: body.observation_type || "unsafe_condition",
    description: body.description,
    photo_url: body.photo_url || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    priority: body.priority || "medium",
    project_id: body.project_id || null,
    reported_by: body.reported_by || body.created_by || null,
    responsible_user_id: body.responsible_user_id || null,
    status: body.status || "open",
    created_by: body.created_by || null,
    updated_by: body.updated_by || body.created_by || null,
  }),
  filterWhere: (q) => {
    const w = {};
    if (q.status) w.status = q.status;
    if (q.project_id) w.project_id = q.project_id;
    if (q.observation_type) w.observation_type = q.observation_type;
    return w;
  },
});

exports.listObservations = observationCrud.findAll;
exports.createObservation = observationCrud.create;
exports.getObservation = observationCrud.findOne;
exports.updateObservation = observationCrud.update;
exports.deleteObservation = observationCrud.delete;

exports.transitionObservation = async (req, res) => {
  try {
    const row = await Observation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const { status, responsible_user_id } = req.body;
    const allowed = ["open", "assigned", "corrected", "verified", "closed"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Буруу төлөв" });
    const updates = { status, updated_by: req.body.updated_by || null };
    if (status === "assigned") {
      updates.responsible_user_id = responsible_user_id || row.responsible_user_id;
      updates.assigned_at = new Date();
    }
    if (status === "corrected") updates.corrected_at = new Date();
    if (status === "verified") updates.verified_at = new Date();
    if (status === "closed") updates.closed_at = new Date();
    await row.update(updates);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const nearMissCrud = makeCrud(NearMiss, {
  include: [...projectInc, { model: User, as: "reporter", attributes: ["id", "username"] }],
  buildPayload: (body) => ({
    description: body.description,
    photos: body.photos || null,
    location: body.location || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    witness: body.witness || null,
    immediate_action: body.immediate_action || null,
    root_cause: body.root_cause || null,
    corrective_action: body.corrective_action || null,
    project_id: body.project_id || null,
    reported_by: body.reported_by || body.created_by || null,
    status: body.status || "open",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listNearMisses = nearMissCrud.findAll;
exports.createNearMiss = nearMissCrud.create;
exports.getNearMiss = nearMissCrud.findOne;
exports.updateNearMiss = nearMissCrud.update;
exports.deleteNearMiss = nearMissCrud.delete;

const incidentCrud = makeCrud(Incident, {
  include: [...projectInc, { model: User, as: "reporter", attributes: ["id", "username"] }],
  buildPayload: (body) => ({
    incident_type: body.incident_type,
    title: body.title,
    description: body.description || null,
    photos: body.photos || null,
    location: body.location || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    witnesses: body.witnesses || null,
    investigation: body.investigation || null,
    root_cause: body.root_cause || null,
    corrective_actions: body.corrective_actions || null,
    severity: body.severity || null,
    injury_details: body.injury_details || null,
    project_id: body.project_id || null,
    reported_by: body.reported_by || body.created_by || null,
    status: body.status || "reported",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listIncidents = incidentCrud.findAll;
exports.createIncident = incidentCrud.create;
exports.getIncident = incidentCrud.findOne;
exports.updateIncident = incidentCrud.update;
exports.deleteIncident = incidentCrud.delete;

exports.approveIncident = async (req, res) => {
  try {
    const row = await Incident.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      status: req.body.status || "closed",
      approved_by: req.body.approved_by || null,
      approved_at: new Date(),
      updated_by: req.body.updated_by || null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const riskCrud = makeCrud(RiskAssessment, {
  include: [...projectInc, { model: User, as: "responsible", attributes: ["id", "username"] }],
  buildPayload: (body) => ({
    project_id: body.project_id || null,
    activity: body.activity,
    hazard: body.hazard,
    risk_level: body.risk_level || null,
    likelihood: body.likelihood || null,
    severity: body.severity || null,
    control_measures: body.control_measures || null,
    responsible_user_id: body.responsible_user_id || null,
    status: body.status || "draft",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listRiskAssessments = riskCrud.findAll;
exports.createRiskAssessment = riskCrud.create;
exports.getRiskAssessment = riskCrud.findOne;
exports.updateRiskAssessment = riskCrud.update;
exports.deleteRiskAssessment = riskCrud.delete;

exports.approveRiskAssessment = async (req, res) => {
  try {
    const row = await RiskAssessment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      status: req.body.status || "approved",
      approved_by: req.body.approved_by || null,
      approved_at: new Date(),
      updated_by: req.body.updated_by || null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Permits ─────────────────────────────────────────────────────────────────

exports.listPermits = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.project_id) where.project_id = req.query.project_id;
    const data = await Permit.findAll({
      where,
      include: [...projectInc, { model: User, as: "requester", attributes: ["id", "username"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPermit = async (req, res) => {
  try {
    const row = await Permit.create({
      permit_type: req.body.permit_type,
      project_id: req.body.project_id || null,
      description: req.body.description,
      location: req.body.location || null,
      requested_by: req.body.requested_by || req.body.created_by || null,
      start_at: req.body.start_at || null,
      end_at: req.body.end_at || null,
      checklist: req.body.checklist || null,
      status: "requested",
      created_by: req.body.created_by || null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approvePermit = async (req, res) => {
  try {
    const row = await Permit.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const { stage, approver_id } = req.body;
    const flow = { supervisor: "hse", hse: "manager", manager: "active" };
    const updates = { updated_by: approver_id || null };
    if (stage === "supervisor") {
      updates.supervisor_approved_by = approver_id;
      updates.supervisor_approved_at = new Date();
      updates.status = "hse";
    } else if (stage === "hse") {
      updates.hse_approved_by = approver_id;
      updates.hse_approved_at = new Date();
      updates.status = "manager";
    } else if (stage === "manager") {
      updates.manager_approved_by = approver_id;
      updates.manager_approved_at = new Date();
      updates.status = "active";
    } else if (stage === "close") {
      updates.status = "closed";
      updates.closed_at = new Date();
    }
    await row.update(updates);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePermit = async (req, res) => {
  try {
    const row = await Permit.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update(req.body);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePermit = async (req, res) => {
  try {
    const num = await Permit.destroy({ where: { id: req.params.id } });
    if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Inspections ─────────────────────────────────────────────────────────────

const templateCrud = makeCrud(InspectionTemplate, {
  buildPayload: (body) => ({
    name: body.name,
    category: body.category,
    checklist_items: body.checklist_items || [],
    active: body.active !== false,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listInspectionTemplates = templateCrud.findAll;
exports.createInspectionTemplate = templateCrud.create;
exports.getInspectionTemplate = templateCrud.findOne;
exports.updateInspectionTemplate = templateCrud.update;
exports.deleteInspectionTemplate = templateCrud.delete;

exports.listInspections = async (req, res) => {
  try {
    const data = await Inspection.findAll({
      include: [
        { model: InspectionTemplate, as: "template", attributes: ["id", "name", "category"] },
        ...projectInc,
        { model: Equipment, as: "equipment", attributes: ["id", "name"] },
        { model: InspectionItem, as: "items" },
      ],
      order: [["inspected_at", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const inspection = await Inspection.create({
      template_id: req.body.template_id || null,
      project_id: req.body.project_id || null,
      equipment_id: req.body.equipment_id || null,
      inspected_by: req.body.inspected_by || req.body.created_by || null,
      inspected_at: req.body.inspected_at || new Date(),
      latitude: req.body.latitude ?? null,
      longitude: req.body.longitude ?? null,
      overall_result: req.body.overall_result || "pass",
      comments: req.body.comments || null,
      photos: req.body.photos || null,
      created_by: req.body.created_by || null,
    });
    if (Array.isArray(req.body.items)) {
      for (const item of req.body.items) {
        await InspectionItem.create({
          inspection_id: inspection.id,
          item_key: item.item_key,
          item_label: item.item_label,
          result: item.result || "pass",
          comment: item.comment || null,
          photo_url: item.photo_url || null,
        });
      }
    }
    const full = await Inspection.findByPk(inspection.id, {
      include: [{ model: InspectionItem, as: "items" }],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInspection = async (req, res) => {
  try {
    const row = await Inspection.findByPk(req.params.id, {
      include: [{ model: InspectionItem, as: "items" }, ...projectInc],
    });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInspection = async (req, res) => {
  try {
    await InspectionItem.destroy({ where: { inspection_id: req.params.id } });
    const num = await Inspection.destroy({ where: { id: req.params.id } });
    if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PPE, Training, Equipment Safety, Environment, CAPA, Documents ─────────

const ppeItemCrud = makeCrud(PpeItem, {
  buildPayload: (body) => ({
    name: body.name,
    category: body.category,
    sku: body.sku || null,
    stock_qty: body.stock_qty ?? 0,
    min_stock: body.min_stock ?? 0,
    expiry_months: body.expiry_months ?? null,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listPpeItems = ppeItemCrud.findAll;
exports.createPpeItem = ppeItemCrud.create;
exports.getPpeItem = ppeItemCrud.findOne;
exports.updatePpeItem = ppeItemCrud.update;
exports.deletePpeItem = ppeItemCrud.delete;

const ppeAssignCrud = makeCrud(PpeAssignment, {
  include: [
    { model: PpeItem, as: "ppeItem", attributes: ["id", "name", "category"] },
    ...userInc,
    ...projectInc,
  ],
  buildPayload: (body) => ({
    ppe_item_id: body.ppe_item_id,
    user_id: body.user_id,
    project_id: body.project_id || null,
    issued_at: body.issued_at || todayISO(),
    replacement_due_at: body.replacement_due_at || null,
    returned_at: body.returned_at || null,
    status: body.status || "active",
    issued_by: body.issued_by || body.created_by || null,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listPpeAssignments = ppeAssignCrud.findAll;
exports.createPpeAssignment = ppeAssignCrud.create;
exports.getPpeAssignment = ppeAssignCrud.findOne;
exports.updatePpeAssignment = ppeAssignCrud.update;
exports.deletePpeAssignment = ppeAssignCrud.delete;

const trainingCrud = makeCrud(Training, {
  buildPayload: (body) => ({
    name: body.name,
    category: body.category,
    validity_months: body.validity_months ?? null,
    description: body.description || null,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listTrainings = trainingCrud.findAll;
exports.createTraining = trainingCrud.create;
exports.getTraining = trainingCrud.findOne;
exports.updateTraining = trainingCrud.update;
exports.deleteTraining = trainingCrud.delete;

const trainingRecordCrud = makeCrud(TrainingRecord, {
  include: [
    { model: Training, as: "training", attributes: ["id", "name", "category"] },
    ...userInc,
  ],
  buildPayload: (body) => ({
    training_id: body.training_id,
    user_id: body.user_id,
    certificate_url: body.certificate_url || null,
    issued_at: body.issued_at || todayISO(),
    expires_at: body.expires_at || null,
    trainer: body.trainer || null,
    notes: body.notes || null,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listTrainingRecords = trainingRecordCrud.findAll;
exports.createTrainingRecord = trainingRecordCrud.create;
exports.getTrainingRecord = trainingRecordCrud.findOne;
exports.updateTrainingRecord = trainingRecordCrud.update;
exports.deleteTrainingRecord = trainingRecordCrud.delete;

const equipInspCrud = makeCrud(EquipmentInspection, {
  include: [
    { model: Equipment, as: "equipment", attributes: ["id", "name", "registration_number"] },
    { model: User, as: "operator", attributes: ["id", "username"] },
    ...projectInc,
  ],
  buildPayload: (body) => ({
    equipment_id: body.equipment_id,
    operator_id: body.operator_id || null,
    project_id: body.project_id || null,
    inspected_at: body.inspected_at || new Date(),
    defects: body.defects || null,
    photos: body.photos || null,
    maintenance_requested: !!body.maintenance_requested,
    status: body.status || "completed",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listEquipmentInspections = equipInspCrud.findAll;
exports.createEquipmentInspection = equipInspCrud.create;
exports.getEquipmentInspection = equipInspCrud.findOne;
exports.updateEquipmentInspection = equipInspCrud.update;
exports.deleteEquipmentInspection = equipInspCrud.delete;

const envCrud = makeCrud(Environmental, {
  include: [...projectInc],
  buildPayload: (body) => ({
    record_type: body.record_type,
    project_id: body.project_id || null,
    value: body.value ?? null,
    unit: body.unit || null,
    description: body.description || null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    reported_by: body.reported_by || body.created_by || null,
    incident_linked_id: body.incident_linked_id || null,
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listEnvironmentalRecords = envCrud.findAll;
exports.createEnvironmentalRecord = envCrud.create;
exports.getEnvironmentalRecord = envCrud.findOne;
exports.updateEnvironmentalRecord = envCrud.update;
exports.deleteEnvironmentalRecord = envCrud.delete;

const capaCrud = makeCrud(Capa, {
  include: [{ model: User, as: "responsible", attributes: ["id", "username"] }],
  buildPayload: (body) => ({
    source_type: body.source_type,
    source_id: body.source_id || null,
    action: body.action,
    responsible_user_id: body.responsible_user_id || null,
    deadline: body.deadline || null,
    evidence_url: body.evidence_url || null,
    verification_notes: body.verification_notes || null,
    status: body.status || "open",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listCapas = capaCrud.findAll;
exports.createCapa = capaCrud.create;
exports.getCapa = capaCrud.findOne;
exports.updateCapa = capaCrud.update;
exports.deleteCapa = capaCrud.delete;

exports.verifyCapa = async (req, res) => {
  try {
    const row = await Capa.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      status: req.body.status || "verified",
      verified_by: req.body.verified_by || null,
      verified_at: new Date(),
      verification_notes: req.body.verification_notes || row.verification_notes,
      updated_by: req.body.updated_by || null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const docCrud = makeCrud(HseDocument, {
  buildPayload: (body) => ({
    title: body.title,
    category: body.category,
    version: body.version || 1,
    file_url: body.file_url || null,
    effective_date: body.effective_date || null,
    review_date: body.review_date || null,
    status: body.status || "draft",
    created_by: body.created_by || null,
    updated_by: body.updated_by || null,
  }),
});
exports.listDocuments = docCrud.findAll;
exports.createDocument = docCrud.create;
exports.getDocument = docCrud.findOne;
exports.updateDocument = docCrud.update;
exports.deleteDocument = docCrud.delete;

exports.uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "Файл шаардлагатай" });
    try {
      const result = await uploadMulterFile(req.file, "hse-documents");
      res.json({ success: true, data: { url: result.secure_url } });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

// ─── Reports ─────────────────────────────────────────────────────────────────

exports.reports = async (req, res) => {
  try {
    const type = req.params.type;
    const from = req.query.from || todayISO();
    const to = req.query.to || todayISO();

    if (type === "daily") {
      const [acks, observations, nearMisses, incidents] = await Promise.all([
        DailyAck.count({ where: { ack_date: { [Op.between]: [from, to] } } }),
        Observation.count({ where: { createdAt: { [Op.between]: [from, to] } } }),
        NearMiss.count({ where: { createdAt: { [Op.between]: [from, to] } } }),
        Incident.count({ where: { createdAt: { [Op.between]: [from, to] } } }),
      ]);
      return res.json({ success: true, data: { period: { from, to }, acks, observations, nearMisses, incidents } });
    }

    if (type === "incidents") {
      const data = await Incident.findAll({
        where: { createdAt: { [Op.between]: [from, to] } },
        include: projectInc,
      });
      const byType = {};
      for (const row of data) {
        byType[row.incident_type] = (byType[row.incident_type] || 0) + 1;
      }
      return res.json({ success: true, data: { total: data.length, by_type: byType, rows: data } });
    }

    if (type === "training-expiry") {
      const data = await TrainingRecord.findAll({
        where: { expires_at: { [Op.lte]: to } },
        include: [{ model: Training, as: "training" }, ...userInc],
        order: [["expires_at", "ASC"]],
      });
      return res.json({ success: true, data });
    }

    if (type === "project-score") {
      const projects = await Project.findAll({ attributes: ["id", "name"] });
      const scores = [];
      for (const p of projects) {
        const [inc, obs, acks] = await Promise.all([
          Incident.count({ where: { project_id: p.id, createdAt: { [Op.between]: [from, to] } } }),
          Observation.count({ where: { project_id: p.id, observation_type: { [Op.ne]: "good_practice" } } }),
          DailyAck.count({ where: { project_id: p.id, ack_date: { [Op.between]: [from, to] } } }),
        ]);
        const score = Math.max(0, 100 - inc * 10 - obs * 2 + Math.min(acks, 20));
        scores.push({ project_id: p.id, project_name: p.name, incidents: inc, observations: obs, instruction_acks: acks, safety_score: score });
      }
      return res.json({ success: true, data: scores });
    }

    res.status(400).json({ success: false, message: "Тайлангийн төрөл олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Mobile wrappers ─────────────────────────────────────────────────────────

exports.createObservationMobile = async (req, res) => {
  req.body.reported_by = req.user?.id;
  req.body.created_by = req.user?.id;
  return observationCrud.create(req, res);
};

exports.createNearMissMobile = async (req, res) => {
  req.body.reported_by = req.user?.id;
  req.body.created_by = req.user?.id;
  return nearMissCrud.create(req, res);
};

exports.createIncidentMobile = async (req, res) => {
  req.body.reported_by = req.user?.id;
  req.body.created_by = req.user?.id;
  return incidentCrud.create(req, res);
};
