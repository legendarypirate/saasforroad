module.exports = (sequelize, Sequelize) => {
  const Attendance = sequelize.define("attendance", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    work_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    check_in_at: {
      type: Sequelize.DATE,
    },
    check_out_at: {
      type: Sequelize.DATE,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "present",
    },
    notes: {
      type: Sequelize.TEXT,
    },
    latitude: {
      type: Sequelize.STRING,
    },
    longitude: {
      type: Sequelize.STRING,
    },
    office_location_id: {
      type: Sequelize.INTEGER,
    },
    distance_meters: {
      type: Sequelize.INTEGER,
    },
    check_out_latitude: {
      type: Sequelize.STRING,
    },
    check_out_longitude: {
      type: Sequelize.STRING,
    },
    check_out_office_location_id: {
      type: Sequelize.INTEGER,
    },
    check_out_distance_meters: {
      type: Sequelize.INTEGER,
    },
  });

  return Attendance;
};
