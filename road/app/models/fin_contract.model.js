module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fin_contract", {
    number: { type: Sequelize.STRING(60), allowNull: false },
    type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "client" },
    party_name: { type: Sequelize.STRING(255) },
    project_id: { type: Sequelize.INTEGER },
    supplier_id: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 10 },
    start_date: { type: Sequelize.DATEONLY },
    end_date: { type: Sequelize.DATEONLY },
    status: { type: Sequelize.STRING(30), defaultValue: "active" },
    notes: { type: Sequelize.TEXT },
  });
};
