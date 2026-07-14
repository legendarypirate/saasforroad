module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "notification",
    {
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "draft",
      },
      audience: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "all",
      },
      priority: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "normal",
      },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      published_at: { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "notifications" }
  );
};
