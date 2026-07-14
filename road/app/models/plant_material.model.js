module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_material", {
    name: { type: Sequelize.STRING, allowNull: false },
    /** bitumen | cement | aggregate | filler | emulsion_base | fuel | additive | other */
    material_type: { type: Sequelize.STRING(40), defaultValue: "aggregate" },
    unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    min_stock: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    unit_cost_default: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    notes: { type: Sequelize.TEXT, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
