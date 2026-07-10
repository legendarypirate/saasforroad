module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_incident", {
    incident_type: { type: Sequelize.STRING(40), allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    photos: { type: Sequelize.JSONB, allowNull: true },
    location: { type: Sequelize.STRING(255), allowNull: true },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    witnesses: { type: Sequelize.JSONB, allowNull: true },
    investigation: { type: Sequelize.TEXT, allowNull: true },
    root_cause: { type: Sequelize.TEXT, allowNull: true },
    corrective_actions: { type: Sequelize.JSONB, allowNull: true },
    severity: { type: Sequelize.STRING(20), allowNull: true },
    injury_details: { type: Sequelize.TEXT, allowNull: true },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    reported_by: { type: Sequelize.INTEGER, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "reported" },
    approved_by: { type: Sequelize.INTEGER, allowNull: true },
    approved_at: { type: Sequelize.DATE, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
