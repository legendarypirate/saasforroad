const db = require("../models");
const Equipment = db.equipments;
const ProjectEquipmentLink = db.project_equipment_links;
const EquipmentOilChange = db.equipment_oil_changes;

const equipmentInclude = [
  {
    model: EquipmentOilChange,
    as: "oilChanges",
    separate: true,
    order: [["changed_at", "DESC"]],
  },
];

exports.findByProject = async (req, res) => {
  const project_id = req.query.project_id;
  if (!project_id) {
    return res.status(400).json({ success: false, message: "project_id is required" });
  }

  try {
    const links = await ProjectEquipmentLink.findAll({
      where: { project_id },
      include: [
        {
          model: Equipment,
          as: "equipment",
          include: equipmentInclude,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = links.map((link) => {
      const eq = link.equipment ? link.equipment.toJSON() : null;
      return eq
        ? {
            ...eq,
            link_id: link.id,
            project_id: Number(project_id),
          }
        : null;
    }).filter(Boolean);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assign = async (req, res) => {
  const { project_id, equipment_id } = req.body;

  if (!project_id || !equipment_id) {
    return res.status(400).json({
      success: false,
      message: "project_id and equipment_id are required",
    });
  }

  try {
    const equipment = await Equipment.findByPk(equipment_id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    const [link, created] = await ProjectEquipmentLink.findOrCreate({
      where: { project_id, equipment_id },
      defaults: { project_id, equipment_id },
    });

    if (!created) {
      return res.json({
        success: true,
        message: "Already assigned to this project",
        data: link,
      });
    }

    res.json({ success: true, message: "Equipment assigned to project", data: link });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.unassign = async (req, res) => {
  const project_id = req.query.project_id;
  const equipment_id = req.query.equipment_id;

  if (!project_id || !equipment_id) {
    return res.status(400).json({
      success: false,
      message: "project_id and equipment_id are required",
    });
  }

  try {
    const num = await ProjectEquipmentLink.destroy({
      where: { project_id, equipment_id },
    });

    if (num === 1) {
      return res.json({ success: true, message: "Equipment removed from project" });
    }
    return res.status(404).json({ success: false, message: "Assignment not found" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
