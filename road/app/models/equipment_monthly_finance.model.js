module.exports = (sequelize, Sequelize) => {
  const EquipmentMonthlyFinance = sequelize.define(
    "equipment_monthly_finance",
    {
      equipment_id: { type: Sequelize.INTEGER, allowNull: false },
      year: { type: Sequelize.INTEGER, allowNull: false },
      month: { type: Sequelize.INTEGER, allowNull: false },
      rental_income: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      operator_salary: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      oil_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      service_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      fuel_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      other_cost: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
      notes: { type: Sequelize.TEXT, allowNull: true },
    },
    {
      tableName: "equipment_monthly_finances",
      indexes: [
        {
          unique: true,
          fields: ["equipment_id", "year", "month"],
        },
      ],
    }
  );
  return EquipmentMonthlyFinance;
};
