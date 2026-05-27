module.exports = (sequelize, Sequelize) => {
    const Transaction = sequelize.define("transaction", {
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('in', 'out'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      total_price: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
    });
  
    return Transaction;
  };
  