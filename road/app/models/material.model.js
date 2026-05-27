module.exports = (sequelize, Sequelize) => {
    const Material = sequelize.define("material", {
      name: {
        type: Sequelize.STRING
      },
      code: {
        type: Sequelize.STRING
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      unit: {
        type: Sequelize.STRING
      },
      reorder_level: {
        type: Sequelize.DECIMAL
      },
      description: {
        type: Sequelize.TEXT
      }
    });
    return Material;
  };
  