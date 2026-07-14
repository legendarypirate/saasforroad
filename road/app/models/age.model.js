module.exports = (sequelize, Sequelize) => {
    const Age = sequelize.define("age", {
      age: {
        type: Sequelize.STRING
      },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Age;
  };
  