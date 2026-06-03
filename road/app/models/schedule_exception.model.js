module.exports = (sequelize, Sequelize) => {
  const ScheduleException = sequelize.define("schedule_exception", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    override_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    reason: {
      type: Sequelize.TEXT,
    },
  });

  return ScheduleException;
};
