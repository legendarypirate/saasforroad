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
      /** machine | tool | material */
      category: {
        type: Sequelize.STRING,
        defaultValue: "machine",
      },
      unit: {
        type: Sequelize.STRING,
        defaultValue: "ширхэг",
      },
      default_daily_rate: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      is_rentable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "available", // available | rented | maintenance | retired
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
