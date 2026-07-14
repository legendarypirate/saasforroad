module.exports = (sequelize, Sequelize) => {
  const Material = sequelize.define("material", {
    code: { type: Sequelize.STRING, unique: true },
    name: { type: Sequelize.STRING, allowNull: false },
    category_id: { type: Sequelize.INTEGER },
    brand: { type: Sequelize.STRING },
    specification: { type: Sequelize.STRING },
    unit: { type: Sequelize.STRING, defaultValue: "ширхэг" },
    barcode: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    image_url: { type: Sequelize.STRING },
    status: { type: Sequelize.STRING, defaultValue: "active" },
    min_stock: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    max_stock: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    reorder_level: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    default_warehouse_id: { type: Sequelize.INTEGER },
    default_supplier_id: { type: Sequelize.INTEGER },
    standard_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    average_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    last_purchase_price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    is_consumable: { type: Sequelize.BOOLEAN, defaultValue: true },
    is_asset: { type: Sequelize.BOOLEAN, defaultValue: false },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    deleted_at: { type: Sequelize.DATE },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
  return Material;
};
