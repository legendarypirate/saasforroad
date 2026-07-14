module.exports = (sequelize, Sequelize) => {
  return sequelize.define("cross_section", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    road_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    lane_count: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 2 },
    shoulder_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    median_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true, defaultValue: 0 },
    left_slope: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    right_slope: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
