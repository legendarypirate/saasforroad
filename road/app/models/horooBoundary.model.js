module.exports = (sequelize, Sequelize) => {
  const HorooBoundary = sequelize.define("horoo_boundary", {
    horoo_number: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    geom: {
      // GeoJSON string; avoids hard dependency on PostGIS for server startup.
      // Enable PostGIS later if native spatial queries are needed.
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return HorooBoundary;
};
