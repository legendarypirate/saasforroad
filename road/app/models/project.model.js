module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define("project", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    /** PRJ-2026-001 */
    code: {
      type: Sequelize.STRING(40),
      allowNull: true,
    },
    location: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    province: {
      type: Sequelize.STRING(80),
      allowNull: true,
    },
    aimag_soum: {
      type: Sequelize.STRING(120),
      allowNull: true,
    },
    /** Road section e.g. УБ–Дархан */
    road_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    /** I / II / III / IV */
    road_class: {
      type: Sequelize.STRING(10),
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
    length_km: {
      type: Sequelize.DECIMAL(10, 3),
      allowNull: true,
    },
    purpose: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    /** Захиалагч / Employer (legacy alias) */
    client_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    employer_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contractor_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    engineer_org: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    employer_rep: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contractor_rep: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contract_number: {
      type: Sequelize.STRING(80),
      allowNull: true,
    },
    /** FIDIC_Red | FIDIC_Yellow | FIDIC_Silver | Domestic | Other */
    contract_type: {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "Domestic",
    },
    contract_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    currency: {
      type: Sequelize.STRING(8),
      allowNull: true,
      defaultValue: "MNT",
    },
    retention_pct: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 5,
    },
    liquidated_damages_per_day: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    },
    funding_source: {
      type: Sequelize.STRING(120),
      allowNull: true,
    },
    tender_ref: {
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
    contingency_pct: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 10,
    },
    committed_amount: {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
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
    /**
     * mobilization | earthworks | structures | drainage | pavement | finishing | handover | defects
     */
    stage: {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "mobilization",
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
    baseline_start: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    baseline_end: {
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
    /** Optional link to road engineering design project */
    road_project_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Project;
};
