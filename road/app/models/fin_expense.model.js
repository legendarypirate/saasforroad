module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_expense", {
    expense_date: { type: Sequelize.DATEONLY, allowNull: false },
    account_id: { type: Sequelize.INTEGER },
    user_id: { type: Sequelize.INTEGER },
    project_id: { type: Sequelize.INTEGER },
    category: { type: Sequelize.STRING(120) },
    amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    status: { type: Sequelize.STRING(30), defaultValue: "draft" },
    description: { type: Sequelize.TEXT },
    created_by: { type: Sequelize.INTEGER },
    approved_by: { type: Sequelize.INTEGER },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
