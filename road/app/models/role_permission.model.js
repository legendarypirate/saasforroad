module.exports = (sequelize, Sequelize) => {
  const RolePermission = sequelize.define("role_permission", {
    roleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    permissionId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return RolePermission;
};
