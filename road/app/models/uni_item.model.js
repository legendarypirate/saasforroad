module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_item", {
    code: { type: Sequelize.STRING(40) },
    name: { type: Sequelize.STRING(200), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: false, defaultValue: "workwear" },
    unit: { type: Sequelize.STRING(40), defaultValue: "ширхэг" },
    size_options: { type: Sequelize.STRING(255) },
    unit_cost: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    stock_qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    min_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    notes: { type: Sequelize.TEXT },
  });
};
