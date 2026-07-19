module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "collaboration_request",
    {
      job_ad_id: { type: Sequelize.INTEGER, allowNull: false },
      project_id: { type: Sequelize.INTEGER, allowNull: false },
      from_tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      to_tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      /** subcontractor | partner | specialist */
      requested_role: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "subcontractor",
      },
      message: { type: Sequelize.TEXT, allowNull: true },
      /** pending | accepted | rejected | withdrawn */
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      response_note: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      /** Owner tenant for ALS default — same as to_tenant_id when created by bidder via skip */
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "collaboration_requests",
      indexes: [
        { fields: ["job_ad_id"] },
        { fields: ["from_tenant_id"] },
        { fields: ["to_tenant_id"] },
        { fields: ["status"] },
      ],
    }
  );
};
