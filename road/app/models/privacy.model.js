module.exports = (sequelize, Sequelize) => {
    const Privacy = sequelize.define("privacy", {
      privacy: {
        type: Sequelize.TEXT, // Ensure it's TEXT, not STRING(255)
        allowNull: true
      }
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Privacy;
  };
  