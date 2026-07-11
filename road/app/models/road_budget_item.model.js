module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_budget_item", {
    budget_id: { type: Sequelize.INTEGER, allowNull: false },
    rate_id: { type: Sequelize.INTEGER, allowNull: true },
    category: { type: Sequelize.STRING(60), allowNull: false },
    code: { type: Sequelize.STRING(40), allowNull: true },
    description: { type: Sequelize.STRING(255), allowNull: false },
    unit: { type: Sequelize.STRING(30), allowNull: true },
    quantity: { type: Sequelize.DECIMAL(16, 3), allowNull: false, defaultValue: 0 },
    unit_price: { type: Sequelize.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
    amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    source: { type: Sequelize.STRING(40), allowNull: true },
    station_from: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    station_to: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    remarks: { type: Sequelize.TEXT, allowNull: true },
  });
};
