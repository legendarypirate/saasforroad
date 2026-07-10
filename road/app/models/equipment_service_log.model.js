module.exports = (sequelize, Sequelize) => {
  const EquipmentServiceLog = sequelize.define(
    "equipment_service_log",
    {
      equipment_id: { type: Sequelize.INTEGER, allowNull: false },
      service_date: { type: Sequelize.DATEONLY, allowNull: false },
      motor_hours: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      /** ТО | Засвар | Бусад */
      service_type: { type: Sequelize.STRING, defaultValue: "ТО" },
      description: { type: Sequelize.TEXT, allowNull: true },
      parts_replaced: { type: Sequelize.TEXT, allowNull: true },
      cost: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      service_provider: { type: Sequelize.STRING, allowNull: true },
      engineer: { type: Sequelize.STRING, allowNull: true },
      next_service_date: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "equipment_service_logs" }
  );
  return EquipmentServiceLog;
};
