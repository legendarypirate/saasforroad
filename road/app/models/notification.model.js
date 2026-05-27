// models/item.js

module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notification", {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
    return Notification;
};
  