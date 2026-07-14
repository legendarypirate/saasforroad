module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fuel_consumption", {
    equipment_id: { type: Sequelize.INTEGER, allowNull: false },
    driver_user_id: { type: Sequelize.INTEGER },
    previous_issue_id: { type: Sequelize.INTEGER },
    closing_issue_id: { type: Sequelize.INTEGER, allowNull: false },
    period_from: { type: Sequelize.DATEONLY },
    period_to: { type: Sequelize.DATEONLY },
    distance_km: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
    fuel_used: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
    consumption_rate: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
    standard_rate: { type: Sequelize.DECIMAL(18, 3), allowNull: false, defaultValue: 30 },
    is_high: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    fuel_type: { type: Sequelize.STRING(40) },
    notes: { type: Sequelize.TEXT },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
