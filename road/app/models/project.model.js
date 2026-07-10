module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define("project", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    location: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /** Road section e.g. УБ–Дархан */
    road_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    km_from: {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
    },
    km_to: {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
    },
    purpose: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    /** Захиалагч */
    client_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contract_number: {
      type: Sequelize.STRING(80),
      allowNull: true,
    },
    engineer: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    budget: {
      type: Sequelize.DECIMAL(18, 2),
      defaultValue: 0.0,
    },
    equipment: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /**
     * 1 = Төлөвлөсөн
     * 2 = Явагдаж буй
     * 3 = Дууссан
     * 4 = Архивласан
     */
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },
    staff: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    planned_start: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    planned_end: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    actual_start: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    actual_end: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    /** Physical progress % (km / volume) — manual or synced from phases */
    progress_percent: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    progress_unit: {
      type: Sequelize.STRING(20),
      defaultValue: "%",
    },
    progress_planned: {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: true,
    },
    progress_actual: {
      type: Sequelize.DECIMAL(12, 3),
      allowNull: true,
    },
    season_note: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return Project;
};
