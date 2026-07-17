module.exports = (sequelize, Sequelize) => {
  /** A school the job seeker graduated from. Platform-shared child of job_seeker. */
  return sequelize.define(
    "job_seeker_school",
    {
      job_seeker_id: { type: Sequelize.INTEGER, allowNull: false },
      school_name: { type: Sequelize.STRING(255), allowNull: false },
      major: { type: Sequelize.STRING(255), allowNull: true },
      degree: { type: Sequelize.STRING(120), allowNull: true },
      start_year: { type: Sequelize.STRING(10), allowNull: true },
      graduation_year: { type: Sequelize.STRING(10), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: "job_seeker_schools", indexes: [{ fields: ["job_seeker_id"] }] }
  );
};
