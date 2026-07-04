module.exports = (sequelize, Sequelize) => {
  const InvDocument = sequelize.define("inv_document", {
    doc_no: { type: Sequelize.STRING, unique: true },
    doc_type: {
      type: Sequelize.STRING,
      allowNull: false,
      // RECEIPT | ISSUE | RETURN | TRANSFER | ADJUSTMENT | COUNT | DAMAGE | LOSS | CONSUMPTION
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "DRAFT",
      // DRAFT | POSTED | CANCELLED
    },
    warehouse_id: { type: Sequelize.INTEGER },
    to_warehouse_id: { type: Sequelize.INTEGER },
    project_id: { type: Sequelize.INTEGER },
    supplier_id: { type: Sequelize.INTEGER },
    receiver_name: { type: Sequelize.STRING },
    doc_date: { type: Sequelize.DATEONLY, allowNull: false },
    remarks: { type: Sequelize.TEXT },
    reason: { type: Sequelize.STRING },
    total_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    created_by: { type: Sequelize.INTEGER },
    approved_by: { type: Sequelize.INTEGER },
    posted_at: { type: Sequelize.DATE },
    cancelled_at: { type: Sequelize.DATE },
    cancel_reason: { type: Sequelize.TEXT },
  });
  return InvDocument;
};
