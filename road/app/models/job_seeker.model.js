module.exports = (sequelize, Sequelize) => {
  /**
   * Job seeker profile — a person in the road sector looking for work.
   * Registers via the job_seeker_rcos mobile app. Platform-shared (NOT
   * tenant-scoped): every tenant can browse seekers and send offers, just like
   * the brigade marketplace. Login credentials live here.
   */
  return sequelize.define(
    "job_seeker",
    {
      /** Mobile login credentials. */
      username: { type: Sequelize.STRING(120), allowNull: true, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: true },

      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(160), allowNull: true },
      photo: { type: Sequelize.STRING(512), allowNull: true },

      /** male | female | other */
      gender: { type: Sequelize.STRING(20), allowNull: true },
      birth_date: { type: Sequelize.DATEONLY, allowNull: true },
      register_number: { type: Sequelize.STRING(40), allowNull: true },

      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },

      /** Career fields */
      desired_role: { type: Sequelize.STRING(160), allowNull: true },
      experience_years: {
        type: Sequelize.DECIMAL(5, 1),
        allowNull: false,
        defaultValue: 0,
      },
      /** none | secondary | vocational | bachelor | master | doctorate */
      education_level: { type: Sequelize.STRING(40), allowNull: true },
      skills: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      about: { type: Sequelize.TEXT, allowNull: true },
      salary_expect: { type: Sequelize.DECIMAL(14, 2), allowNull: true },

      /** Open to work toggle. */
      is_available: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      /** active | suspended | inactive */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: "job_seekers", indexes: [{ fields: ["is_available"] }] }
  );
};
