module.exports = (sequelize, Sequelize) => {
  return sequelize.define("typical_section", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(150), allowNull: false },
    template_key: { type: Sequelize.STRING(50), allowNull: true },
    road_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    lane_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    lane_count: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 2 },
    shoulder_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    side_slope: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    ditch_width: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
  });
};
