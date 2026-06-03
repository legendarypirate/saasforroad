module.exports = (sequelize, Sequelize) => {
  const EquipmentOilChange = sequelize.define("equipment_oil_change", {
    equipment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    changed_at: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    oil_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    motor_hours_at_change: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    },
    quantity_liters: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: { type: Sequelize.TEXT, allowNull: true },
    changed_by: { type: Sequelize.STRING, allowNull: true },
  });

  return EquipmentOilChange;
};
