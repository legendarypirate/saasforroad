module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "hse_daily_instruction_ack",
    {
      instruction_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      ack_date: { type: Sequelize.DATEONLY, allowNull: false },
      ack_time: { type: Sequelize.DATE, allowNull: false },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      device_info: { type: Sequelize.JSONB, allowNull: true },
      signature_url: { type: Sequelize.STRING(500), allowNull: true },
      instruction_version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      offline_synced: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["user_id", "ack_date"],
          name: "hse_daily_instruction_ack_user_date_unique",
        },
      ],
    }
  );
};
