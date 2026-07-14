module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_near_miss", {
    description: { type: Sequelize.TEXT, allowNull: false },
    photos: { type: Sequelize.JSONB, allowNull: true },
    location: { type: Sequelize.STRING(255), allowNull: true },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    witness: { type: Sequelize.STRING(255), allowNull: true },
    immediate_action: { type: Sequelize.TEXT, allowNull: true },
    root_cause: { type: Sequelize.TEXT, allowNull: true },
    corrective_action: { type: Sequelize.TEXT, allowNull: true },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    reported_by: { type: Sequelize.INTEGER, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "open" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
