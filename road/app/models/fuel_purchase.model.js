module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fuel_purchase", {
    purchase_date: { type: Sequelize.DATEONLY, allowNull: false },
    supplier_id: { type: Sequelize.INTEGER, allowNull: false },
    invoice_number: { type: Sequelize.STRING(80) },
    fuel_type: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "diesel" },
    quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
    unit_price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
    total_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
    tank_id: { type: Sequelize.INTEGER, allowNull: false },
    notes: { type: Sequelize.TEXT },
    created_by: { type: Sequelize.INTEGER },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
