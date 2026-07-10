module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_invoice_line", {
    invoice_id: { type: Sequelize.INTEGER, allowNull: false },
    description: { type: Sequelize.STRING(500) },
    qty: { type: Sequelize.DECIMAL(14, 3), defaultValue: 1 },
    unit_price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 10 },
  });
};
