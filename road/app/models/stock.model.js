module.exports = (sequelize, Sequelize) => {
  const Stock = sequelize.define(
    "stock",
    {
      item_id: { type: Sequelize.INTEGER, allowNull: false },
      warehouse_id: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
      reserved_quantity: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
      on_order_quantity: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
      average_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      last_updated: { type: Sequelize.DATE },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    {
      indexes: [
        { unique: true, fields: ["item_id", "warehouse_id"] },
      ],
    }
  );
  return Stock;
};
