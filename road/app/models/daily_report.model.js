module.exports = (sequelize, Sequelize) => {
  const DailyReport = sequelize.define("daily_report", {
    report_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "submitted",
    },
    weather_note: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    progress_planned: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    progress_actual: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    progress_unit: {
      type: Sequelize.STRING(32),
      allowNull: true,
      defaultValue: "%",
    },
    progress_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    safety_incidents: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    safety_near_misses: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    safety_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    labor_planned: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    labor_present: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    labor_absent: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    labor_overtime: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    labor_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    equipment_working: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    equipment_idle: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    equipment_broken: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    equipment_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    materials_shortages: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    materials_note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    attention_needed: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return DailyReport;
};
