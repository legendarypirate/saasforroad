module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_budget_assumption", {
    budget_id: { type: Sequelize.INTEGER, allowNull: false },
    key: { type: Sequelize.STRING(80), allowNull: false },
    label: { type: Sequelize.STRING(150), allowNull: false },
    value: { type: Sequelize.STRING(120), allowNull: true },
    unit: { type: Sequelize.STRING(30), allowNull: true },
  });
};
