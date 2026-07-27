module.exports = (sequelize, Sequelize) => {
  /** Invoice billed to tenant when roadside assist job is finished. */
  return sequelize.define(
    "assist_invoice",
    {
      invoice_number: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      assist_call_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      equipment_id: { type: Sequelize.INTEGER, allowNull: true },
      plate_number: { type: Sequelize.STRING(40), allowNull: true },
      equipment_name: { type: Sequelize.STRING(255), allowNull: true },
      service_name: { type: Sequelize.STRING(255), allowNull: true },
      driver_name: { type: Sequelize.STRING(255), allowNull: true },
      service_man_name: { type: Sequelize.STRING(255), allowNull: true },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(8),
        allowNull: false,
        defaultValue: "MNT",
      },
      /** unpaid | paid | cancelled */
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "unpaid",
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      paid_by_user_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "assist_invoices" }
  );
};
