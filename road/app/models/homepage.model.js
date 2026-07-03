module.exports = (sequelize, Sequelize) => {
  const Homepage = sequelize.define("homepage_setting", {
    content: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
  });

  return Homepage;
};
