module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "assist_service",
    {
      category_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      name_mn: { type: Sequelize.STRING(160), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      icon: { type: Sequelize.STRING(80), allowNull: true },
      image: { type: Sequelize.STRING(512), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      /** Default roadside assist fee billed to tenant on job finish */
      base_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "assist_services" }
  );
};
