module.exports = (sequelize, Sequelize) => {
  const Permission = sequelize.define("permission", {
    module: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return Permission;
};
