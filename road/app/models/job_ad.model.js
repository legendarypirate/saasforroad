module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "job_ad",
    {
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      /** subcontractor | partner | specialist */
      role_sought: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "subcontractor",
      },
      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      budget_note: { type: Sequelize.STRING(255), allowNull: true },
      starts_at: { type: Sequelize.DATEONLY, allowNull: true },
      closes_at: { type: Sequelize.DATEONLY, allowNull: true },
      /** Snapshots for cross-tenant marketplace browse */
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      project_name: { type: Sequelize.STRING(255), allowNull: true },
      /** draft | published | closed | filled */
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "draft",
      },
      published_at: { type: Sequelize.DATE, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "job_ads",
      indexes: [
        { fields: ["tenant_id"] },
        { fields: ["project_id"] },
        { fields: ["status"] },
        { fields: ["role_sought"] },
      ],
    }
  );
};
