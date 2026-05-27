// models/item.js

module.exports = (sequelize, Sequelize) => {
    const Item = sequelize.define("item", {
      item: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "declined", "completed"),
        defaultValue: "pending",
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  
    return Item;
  };
  