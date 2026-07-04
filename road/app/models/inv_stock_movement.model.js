module.exports = (sequelize, Sequelize) => {
  const InvStockMovement = sequelize.define("inv_stock_movement", {
    movement_no: { type: Sequelize.STRING },
    movement_type: {
      type: Sequelize.STRING,
      allowNull: false,
      // IN | OUT | TRANSFER | RETURN | ADJUSTMENT | LOSS | DAMAGE | PRODUCTION | CONSUMPTION
    },
    warehouse_id: { type: Sequelize.INTEGER, allowNull: false },
    to_warehouse_id: { type: Sequelize.INTEGER },
    material_id: { type: Sequelize.INTEGER, allowNull: false },
    project_id: { type: Sequelize.INTEGER },
    quantity: { type: Sequelize.DECIMAL(14, 3), allowNull: false },
    unit_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    total_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    balance_after: { type: Sequelize.DECIMAL(14, 3) },
    reference_type: { type: Sequelize.STRING },
    reference_id: { type: Sequelize.INTEGER },
    document_id: { type: Sequelize.INTEGER },
    document_line_id: { type: Sequelize.INTEGER },
    created_by: { type: Sequelize.INTEGER },
    approved_by: { type: Sequelize.INTEGER },
    transaction_date: { type: Sequelize.DATEONLY, allowNull: false },
    remarks: { type: Sequelize.TEXT },
  });
  return InvStockMovement;
};
