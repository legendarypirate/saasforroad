module.exports = (sequelize, Sequelize) => {
  const Document = sequelize.define(
    "document",
    {
      name: { type: Sequelize.STRING(255), allowNull: false },
      parent_id: { type: Sequelize.INTEGER, allowNull: true, defaultValue: null },
      file_url: { type: Sequelize.STRING(1000), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      doc_type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "other",
      },
      doc_number: { type: Sequelize.STRING(120), allowNull: true },
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "active",
      },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      tags: { type: Sequelize.STRING(500), allowNull: true },
      mime_type: { type: Sequelize.STRING(120), allowNull: true },
      file_size: { type: Sequelize.INTEGER, allowNull: true },
      original_name: { type: Sequelize.STRING(255), allowNull: true },
      issue_date: { type: Sequelize.DATEONLY, allowNull: true },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      issuer: { type: Sequelize.STRING(255), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      updated_by: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "documents" }
  );

  return Document;
};
