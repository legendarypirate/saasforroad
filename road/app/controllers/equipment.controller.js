const db = require("../models");
const Equipment = db.equipments;
const EquipmentImage = db.equipment_images;
const EquipmentOilChange = db.equipment_oil_changes;
const EquipmentServiceLog = db.equipment_service_logs;
const EquipmentDocument = db.equipment_documents;
const EquipmentInsurance = db.equipment_insurances;
const EquipmentMonthlyFinance = db.equipment_monthly_finances;
const ProjectEquipmentLink = db.project_equipment_links;
const Project = db.projects;
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");

const MAX_GALLERY_IMAGES = 12;

const uploadImages = memoryUpload().fields([
  { name: "photo_front", maxCount: 1 },
  { name: "photo_back", maxCount: 1 },
  { name: "photo_left", maxCount: 1 },
  { name: "photo_right", maxCount: 1 },
  { name: "certificate_image", maxCount: 1 },
  { name: "images", maxCount: MAX_GALLERY_IMAGES },
]);

const uploadGalleryOnly = memoryUpload({
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype?.startsWith("image/");
    cb(ok ? null : new Error("Зөвхөн зураг оруулна"), ok);
  },
}).array("images", MAX_GALLERY_IMAGES);

const PROFILE_FIELDS = [
  "asset_no",
  "name",
  "model",
  "registration_number",
  "serial_number",
  "capacity",
  "country_of_origin",
  "year_manufactured",
  "import_date",
  "site",
  "color",
  "responsible_person",
  "operator_name",
  "phone",
  "responsible_user_id",
  "operator_user_id",
  "category",
  "equipment_category_id",
  "unit",
  "default_daily_rate",
  "is_rentable",
  "status",
  "motor_hours",
  "road_tax_amount",
  "atboyahat_amount",
  "air_pollution_fee",
  "transaction_fee",
  "tax_period",
  "tax_paid",
  "inspection_result",
  "inspection_date",
  "next_inspection_date",
  "inspection_extra_fee",
  "inspection_notes",
  "last_oil_change_date",
  "last_oil_motor_hours",
  "next_oil_motor_hours",
  "oil_type_name",
  "oil_quantity_liters",
  "oil_notes",
  "tech_certificate",
  "certificate_number",
  "certificate_expiry",
  "owner_name",
  "purchase_document",
  "certificate_notes",
  "photo_front",
  "photo_back",
  "photo_left",
  "photo_right",
  "certificate_image",
  "notes",
];

const DECIMAL_FIELDS = new Set([
  "default_daily_rate",
  "motor_hours",
  "road_tax_amount",
  "atboyahat_amount",
  "air_pollution_fee",
  "transaction_fee",
  "inspection_extra_fee",
  "last_oil_motor_hours",
  "next_oil_motor_hours",
  "oil_quantity_liters",
]);

const INT_FIELDS = new Set(["responsible_user_id", "operator_user_id", "equipment_category_id"]);

const BOOL_FIELDS = new Set(["is_rentable", "tax_paid"]);

async function applyUploadedFiles(body, files) {
  if (!files) return body;
  const map = {
    photo_front: files.photo_front,
    photo_back: files.photo_back,
    photo_left: files.photo_left,
    photo_right: files.photo_right,
    certificate_image: files.certificate_image,
  };
  for (const [key, arr] of Object.entries(map)) {
    if (arr && arr[0]) {
      const result = await uploadMulterFile(arr[0], "equipment");
      body[key] = result.secure_url;
    }
  }
  return body;
}

async function saveGalleryImages(equipmentId, files, tenantId = null) {
  const list = Array.isArray(files) ? files : files?.images;
  if (!list?.length) return [];
  const existingCount = await EquipmentImage.count({
    where: { equipment_id: equipmentId },
  });
  const created = [];
  let order = existingCount;
  for (const file of list) {
    if (order >= MAX_GALLERY_IMAGES) break;
    const result = await uploadMulterFile(file, "equipment");
    const row = await EquipmentImage.create({
      equipment_id: equipmentId,
      url: result.secure_url,
      public_id: result.public_id || null,
      sort_order: order,
      tenant_id: tenantId ?? null,
    });
    created.push(row);
    order += 1;
  }
  return created;
}

function pickBody(src) {
  const out = {};
  for (const f of PROFILE_FIELDS) {
    if (src[f] === undefined || src[f] === "") continue;
    let v = src[f];
    if (v === "null" || v === null) {
      out[f] = null;
      continue;
    }
    if (DECIMAL_FIELDS.has(f)) v = Number(v);
    if (INT_FIELDS.has(f)) {
      v = Number(v);
      if (!Number.isFinite(v)) continue;
    }
    if (BOOL_FIELDS.has(f)) {
      if (v === false || v === "false" || v === 0 || v === "0") v = false;
      else if (v === true || v === "true" || v === 1 || v === "1") v = true;
    }
    out[f] = v;
  }
  return out;
}

