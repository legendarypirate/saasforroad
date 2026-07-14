module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_observation", {
    observation_type: {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "unsafe_condition",
    },
    description: { type: Sequelize.TEXT, allowNull: false },
    photo_url: { type: Sequelize.STRING(500), allowNull: true },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    priority: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "medium" },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    reported_by: { type: Sequelize.INTEGER, allowNull: true },
    responsible_user_id: { type: Sequelize.INTEGER, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "open" },
    assigned_at: { type: Sequelize.DATE, allowNull: true },
    corrected_at: { type: Sequelize.DATE, allowNull: true },
    verified_at: { type: Sequelize.DATE, allowNull: true },
    closed_at: { type: Sequelize.DATE, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
