module.exports = (sequelize, Sequelize) => {
  return sequelize.define("ground_profile", {
    alignment_id: { type: Sequelize.INTEGER, allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
    ground_elevation: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
