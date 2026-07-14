module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fuel_tank", {
    name: { type: Sequelize.STRING(200), allowNull: false },
    capacity: { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 0 },
    current_stock: { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 0 },
    location: { type: Sequelize.STRING(255) },
    fuel_type: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "diesel" },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "active" },
    min_stock: { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 0 },
    notes: { type: Sequelize.TEXT },
  });
};
