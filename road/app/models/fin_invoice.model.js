module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_invoice", {
    number: { type: Sequelize.STRING(60), allowNull: false },
    direction: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "ar" },
    project_id: { type: Sequelize.INTEGER },
    supplier_id: { type: Sequelize.INTEGER },
    contract_id: { type: Sequelize.INTEGER },
    counterparty: { type: Sequelize.STRING(255) },
    issue_date: { type: Sequelize.DATEONLY },
    due_date: { type: Sequelize.DATEONLY },
    subtotal: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    total: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    paid_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    status: { type: Sequelize.STRING(30), defaultValue: "draft" },
    description: { type: Sequelize.TEXT },
    created_by: { type: Sequelize.INTEGER },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
