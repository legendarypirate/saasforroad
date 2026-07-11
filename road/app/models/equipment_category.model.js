module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "equipment_category",
    {
      name: { type: Sequelize.STRING(120), allowNull: false },
      code: { type: Sequelize.STRING(40), allowNull: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "equipment_categories" }
  );
};
