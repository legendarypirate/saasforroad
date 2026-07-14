module.exports = (sequelize, Sequelize) => {
  const Feedback = sequelize.define("feedback", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    is_anonymous: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "new",
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return Feedback;
};
