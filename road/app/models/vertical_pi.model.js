module.exports = (sequelize, Sequelize) => {
  return sequelize.define("vertical_pi", {
    vertical_alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
    curve_type: { type: Sequelize.STRING(30), allowNull: true, defaultValue: "parabola" },
    curve_length: { type: Sequelize.DECIMAL(10, 3), allowNull: true, defaultValue: 0 },
    curve_radius: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    grade_in: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
    grade_out: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
