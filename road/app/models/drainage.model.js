module.exports = (sequelize, Sequelize) => {
  return sequelize.define("drainage", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    type: { type: Sequelize.STRING(40), allowNull: false },
    station: { type: Sequelize.DECIMAL(12, 3), allowNull: true },
    length: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
    diameter: { type: Sequelize.DECIMAL(8, 3), allowNull: true },
    material: { type: Sequelize.STRING(100), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
