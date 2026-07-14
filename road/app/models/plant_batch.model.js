module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_batch", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    product_id: { type: Sequelize.INTEGER, allowNull: true },
    batch_no: { type: Sequelize.STRING(60), allowNull: true },
    production_date: { type: Sequelize.DATEONLY, allowNull: false },
    started_at: { type: Sequelize.DATE, allowNull: true },
    ended_at: { type: Sequelize.DATE, allowNull: true },
    quantity_produced: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    mix_formula: { type: Sequelize.TEXT, allowNull: true },
    lab_ok: { type: Sequelize.BOOLEAN, defaultValue: true },
    /** draft | running | done | rejected */
    status: { type: Sequelize.STRING(20), defaultValue: "done" },
    operator_name: { type: Sequelize.STRING, allowNull: true },
    fuel_used: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
