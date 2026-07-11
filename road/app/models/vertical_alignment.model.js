module.exports = (sequelize, Sequelize) => {
  return sequelize.define("vertical_alignment", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(150), allowNull: false },
    design_speed: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
    min_grade: { type: Sequelize.DECIMAL(8, 4), allowNull: true },
    max_grade: { type: Sequelize.DECIMAL(8, 4), allowNull: true },
  });
};
