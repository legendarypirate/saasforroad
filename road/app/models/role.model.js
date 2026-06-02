module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("role", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
    },
    mobile_access: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return Role;
};

  