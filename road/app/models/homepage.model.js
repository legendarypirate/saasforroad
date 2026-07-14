module.exports = (sequelize, Sequelize) => {
  const Homepage = sequelize.define("homepage_setting", {
    content: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Homepage;
};
