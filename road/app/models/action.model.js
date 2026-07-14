module.exports = (sequelize, Sequelize) => {
  const Action = sequelize.define("action", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "open",
    },
    priority: {
      type: Sequelize.STRING,
      defaultValue: "medium",
    },
    document_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return Action;
};
