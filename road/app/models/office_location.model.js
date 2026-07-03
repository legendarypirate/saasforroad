module.exports = (sequelize, Sequelize) => {
  const OfficeLocation = sequelize.define("office_location", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    latitude: {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false,
    },
    longitude: {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false,
    },
    radius_meters: {
      type: Sequelize.INTEGER,
      defaultValue: 100,
    },
    address: {
      type: Sequelize.STRING,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  });

  return OfficeLocation;
};
