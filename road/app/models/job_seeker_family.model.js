module.exports = (sequelize, Sequelize) => {
  /** A family member (family state). Platform-shared child of job_seeker. */
  return sequelize.define(
    "job_seeker_family",
    {
      job_seeker_id: { type: Sequelize.INTEGER, allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      /** father | mother | spouse | sibling | child | other */
      relation: { type: Sequelize.STRING(60), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      job: { type: Sequelize.STRING(160), allowNull: true },
      workplace: { type: Sequelize.STRING(255), allowNull: true },
    },
    { tableName: "job_seeker_families", indexes: [{ fields: ["job_seeker_id"] }] }
  );
};
