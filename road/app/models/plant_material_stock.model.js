module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_material_stock", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    material_id: { type: Sequelize.INTEGER, allowNull: false },
    quantity: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
  });
};
