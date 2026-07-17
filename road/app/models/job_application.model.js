module.exports = (sequelize, Sequelize) => {
  /**
   * A job seeker applies to a tenant/company. Tenant-scoped: each tenant only
   * sees the applications addressed to it (auto-filtered by tenant hooks).
   */
  return sequelize.define(
    "job_application",
    {
      job_seeker_id: { type: Sequelize.INTEGER, allowNull: false },
      position: { type: Sequelize.STRING(200), allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      /** pending | reviewed | accepted | rejected | withdrawn */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      response_note: { type: Sequelize.TEXT, allowNull: true },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "job_applications",
      indexes: [{ fields: ["job_seeker_id"] }, { fields: ["tenant_id"] }],
    }
  );
};
