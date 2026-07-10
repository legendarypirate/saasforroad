module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_inspection", {
    template_id: { type: Sequelize.INTEGER, allowNull: true },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    equipment_id: { type: Sequelize.INTEGER, allowNull: true },
    inspected_by: { type: Sequelize.INTEGER, allowNull: true },
    inspected_at: { type: Sequelize.DATE, allowNull: false },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    overall_result: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "pass" },
    comments: { type: Sequelize.TEXT, allowNull: true },
    photos: { type: Sequelize.JSONB, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "completed" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
