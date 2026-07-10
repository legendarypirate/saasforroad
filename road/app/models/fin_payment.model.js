module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_payment", {
    number: { type: Sequelize.STRING(60), allowNull: false },
    payment_date: { type: Sequelize.DATEONLY, allowNull: false },
    account_id: { type: Sequelize.INTEGER, allowNull: false },
    direction: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "in" },
    amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    method: { type: Sequelize.STRING(30), defaultValue: "transfer" },
    invoice_id: { type: Sequelize.INTEGER },
    project_id: { type: Sequelize.INTEGER },
    supplier_id: { type: Sequelize.INTEGER },
    reference: { type: Sequelize.STRING(120) },
    notes: { type: Sequelize.TEXT },
    created_by: { type: Sequelize.INTEGER },
  });
};
