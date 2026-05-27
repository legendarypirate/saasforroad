module.exports = (sequelize, Sequelize) => {
    const Stock = sequelize.define("stock", {
      item_id: {
        type: Sequelize.INTEGER
      },
      warehouse_id: {
        type: Sequelize.INTEGER
      },
      quantity: {
        type: Sequelize.INTEGER
      },
    });
  
    return Stock;
  };
  