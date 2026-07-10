module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_vat_entry", {
    entry_date: { type: Sequelize.DATEONLY, allowNull: false },
    type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "output" },
    invoice_id: { type: Sequelize.INTEGER },
    expense_id: { type: Sequelize.INTEGER },
    base_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 10 },
    counterparty: { type: Sequelize.STRING(255) },
    notes: { type: Sequelize.TEXT },
  });
};
