module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fuel_supplier", {
    name: { type: Sequelize.STRING(200), allowNull: false },
    phone: { type: Sequelize.STRING(60) },
    email: { type: Sequelize.STRING(120) },
    address: { type: Sequelize.TEXT },
    tax_number: { type: Sequelize.STRING(80) },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "active" },
    notes: { type: Sequelize.TEXT },
  });
};
