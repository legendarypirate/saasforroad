module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_budget_rate", {
    code: { type: Sequelize.STRING(40), allowNull: false, unique: true },
    category: { type: Sequelize.STRING(60), allowNull: false },
    name: { type: Sequelize.STRING(255), allowNull: false },
    unit: { type: Sequelize.STRING(30), allowNull: false },
    unit_price: { type: Sequelize.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
    labor_share: { type: Sequelize.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    material_share: { type: Sequelize.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    equipment_share: { type: Sequelize.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    productivity: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
  });
};
