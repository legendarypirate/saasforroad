module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_risk_assessment", {
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    activity: { type: Sequelize.STRING(255), allowNull: false },
    hazard: { type: Sequelize.TEXT, allowNull: false },
    risk_level: { type: Sequelize.STRING(20), allowNull: true },
    likelihood: { type: Sequelize.STRING(20), allowNull: true },
    severity: { type: Sequelize.STRING(20), allowNull: true },
    control_measures: { type: Sequelize.TEXT, allowNull: true },
    responsible_user_id: { type: Sequelize.INTEGER, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "draft" },
    approved_by: { type: Sequelize.INTEGER, allowNull: true },
    approved_at: { type: Sequelize.DATE, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
