// models/task.js

module.exports = (sequelize, Sequelize) => {
    const Task = sequelize.define("task", {
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      milestone_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      detail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM("low", "medium", "high", "urgent"),
        defaultValue: "medium",
      },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Task;
  };
  