function workerLabel(user) {
  if (!user) return null;
  const parts = [user.username];
  if (user.position) parts.push(user.position);
  return parts.join(" · ");
}

/** Sync display name strings from selected internal workers. */
async function syncWorkerNames(payload) {
  const User = db.users;
  if (payload.responsible_user_id != null) {
    const u = await User.findByPk(payload.responsible_user_id, {
      attributes: ["id", "username", "position", "phone"],
    });
    if (u) payload.responsible_person = workerLabel(u);
  } else if (payload.responsible_user_id === null) {
    payload.responsible_person = null;
  }
  if (payload.operator_user_id != null) {
    const u = await User.findByPk(payload.operator_user_id, {
      attributes: ["id", "username", "position", "phone"],
    });
    if (u) {
      payload.operator_name = workerLabel(u);
      if (payload.phone === undefined && u.phone) payload.phone = u.phone;
    }
  } else if (payload.operator_user_id === null) {
    payload.operator_name = null;
  }
  return payload;
}

const userBrief = {
  model: db.users,
  attributes: ["id", "username", "position", "phone", "department_number"],
};

const equipmentInclude = [
  {
    model: db.equipment_categories,
    as: "equipmentCategory",
    attributes: ["id", "name", "code"],
    required: false,
  },
  {
    model: EquipmentOilChange,
    as: "oilChanges",
    separate: true,
    order: [["changed_at", "DESC"]],
  },
  {
    model: EquipmentServiceLog,
    as: "serviceLogs",
    separate: true,
    order: [["service_date", "DESC"]],
  },
  {
    model: EquipmentDocument,
    as: "documents",
    separate: true,
    order: [["expires_at", "ASC"]],
  },
  {
    model: EquipmentInsurance,
    as: "insurances",
    separate: true,
    order: [["expiry", "DESC"]],
  },
  {
    model: EquipmentMonthlyFinance,
    as: "monthlyFinances",
    separate: true,
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
    ],
  },
  {
    model: Project,
    as: "projects",
    attributes: ["id", "name"],
    through: { attributes: [] },
    required: false,
  },
  { ...userBrief, as: "responsibleUser", required: false },
  { ...userBrief, as: "operatorUser", required: false },
  {
    model: EquipmentImage,
    as: "images",
    separate: true,
    order: [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  },
];

