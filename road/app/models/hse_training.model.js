module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_training", {
    name: { type: Sequelize.STRING(255), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: false },
    validity_months: { type: Sequelize.INTEGER, allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
