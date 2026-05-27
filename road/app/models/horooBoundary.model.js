module.exports = (sequelize, Sequelize) => {
  const HorooBoundary = sequelize.define("horoo_boundary", {
    horoo_number: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    geom: {
      type: Sequelize.GEOMETRY("POLYGON", 4326), // маш хүчирхэг spatial талбар
      allowNull: false
    }
  });

  return HorooBoundary;
};
