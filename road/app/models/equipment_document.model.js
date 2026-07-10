module.exports = (sequelize, Sequelize) => {
  const EquipmentDocument = sequelize.define(
    "equipment_document",
    {
      equipment_id: { type: Sequelize.INTEGER, allowNull: false },
      /** insurance | tax | inspection | certificate | other */
      doc_type: { type: Sequelize.STRING, allowNull: false, defaultValue: "other" },
      name: { type: Sequelize.STRING, allowNull: false },
      number: { type: Sequelize.STRING, allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      period: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true },
      issued_at: { type: Sequelize.DATEONLY, allowNull: true },
      expires_at: { type: Sequelize.DATEONLY, allowNull: true },
      issuer: { type: Sequelize.STRING, allowNull: true },
      paid: { type: Sequelize.BOOLEAN, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "equipment_documents" }
  );
  return EquipmentDocument;
};
