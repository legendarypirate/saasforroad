module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_daily_report", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    report_date: { type: Sequelize.DATEONLY, allowNull: false },
    hours_run: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
    downtime_hours: { type: Sequelize.DECIMAL(8, 2), defaultValue: 0 },
    downtime_reason: { type: Sequelize.STRING, allowNull: true },
    quantity_produced: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    quantity_shipped: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    quantity_stock: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    fuel_used: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
    power_kwh: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
    weather: { type: Sequelize.STRING(80), allowNull: true },
    shift_count: { type: Sequelize.INTEGER, defaultValue: 1 },
    headcount: { type: Sequelize.INTEGER, defaultValue: 0 },
    summary: { type: Sequelize.TEXT, allowNull: true },
    /** draft | submitted | approved */
    status: { type: Sequelize.STRING(20), defaultValue: "submitted" },
    created_by_name: { type: Sequelize.STRING, allowNull: true },
  });
};
