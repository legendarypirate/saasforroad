module.exports = (sequelize, Sequelize) => {
  const CareerChange = sequelize.define("career_change", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    order_number: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    position: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    effective_date: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    contract_end_date: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return CareerChange;
};
