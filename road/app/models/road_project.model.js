module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_project", {
    code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    name: { type: Sequelize.STRING(255), allowNull: false },
    road_class: { type: Sequelize.STRING(50), allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    province: { type: Sequelize.STRING(100), allowNull: true },
    district: { type: Sequelize.STRING(100), allowNull: true },
    start_station: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    end_station: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    length: { type: Sequelize.DECIMAL(12, 3), allowNull: true, defaultValue: 0 },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "draft" },
    progress: { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
    designer: { type: Sequelize.STRING(150), allowNull: true },
    contractor: { type: Sequelize.STRING(150), allowNull: true },
    consultant: { type: Sequelize.STRING(150), allowNull: true },
    start_date: { type: Sequelize.DATEONLY, allowNull: true },
    end_date: { type: Sequelize.DATEONLY, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
