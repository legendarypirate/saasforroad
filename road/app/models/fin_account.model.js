module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_account", {
    code: { type: Sequelize.STRING(40), allowNull: false },
    name: { type: Sequelize.STRING(200), allowNull: false },
    type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "bank" },
    bank_name: { type: Sequelize.STRING(200) },
    account_number: { type: Sequelize.STRING(80) },
    opening_balance: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    currency: { type: Sequelize.STRING(8), defaultValue: "MNT" },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    notes: { type: Sequelize.TEXT },
  });
};
