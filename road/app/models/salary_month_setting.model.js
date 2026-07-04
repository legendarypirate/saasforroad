module.exports = (sequelize, Sequelize) => {
  const SalaryMonthSetting = sequelize.define(
    "salary_month_setting",
    {
      month: {
        type: Sequelize.STRING(7),
        allowNull: false,
        unique: true,
      },
      expected_hours: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 176,
      },
    }
  );

  return SalaryMonthSetting;
};
