module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "document_folder",
    {
      name: { type: Sequelize.STRING(255), allowNull: false },
      parent_id: { type: Sequelize.INTEGER, allowNull: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "document_folders" }
  );
};
