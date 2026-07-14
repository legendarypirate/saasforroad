module.exports = (sequelize, Sequelize) => {
  const ProjectMilestone = sequelize.define("project_milestone", {
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    /** contractual | technical | payment */
    type: {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "technical",
    },
    due_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    actual_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    /** pending | achieved | delayed | waived */
    status: {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: "pending",
    },
    weight: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    criteria: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    sort_order: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return ProjectMilestone;
};
