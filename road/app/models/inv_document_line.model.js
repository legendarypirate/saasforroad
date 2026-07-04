module.exports = (sequelize, Sequelize) => {
  const InvDocumentLine = sequelize.define("inv_document_line", {
    document_id: { type: Sequelize.INTEGER, allowNull: false },
    material_id: { type: Sequelize.INTEGER, allowNull: false },
    quantity: { type: Sequelize.DECIMAL(14, 3), allowNull: false },
    unit_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    total_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    remarks: { type: Sequelize.STRING },
  });
  return InvDocumentLine;
};
