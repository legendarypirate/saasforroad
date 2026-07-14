module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define("category", {
    name: {
      type: Sequelize.STRING
    },
    is_shown: {
      type: Sequelize.STRING
    },
    parent_id: {
      type: Sequelize.INTEGER
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return Category;
};
