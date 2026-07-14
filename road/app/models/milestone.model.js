module.exports = (sequelize, Sequelize) => {
    const Milestone = sequelize.define("milestone", {
      name: {
        type: Sequelize.STRING
      },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Milestone;
  };
  