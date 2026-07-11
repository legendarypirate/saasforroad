module.exports = (sequelize, Sequelize) => {
  return sequelize.define("survey_point", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    offset: { type: Sequelize.DECIMAL(10, 3), allowNull: true, defaultValue: 0 },
    northing: { type: Sequelize.DECIMAL(14, 4), allowNull: true },
    easting: { type: Sequelize.DECIMAL(14, 4), allowNull: true },
    elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
    point_code: { type: Sequelize.STRING(50), allowNull: true },
    description: { type: Sequelize.STRING(255), allowNull: true },
  });
};
