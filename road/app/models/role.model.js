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
    /** Roles are scoped per tenant (single-tenant zam instance) */
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return Role;
};

  