module.exports = (sequelize, Sequelize) => {
  const ContractTermination = sequelize.define("contract_termination", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    termination_order_number: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    termination_date: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return ContractTermination;
};
