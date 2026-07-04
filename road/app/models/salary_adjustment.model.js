module.exports = (sequelize, Sequelize) => {
  const SalaryAdjustment = sequelize.define(
    "salary_adjustment",
    {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      deduction: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      additional_deduction: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      note: {
        type: Sequelize.STRING(500),
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["user_id", "month"],
        },
      ],
    }
  );

  return SalaryAdjustment;
};
