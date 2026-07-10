module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_equipment_inspection", {
    equipment_id: { type: Sequelize.INTEGER, allowNull: false },
    operator_id: { type: Sequelize.INTEGER, allowNull: true },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    inspected_at: { type: Sequelize.DATE, allowNull: false },
    defects: { type: Sequelize.TEXT, allowNull: true },
    photos: { type: Sequelize.JSONB, allowNull: true },
    maintenance_requested: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "completed" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
