function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function makeCrud(Model, options = {}) {
  const include = options.include || [];
  const order = options.order || [["createdAt", "DESC"]];
  const buildPayload = options.buildPayload || ((body) => body);
  const beforeCreate = options.beforeCreate;
  const filterWhere = options.filterWhere || (() => ({}));

  return {
    async create(req, res) {
      try {
        const payload = buildPayload(req.body, req);
        if (beforeCreate) await beforeCreate(payload, req);
        const row = await Model.create(payload);
        const full = await Model.findByPk(row.id, { include });
        res.json({ success: true, data: full });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    },

    async findAll(req, res) {
      try {
        const where = filterWhere(req.query);
        const data = await Model.findAll({ where, include, order });
        res.json({ success: true, data });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    },

    async findOne(req, res) {
      try {
        const row = await Model.findByPk(req.params.id, { include });
        if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
        res.json({ success: true, data: row });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    },

    async update(req, res) {
      try {
        const row = await Model.findByPk(req.params.id);
        if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
        const payload = buildPayload(req.body, req, row);
        await row.update(payload);
        const full = await Model.findByPk(row.id, { include });
        res.json({ success: true, data: full });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    },

    async delete(req, res) {
      try {
        const num = await Model.destroy({ where: { id: req.params.id } });
        if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
        res.json({ success: true, message: "Устгагдлаа" });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    },
  };
}

module.exports = { todayISO, makeCrud };
