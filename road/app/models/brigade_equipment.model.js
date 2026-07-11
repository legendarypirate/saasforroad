module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_equipment",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      equipment_id: { type: Sequelize.INTEGER, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "brigade_equipment" }
  );
};
