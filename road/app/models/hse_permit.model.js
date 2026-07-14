module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_permit", {
    permit_type: { type: Sequelize.STRING(40), allowNull: false },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: false },
    location: { type: Sequelize.STRING(255), allowNull: true },
    requested_by: { type: Sequelize.INTEGER, allowNull: true },
    start_at: { type: Sequelize.DATE, allowNull: true },
    end_at: { type: Sequelize.DATE, allowNull: true },
    checklist: { type: Sequelize.JSONB, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "requested" },
    supervisor_approved_by: { type: Sequelize.INTEGER, allowNull: true },
    supervisor_approved_at: { type: Sequelize.DATE, allowNull: true },
    hse_approved_by: { type: Sequelize.INTEGER, allowNull: true },
    hse_approved_at: { type: Sequelize.DATE, allowNull: true },
    manager_approved_by: { type: Sequelize.INTEGER, allowNull: true },
    manager_approved_at: { type: Sequelize.DATE, allowNull: true },
    closed_at: { type: Sequelize.DATE, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
