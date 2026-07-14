module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_setting", {
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    setting_key: { type: Sequelize.STRING(100), allowNull: false },
    setting_value: { type: Sequelize.TEXT, allowNull: true },
    label: { type: Sequelize.STRING(150), allowNull: true },
    unit: { type: Sequelize.STRING(30), allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
