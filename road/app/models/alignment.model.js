module.exports = (sequelize, Sequelize) => {
  return sequelize.define("alignment", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(150), allowNull: false },
    type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "CENTERLINE" },
    length: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    start_station: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    end_station: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
