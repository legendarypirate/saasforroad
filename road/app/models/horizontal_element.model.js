module.exports = (sequelize, Sequelize) => {
  return sequelize.define("horizontal_element", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    element_type: { type: Sequelize.STRING(30), allowNull: false },
    start_station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    end_station: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    length: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    radius: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    spiral_param: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    bearing: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
    azimuth: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
    northing: { type: Sequelize.DECIMAL(14, 4), allowNull: true },
    easting: { type: Sequelize.DECIMAL(14, 4), allowNull: true },
    remarks: { type: Sequelize.STRING(255), allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
  });
};
