module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "assist_service_category",
    {
      name: { type: Sequelize.STRING(160), allowNull: false },
      name_mn: { type: Sequelize.STRING(160), allowNull: true },
      icon: { type: Sequelize.STRING(80), allowNull: true },
      image: { type: Sequelize.STRING(512), allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "assist_service_categories" }
  );
};
