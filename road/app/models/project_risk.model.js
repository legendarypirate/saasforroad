module.exports = (sequelize, Sequelize) => {
  const ProjectRisk = sequelize.define("project_risk", {
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    /** hse | schedule | cost | quality | weather | stakeholder */
    category: {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "schedule",
    },
    likelihood: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
    },
    impact: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
    },
    score: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 9,
    },
    residual_score: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    /** open | mitigating | closed | accepted */
    status: {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: "open",
    },
    owner: {
      type: Sequelize.STRING(120),
      allowNull: true,
    },
    mitigation: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return ProjectRisk;
};
