module.exports = (sequelize, Sequelize) => {
  const Equipment = sequelize.define(
    "equipment",
    {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      registration_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      motor_hours: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      photo_front: { type: Sequelize.STRING, allowNull: true },
      photo_back: { type: Sequelize.STRING, allowNull: true },
      photo_left: { type: Sequelize.STRING, allowNull: true },
      photo_right: { type: Sequelize.STRING, allowNull: true },
      certificate_image: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
    },
    {
      tableName: "equipments",
    }
  );

  return Equipment;
};
