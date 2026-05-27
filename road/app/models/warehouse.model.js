module.exports = (sequelize, Sequelize) => {
    const Warehouse = sequelize.define("warehouse", {
      name: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      description: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
     
    });
  
    return Warehouse;
  };
  