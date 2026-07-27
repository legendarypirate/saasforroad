module.exports = (sequelize, Sequelize) => {
  /** Freelancer / driver app user — roadside help requester + job seeker anket. */
  return sequelize.define(
    "road_driver",
    {
      username: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(160), allowNull: true },
      photo: { type: Sequelize.STRING(512), allowNull: true },
      vehicle_label: { type: Sequelize.STRING(160), allowNull: true },
      plate_number: { type: Sequelize.STRING(40), allowNull: true },

      /** Linked tenant mobile user (Road app driver making assist calls). */
      tenant_user_id: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },

      /** Anket / CV fields for job applications */
      gender: { type: Sequelize.STRING(20), allowNull: true },
      birth_date: { type: Sequelize.DATEONLY, allowNull: true },
      register_number: { type: Sequelize.STRING(40), allowNull: true },
      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      desired_role: { type: Sequelize.STRING(160), allowNull: true },
      experience_years: {
        type: Sequelize.DECIMAL(5, 1),
        allowNull: true,
      },
      education_level: { type: Sequelize.STRING(40), allowNull: true },
      license_category: { type: Sequelize.STRING(40), allowNull: true },
      about: { type: Sequelize.TEXT, allowNull: true },
      salary_expect: { type: Sequelize.DECIMAL(14, 2), allowNull: true },

      last_lat: { type: Sequelize.DOUBLE, allowNull: true },
      last_lng: { type: Sequelize.DOUBLE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
    },
    { tableName: "road_drivers" }
  );
};
