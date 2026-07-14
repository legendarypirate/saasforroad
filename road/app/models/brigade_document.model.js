module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_document",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      /** certificate | license | insurance | safety | other */
      doc_type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "other",
      },
      file_url: { type: Sequelize.STRING(1024), allowNull: true },
      expires_at: { type: Sequelize.DATEONLY, allowNull: true },
      uploaded_by: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "brigade_documents" }
  );
};
