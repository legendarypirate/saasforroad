module.exports = (sequelize, Sequelize) => {
  return sequelize.define("quantity_item", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    code: { type: Sequelize.STRING(50), allowNull: true },
    description: { type: Sequelize.STRING(255), allowNull: false },
    unit: { type: Sequelize.STRING(30), allowNull: true },
    quantity: { type: Sequelize.DECIMAL(14, 3), allowNull: true, defaultValue: 0 },
    unit_price: { type: Sequelize.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    category: { type: Sequelize.STRING(80), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
  });
};
