module.exports = (sequelize, Sequelize) => {
  const ProjectPhase = sequelize.define("project_phase", {
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    completion_percent: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    color: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    sort_order: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  });

  return ProjectPhase;
};