const marketplaceInclude = [
  {
    model: db.equipment_categories,
    as: "equipmentCategory",
    attributes: ["id", "name", "code"],
    required: false,
  },
  {
    model: EquipmentImage,
    as: "images",
    separate: true,
    skipTenantScope: true,
    order: [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  },
];

const MARKETPLACE_ATTRIBUTES = [
  "id",
  "asset_no",
  "name",
  "model",
  "registration_number",
  "serial_number",
  "year_manufactured",
  "site",
  "category",
  "equipment_category_id",
  "unit",
  "default_daily_rate",
  "is_rentable",
  "status",
  "motor_hours",
  "owner_name",
  "phone",
  "notes",
  "photo_front",
  "photo_back",
  "photo_left",
  "photo_right",
  "createdAt",
  "updatedAt",
];

/** Shared Дата → Техник: all tenants see every rentable device. */
exports.findMarketplace = async (req, res) => {
  const q = req.query.q;
  const where = { is_rentable: true };
  if (q) {
    where[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { model: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { registration_number: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { owner_name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { phone: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { site: { [db.Sequelize.Op.iLike]: `%${q}%` } },
    ];
  }
  try {
    const data = await Equipment.findAll({
      where,
      attributes: MARKETPLACE_ATTRIBUTES,
      include: marketplaceInclude,
      order: [["createdAt", "DESC"]],
      skipTenantScope: true,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findMarketplaceOne = async (req, res) => {
  try {
    const item = await Equipment.findOne({
      where: { id: req.params.id, is_rentable: true },
      attributes: MARKETPLACE_ATTRIBUTES,
      include: marketplaceInclude,
      skipTenantScope: true,
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Rentable equipment not found",
      });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const q = req.query.q;
  const category = req.query.category;
  const equipment_category_id = req.query.equipment_category_id;
  const rentable = req.query.is_rentable;
  const status = req.query.status;
  const where = {};
  if (q) {
    where[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { model: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { registration_number: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { asset_no: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { serial_number: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { site: { [db.Sequelize.Op.iLike]: `%${q}%` } },
    ];
  }
  if (category) where.category = category;
  if (equipment_category_id) where.equipment_category_id = equipment_category_id;
  if (status) where.status = status;
  if (rentable === "true") where.is_rentable = true;
  if (rentable === "false") where.is_rentable = false;

  try {
    const data = await Equipment.findAll({
      where,
      include: equipmentInclude,
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const item = await Equipment.findByPk(req.params.id, { include: equipmentInclude });
    if (!item) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function runMaybeUpload(req, res, next) {
  const ct = String(req.headers["content-type"] || "");
  if (ct.includes("multipart/form-data")) {
    return uploadImages(req, res, next);
  }
  return next(null);
}

exports.create = (req, res) => {
  runMaybeUpload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    const payload = pickBody(req.body);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }
    if (payload.category == null) payload.category = "machine";
    if (payload.unit == null) payload.unit = "ширхэг";
    if (payload.status == null) payload.status = "in_service";
    if (payload.is_rentable == null) payload.is_rentable = true;
    if (payload.motor_hours == null) payload.motor_hours = 0;
    if (payload.default_daily_rate == null) payload.default_daily_rate = 0;

    try {
      await applyUploadedFiles(payload, req.files);
      await syncWorkerNames(payload);
      const data = await Equipment.create(payload);
      await saveGalleryImages(data.id, req.files, data.tenant_id);
      const full = await Equipment.findByPk(data.id, { include: equipmentInclude });
      res.json({ success: true, data: full });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.update = (req, res) => {
  runMaybeUpload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    try {
      const item = await Equipment.findByPk(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Equipment not found" });
      }
      const updates = pickBody(req.body);
      await applyUploadedFiles(updates, req.files);
      await syncWorkerNames(updates);
      await item.update(updates);
      await saveGalleryImages(item.id, req.files, item.tenant_id);
      const full = await Equipment.findByPk(item.id, { include: equipmentInclude });
      res.json({ success: true, data: full });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await ProjectEquipmentLink.destroy({ where: { equipment_id: id } });
    await EquipmentOilChange.destroy({ where: { equipment_id: id } });
    await EquipmentServiceLog.destroy({ where: { equipment_id: id } });
    await EquipmentDocument.destroy({ where: { equipment_id: id } });
    await EquipmentInsurance.destroy({ where: { equipment_id: id } });
    await EquipmentMonthlyFinance.destroy({ where: { equipment_id: id } });
    await EquipmentImage.destroy({ where: { equipment_id: id } });
    const num = await Equipment.destroy({ where: { id } });
    if (num === 1) {
      return res.json({ success: true, message: "Equipment deleted" });
    }
    return res.status(404).json({ success: false, message: "Equipment not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Gallery images (Cloudinary) ——
exports.listImages = async (req, res) => {
  try {
    const data = await EquipmentImage.findAll({
      where: { equipment_id: req.params.id },
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadGalleryImages = (req, res) => {
  uploadGalleryOnly(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    try {
      const equipment = await Equipment.findByPk(req.params.id);
      if (!equipment) {
        return res.status(404).json({ success: false, message: "Equipment not found" });
      }
      const created = await saveGalleryImages(
        equipment.id,
        req.files,
        equipment.tenant_id
      );
      if (!created.length) {
        return res.status(400).json({
          success: false,
          message: "Зураг илгээнэ үү (images)",
        });
      }
      res.json({ success: true, data: created });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.deleteImage = async (req, res) => {
  try {
    const num = await EquipmentImage.destroy({
      where: {
        id: req.params.imageId,
        equipment_id: req.params.id,
      },
    });
    if (num === 1) {
      return res.json({ success: true, message: "Image deleted" });
    }
    return res.status(404).json({ success: false, message: "Image not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Oil changes ——
exports.listOilChanges = async (req, res) => {
  try {
    const data = await EquipmentOilChange.findAll({
      where: { equipment_id: req.params.id },
      order: [["changed_at", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOilChange = async (req, res) => {
  const equipment_id = req.params.id;
  const { changed_at, oil_type, motor_hours_at_change, quantity_liters, notes, changed_by } =
    req.body;
  if (!changed_at) {
    return res.status(400).json({ success: false, message: "changed_at is required" });
  }
  try {
    const equipment = await Equipment.findByPk(equipment_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    const record = await EquipmentOilChange.create({
      equipment_id,
      changed_at,
      oil_type: oil_type || null,
      motor_hours_at_change: motor_hours_at_change ?? null,
      quantity_liters: quantity_liters ?? null,
      notes: notes || null,
      changed_by: changed_by || null,
    });
    const patch = {
      last_oil_change_date: changed_at,
      oil_type_name: oil_type || equipment.oil_type_name,
      oil_quantity_liters: quantity_liters ?? equipment.oil_quantity_liters,
      oil_notes: notes || equipment.oil_notes,
    };
    if (motor_hours_at_change != null) {
      patch.motor_hours = motor_hours_at_change;
      patch.last_oil_motor_hours = motor_hours_at_change;
    }
    await equipment.update(patch);
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOilChange = async (req, res) => {
  try {
    const num = await EquipmentOilChange.destroy({ where: { id: req.params.oilId } });
    if (num === 1) return res.json({ success: true, message: "Oil change record deleted" });
    return res.status(404).json({ success: false, message: "Record not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Service / repair logs ——
exports.listServiceLogs = async (req, res) => {
  try {
    const data = await EquipmentServiceLog.findAll({
      where: { equipment_id: req.params.id },
      order: [["service_date", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createServiceLog = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    const {
      service_date,
      motor_hours,
      service_type,
      description,
      parts_replaced,
      cost,
      service_provider,
      engineer,
      next_service_date,
      notes,
    } = req.body;
    if (!service_date) {
      return res.status(400).json({ success: false, message: "service_date is required" });
    }
    const record = await EquipmentServiceLog.create({
      equipment_id: equipment.id,
      service_date,
      motor_hours: motor_hours ?? null,
      service_type: service_type || "ТО",
      description: description || null,
      parts_replaced: parts_replaced || null,
      cost: cost ?? null,
      service_provider: service_provider || null,
      engineer: engineer || null,
      next_service_date: next_service_date || null,
      notes: notes || null,
    });
    if (motor_hours != null) await equipment.update({ motor_hours });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteServiceLog = async (req, res) => {
  try {
    const num = await EquipmentServiceLog.destroy({ where: { id: req.params.logId } });
    if (num === 1) return res.json({ success: true });
    return res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Documents ——
async function syncDocSnapshot(equipmentId, docType) {
  const equipment = await Equipment.findByPk(equipmentId);
  if (!equipment) return;

  const latest = await EquipmentDocument.findOne({
    where: { equipment_id: equipmentId, doc_type: docType },
    order: [
      ["expires_at", "DESC"],
      ["issued_at", "DESC"],
      ["id", "DESC"],
    ],
  });

  if (docType === "inspection") {
    await equipment.update({
      inspection_result: latest?.status || latest?.name || null,
      inspection_date: latest?.issued_at || null,
      next_inspection_date: latest?.expires_at || null,
      inspection_extra_fee: latest?.amount ?? null,
      inspection_notes: latest?.notes || null,
    });
  } else if (docType === "certificate") {
    await equipment.update({
      tech_certificate: latest?.name || null,
      certificate_number: latest?.number || null,
      certificate_expiry: latest?.expires_at || null,
      owner_name: latest?.issuer || null,
      certificate_notes: latest?.notes || null,
    });
  }
}

function docPayload(body) {
  return {
    doc_type: body.doc_type || "other",
    name: body.name,
    number: body.number || null,
    amount: body.amount ?? null,
    period: body.period || null,
    status: body.status || null,
    issued_at: body.issued_at || null,
    expires_at: body.expires_at || null,
    issuer: body.issuer || null,
    paid: body.paid ?? null,
    notes: body.notes || null,
  };
}

exports.listDocuments = async (req, res) => {
  try {
    const where = { equipment_id: req.params.id };
    if (req.query.doc_type) where.doc_type = req.query.doc_type;
    const data = await EquipmentDocument.findAll({
      where,
      order: [
        ["expires_at", "DESC"],
        ["issued_at", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    const payload = docPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }
    const record = await EquipmentDocument.create({
      equipment_id: equipment.id,
      ...payload,
    });
    await syncDocSnapshot(equipment.id, record.doc_type);
    const full = await Equipment.findByPk(equipment.id, { include: equipmentInclude });
    res.json({ success: true, data: record, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const record = await EquipmentDocument.findOne({
      where: { id: req.params.docId, equipment_id: req.params.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const payload = docPayload({ ...record.toJSON(), ...req.body });
    if (!payload.name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }
    await record.update(payload);
    await syncDocSnapshot(record.equipment_id, record.doc_type);
    const full = await Equipment.findByPk(record.equipment_id, { include: equipmentInclude });
    res.json({ success: true, data: record, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const record = await EquipmentDocument.findOne({
      where: { id: req.params.docId, equipment_id: req.params.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const { equipment_id, doc_type } = record;
    await record.destroy();
    await syncDocSnapshot(equipment_id, doc_type);
    const full = await Equipment.findByPk(equipment_id, { include: equipmentInclude });
    res.json({ success: true, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Insurance (one-to-many) ——
function insurancePayload(body) {
  return {
    company: body.company || null,
    status: body.status || null,
    contract_no: body.contract_no || null,
    amount: body.amount === "" || body.amount == null ? null : Number(body.amount),
    start_date: body.start_date || null,
    expiry: body.expiry || null,
    notes: body.notes || null,
  };
}

exports.listInsurances = async (req, res) => {
  try {
    const data = await EquipmentInsurance.findAll({
      where: { equipment_id: req.params.id },
      order: [["expiry", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInsurance = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    const payload = insurancePayload(req.body);
    if (!payload.company && !payload.contract_no) {
      return res.status(400).json({ success: false, message: "company or contract_no is required" });
    }
    const record = await EquipmentInsurance.create({
      equipment_id: equipment.id,
      ...payload,
      tenant_id: equipment.tenant_id ?? null,
    });
    const full = await Equipment.findByPk(equipment.id, { include: equipmentInclude });
    res.json({ success: true, data: record, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInsurance = async (req, res) => {
  try {
    const record = await EquipmentInsurance.findOne({
      where: { id: req.params.insId, equipment_id: req.params.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    await record.update(insurancePayload({ ...record.toJSON(), ...req.body }));
    const full = await Equipment.findByPk(record.equipment_id, { include: equipmentInclude });
    res.json({ success: true, data: record, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInsurance = async (req, res) => {
  try {
    const record = await EquipmentInsurance.findOne({
      where: { id: req.params.insId, equipment_id: req.params.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const { equipment_id } = record;
    await record.destroy();
    const full = await Equipment.findByPk(equipment_id, { include: equipmentInclude });
    res.json({ success: true, equipment: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// —— Monthly finance ——
exports.listFinances = async (req, res) => {
  try {
    const where = { equipment_id: req.params.id };
    if (req.query.year) where.year = Number(req.query.year);
    const data = await EquipmentMonthlyFinance.findAll({
      where,
      order: [
        ["year", "ASC"],
        ["month", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upsertFinance = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    const year = Number(req.body.year);
    const month = Number(req.body.month);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: "year and month required" });
    }
    const fields = {
      rental_income: Number(req.body.rental_income) || 0,
      operator_salary: Number(req.body.operator_salary) || 0,
      oil_cost: Number(req.body.oil_cost) || 0,
      service_cost: Number(req.body.service_cost) || 0,
      fuel_cost: Number(req.body.fuel_cost) || 0,
      other_cost: Number(req.body.other_cost) || 0,
      notes: req.body.notes || null,
    };
    const [row, created] = await EquipmentMonthlyFinance.findOrCreate({
      where: { equipment_id: equipment.id, year, month },
      defaults: fields,
    });
    if (!created) await row.update(fields);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFinance = async (req, res) => {
  try {
    const num = await EquipmentMonthlyFinance.destroy({ where: { id: req.params.finId } });
    if (num === 1) return res.json({ success: true });
    return res.status(404).json({ success: false, message: "Not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Equipment categories (Техникийн ангилал) ───────────── */

const Category = db.equipment_categories;

exports.listCategories = async (req, res) => {
  try {
    const where = {};
    if (req.query.active === "1" || req.query.active === "true") {
      where.is_active = true;
    }
    const data = await Category.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["name", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "Нэр заавал" });
    }
    const data = await Category.create({
      name: String(req.body.name).trim(),
      code: req.body.code || null,
      description: req.body.description || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_active: req.body.is_active !== false && req.body.is_active !== "false",
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const row = await Category.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.code !== undefined) patch.code = req.body.code || null;
    if (req.body.description !== undefined) patch.description = req.body.description || null;
    if (req.body.sort_order !== undefined) patch.sort_order = Number(req.body.sort_order) || 0;
    if (req.body.is_active !== undefined) {
      patch.is_active = req.body.is_active !== false && req.body.is_active !== "false";
    }
    await row.update(patch);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const inUse = await Equipment.count({ where: { equipment_category_id: req.params.id } });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Энэ ангилалд ${inUse} техник бүртгэлтэй — эхлээд солино уу`,
      });
    }
    const num = await Category.destroy({ where: { id: req.params.id } });
    if (num === 1) return res.json({ success: true, message: "Устгагдлаа" });
    return res.status(404).json({ success: false, message: "Олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
