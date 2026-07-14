module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_ppe_item", {
    name: { type: Sequelize.STRING(120), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: false },
    sku: { type: Sequelize.STRING(80), allowNull: true },
    stock_qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    min_stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    expiry_months: { type: Sequelize.INTEGER, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
