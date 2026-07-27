module.exports = (sequelize, Sequelize) => {
  /**
   * Tenant job opening for drivers/freelancers (freelancer mobile app).
   * Platform admin must approve before it appears in the app.
   */
  return sequelize.define(
    "driver_job_opening",
    {
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      position_type: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: "driver",
      },
      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      salary_note: { type: Sequelize.STRING(255), allowNull: true },
      requirements: { type: Sequelize.TEXT, allowNull: true },
      headcount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      closes_at: { type: Sequelize.DATEONLY, allowNull: true },
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      project_name: { type: Sequelize.STRING(255), allowNull: true },
      /** draft | pending | approved | rejected | closed */
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "draft",
      },
      admin_note: { type: Sequelize.TEXT, allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      reviewed_by: { type: Sequelize.INTEGER, allowNull: true },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "driver_job_openings",
      indexes: [
        { fields: ["tenant_id"] },
        { fields: ["project_id"] },
        { fields: ["status"] },
      ],
    }
  );
};
