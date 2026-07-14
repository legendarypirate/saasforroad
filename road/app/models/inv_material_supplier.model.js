module.exports = (sequelize, Sequelize) => {
  const InvMaterialSupplier = sequelize.define(
    "inv_material_supplier",
    {
      material_id: { type: Sequelize.INTEGER, allowNull: false },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false },
      is_preferred: { type: Sequelize.BOOLEAN, defaultValue: false },
      last_purchase_price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      lead_time_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      moq: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    {
      indexes: [{ unique: true, fields: ["material_id", "supplier_id"] }],
    }
  );
  return InvMaterialSupplier;
};
