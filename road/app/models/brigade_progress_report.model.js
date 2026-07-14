module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_progress_report",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      hire_request_id: { type: Sequelize.INTEGER, allowNull: true },
      report_date: { type: Sequelize.DATEONLY, allowNull: false },
      work_completed: { type: Sequelize.TEXT, allowNull: true },
      worker_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      equipment_used: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      materials_used: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      photos: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      comments: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "brigade_progress_reports" }
  );
};
