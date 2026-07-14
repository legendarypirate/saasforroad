module.exports = (sequelize, Sequelize) => {
  const UserAward = sequelize.define("user_award", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    award_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    award_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    award_date: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return UserAward;
};
