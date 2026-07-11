module.exports = (sequelize, Sequelize) => {
  return sequelize.define("design_profile_point", {
    vertical_alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    design_elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
    grade: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
  });
};
