const db = require("../models");
const Supplier = db.suppliers;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const { name, phone, email, address, register, productTypes } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Нийлүүлэгчийн нэр шаардлагатай" });
  }
  try {
    const data = await Supplier.create({
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      address: address || null,
      register: register || null,
      productTypes: productTypes || [],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { q } = req.query;
  const where = {};
  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
      { register: { [Op.iLike]: `%${q}%` } },
    ];
  }
  try {
    const data = await Supplier.findAll({ where, order: [["name", "ASC"]] });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Supplier.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Supplier.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      name: req.body.name !== undefined ? req.body.name.trim() : row.name,
      phone: req.body.phone !== undefined ? req.body.phone : row.phone,
      email: req.body.email !== undefined ? req.body.email : row.email,
      address: req.body.address !== undefined ? req.body.address : row.address,
      register: req.body.register !== undefined ? req.body.register : row.register,
      productTypes:
        req.body.productTypes !== undefined ? req.body.productTypes : row.productTypes,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await Supplier.destroy({ where: { id: req.params.id } });
    if (!num) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
