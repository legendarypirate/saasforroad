module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_toolbox_meeting", {
    topic: { type: Sequelize.STRING(255), allowNull: false },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    supervisor_id: { type: Sequelize.INTEGER, allowNull: true },
    meeting_at: { type: Sequelize.DATE, allowNull: false },
    notes: { type: Sequelize.TEXT, allowNull: true },
    photos: { type: Sequelize.JSONB, allowNull: true },
    signature_url: { type: Sequelize.STRING(500), allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "completed" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
