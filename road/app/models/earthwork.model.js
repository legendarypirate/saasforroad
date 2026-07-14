module.exports = (sequelize, Sequelize) => {
  return sequelize.define("earthwork", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    ground_elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
    design_elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
    cut_depth: { type: Sequelize.DECIMAL(10, 3), allowNull: true, defaultValue: 0 },
    fill_depth: { type: Sequelize.DECIMAL(10, 3), allowNull: true, defaultValue: 0 },
    cut_area: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    fill_area: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    cut_volume: { type: Sequelize.DECIMAL(14, 3), allowNull: true, defaultValue: 0 },
    fill_volume: { type: Sequelize.DECIMAL(14, 3), allowNull: true, defaultValue: 0 },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
