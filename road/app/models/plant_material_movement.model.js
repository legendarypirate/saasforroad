module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_material_movement", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    material_id: { type: Sequelize.INTEGER, allowNull: false },
    /** in | out | adjust | consume */
    movement_type: { type: Sequelize.STRING(20), defaultValue: "in" },
    quantity: { type: Sequelize.DECIMAL(14, 3), allowNull: false },
    unit_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    movement_date: { type: Sequelize.DATEONLY, allowNull: false },
    ref_type: { type: Sequelize.STRING(40), allowNull: true },
    ref_id: { type: Sequelize.INTEGER, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
