module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_budget", {
    project_id: { type: Sequelize.INTEGER },
    year: { type: Sequelize.INTEGER, allowNull: false },
    category: { type: Sequelize.STRING(120), allowNull: false },
    planned_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    notes: { type: Sequelize.TEXT },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
