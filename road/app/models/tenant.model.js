module.exports = (sequelize, Sequelize) => {
  const Tenant = sequelize.define(
    "tenant",
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      /** Primary custom domain, e.g. tenant1.mn */
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      /** Extra domains that resolve to this tenant (JSON string array) */
      domains: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      /**
       * Enabled zam modules as module ids / keys, e.g.
       * ["finance", "hse", "fuel", "road-engineering"]
       * null/empty = all modules enabled
       */
      modules: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      tableName: "tenants",
    }
  );

  return Tenant;
};
