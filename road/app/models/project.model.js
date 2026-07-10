module.exports = (sequelize, Sequelize) => {
    const Project = sequelize.define("project", {
      name: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      purpose: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      engineer: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      budget: {
        type: Sequelize.DECIMAL(18, 2), // 18 digits total, 2 after the decimal
        defaultValue: 0.00
      },
      equipment: {
        type: Sequelize.STRING,
        defaultValue: 0
      },   
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      staff: {
        type: Sequelize.STRING,
        defaultValue: 0
      },      
    });
  
    return Project;
  };
  