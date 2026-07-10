module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_environmental_record", {
    record_type: { type: Sequelize.STRING(40), allowNull: false },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    value: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    unit: { type: Sequelize.STRING(30), allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
    reported_by: { type: Sequelize.INTEGER, allowNull: true },
    incident_linked_id: { type: Sequelize.INTEGER, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
