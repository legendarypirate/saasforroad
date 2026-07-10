module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_daily_instruction", {
    title: { type: Sequelize.STRING(255), allowNull: false },
    content: { type: Sequelize.TEXT, allowNull: false },
    version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    department: { type: Sequelize.STRING(120), allowNull: true },
    publish_date: { type: Sequelize.DATEONLY, allowNull: false },
    expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "draft",
    },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
