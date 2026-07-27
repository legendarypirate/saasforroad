module.exports = (sequelize, Sequelize) => {
  /** Driver/freelancer applies to an approved tenant job opening. */
  return sequelize.define(
    "driver_job_application",
    {
      opening_id: { type: Sequelize.INTEGER, allowNull: false },
      driver_id: { type: Sequelize.INTEGER, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: true },
      /** pending | accepted | rejected | withdrawn */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      response_note: { type: Sequelize.TEXT, allowNull: true },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "driver_job_applications",
      indexes: [
        { fields: ["opening_id"] },
        { fields: ["driver_id"] },
        { fields: ["tenant_id"] },
        { unique: true, fields: ["opening_id", "driver_id"] },
      ],
    }
  );
};
