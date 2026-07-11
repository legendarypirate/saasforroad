module.exports = (sequelize, Sequelize) => {
  return sequelize.define("pavement", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    station_from: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    station_to: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    layer_name: { type: Sequelize.STRING(100), allowNull: false },
    thickness_mm: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
    material: { type: Sequelize.STRING(100), allowNull: true },
    width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
  });
};
