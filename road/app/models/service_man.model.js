module.exports = (sequelize, Sequelize) => {
  /** Service man app user — roadside helper. */
  return sequelize.define(
    "service_man",
    {
      username: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(160), allowNull: true },
      photo: { type: Sequelize.STRING(512), allowNull: true },
      vehicle_label: { type: Sequelize.STRING(160), allowNull: true },
      about: { type: Sequelize.TEXT, allowNull: true },
      last_lat: { type: Sequelize.DOUBLE, allowNull: true },
      last_lng: { type: Sequelize.DOUBLE, allowNull: true },
      is_online: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
    },
    { tableName: "service_men" }
  );
};
