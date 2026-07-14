module.exports = (sequelize, Sequelize) => {
  const Warehouse = sequelize.define("warehouse", {
    code: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING, allowNull: false },
    location: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    manager_id: { type: Sequelize.INTEGER },
    capacity: { type: Sequelize.DECIMAL(14, 2) },
    status: { type: Sequelize.STRING, defaultValue: "active" },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    deleted_at: { type: Sequelize.DATE },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
  return Warehouse;
};
