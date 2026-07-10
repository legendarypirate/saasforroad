const db = require("../models");
const Equipment = db.equipments;
const EquipmentOilChange = db.equipment_oil_changes;
const ProjectEquipmentLink = db.project_equipment_links;
const Project = db.projects;
const multer = require("multer");
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");

const uploadImages = memoryUpload().fields([
  { name: "photo_front", maxCount: 1 },
  { name: "photo_back", maxCount: 1 },
  { name: "photo_left", maxCount: 1 },
  { name: "photo_right", maxCount: 1 },
  { name: "certificate_image", maxCount: 1 },
]);

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

const equipmentInclude = [
  {
    model: EquipmentOilChange,
    as: "oilChanges",
    separate: true,
    order: [["changed_at", "DESC"]],
  },
  {
    model: Project,
    as: "projects",
    attributes: ["id", "name"],
    through: { attributes: [] },
    required: false,
  },
];

exports.findAll = async (req, res) => {
  const q = req.query.q;
  const category = req.query.category;
  const rentable = req.query.is_rentable;
  const where = {};
  if (q) {
    where[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { model: { [db.Sequelize.Op.iLike]: `%${q}%` } },
      { registration_number: { [db.Sequelize.Op.iLike]: `%${q}%` } },
    ];
  }
  if (category) where.category = category;
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

exports.create = (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    const {
      name,
      model,
      registration_number,
      motor_hours,
      notes,
      category,
      unit,
      default_daily_rate,
      is_rentable,
      status,
    } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    try {
      const payload = await applyUploadedFiles(
        {
          name,
          model: model || null,
          registration_number: registration_number || null,
          motor_hours: motor_hours ?? 0,
          notes: notes || null,
          category: category || "machine",
          unit: unit || "ширхэг",
          default_daily_rate: default_daily_rate ?? 0,
          is_rentable: is_rentable === false || is_rentable === "false" ? false : true,
          status: status || "available",
        },
        req.files
      );

      const data = await Equipment.create(payload);
      const full = await Equipment.findByPk(data.id, { include: equipmentInclude });
      res.json({ success: true, data: full });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.update = (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    try {
      const item = await Equipment.findByPk(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Equipment not found" });
      }

      const updates = await applyUploadedFiles({}, req.files);
      const fields = [
        "name",
        "model",
        "registration_number",
        "motor_hours",
        "notes",
        "category",
        "unit",
        "default_daily_rate",
        "is_rentable",
        "status",
        "photo_front",
        "photo_back",
        "photo_left",
        "photo_right",
        "certificate_image",
      ];
      fields.forEach((f) => {
        if (req.body[f] !== undefined && req.body[f] !== "") {
          updates[f] = req.body[f];
        }
      });
      if (req.body.is_rentable === false || req.body.is_rentable === "false") {
        updates.is_rentable = false;
      }
      if (req.body.is_rentable === true || req.body.is_rentable === "true") {
        updates.is_rentable = true;
      }
      if (updates.motor_hours !== undefined) {
        updates.motor_hours = Number(updates.motor_hours);
      }
      if (updates.default_daily_rate !== undefined) {
        updates.default_daily_rate = Number(updates.default_daily_rate);
      }

      await item.update(updates);
      const full = await Equipment.findByPk(item.id, { include: equipmentInclude });
      res.json({ success: true, data: full });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.delete = async (req, res) => {
  try {
    await ProjectEquipmentLink.destroy({ where: { equipment_id: req.params.id } });
    await EquipmentOilChange.destroy({ where: { equipment_id: req.params.id } });
    const num = await Equipment.destroy({ where: { id: req.params.id } });
    if (num === 1) {
      return res.json({ success: true, message: "Equipment deleted" });
    }
    return res.status(404).json({ success: false, message: "Equipment not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

    if (motor_hours_at_change !== undefined && motor_hours_at_change !== null) {
      await equipment.update({ motor_hours: motor_hours_at_change });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteOilChange = async (req, res) => {
  try {
    const num = await EquipmentOilChange.destroy({ where: { id: req.params.oilId } });
    if (num === 1) {
      return res.json({ success: true, message: "Oil change record deleted" });
    }
    return res.status(404).json({ success: false, message: "Record not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
