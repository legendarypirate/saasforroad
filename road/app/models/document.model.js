module.exports = (sequelize, Sequelize) => {
    const Document = sequelize.define("document", {
      name: {
        type: Sequelize.STRING
      },
      parent_id: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      file_url: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
    
    });
  
    return Document;
  };
  