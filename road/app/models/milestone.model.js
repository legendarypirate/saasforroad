module.exports = (sequelize, Sequelize) => {
    const Milestone = sequelize.define("milestone", {
      name: {
        type: Sequelize.STRING
      },
   
    });
  
    return Milestone;
  };
  