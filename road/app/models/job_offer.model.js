module.exports = (sequelize, Sequelize) => {
  /**
   * A tenant/company sends a job offer to a job seeker. Tenant-scoped: each
   * tenant only sees the offers it created (auto-filtered by tenant hooks).
   */
  return sequelize.define(
    "job_offer",
    {
      job_seeker_id: { type: Sequelize.INTEGER, allowNull: false },
      /** Snapshot of the company name at offer time (tenants aren't visible to mobile). */
      employer_name: { type: Sequelize.STRING(255), allowNull: true },
      job_title: { type: Sequelize.STRING(200), allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      salary_offer: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      /** sent | accepted | rejected | withdrawn */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "sent",
      },
      response_note: { type: Sequelize.TEXT, allowNull: true },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      /** Tenant user who sent the offer. */
      requested_by: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "job_offers",
      indexes: [{ fields: ["job_seeker_id"] }, { fields: ["tenant_id"] }],
    }
  );
};
