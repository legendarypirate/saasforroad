module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "personal_note_reminder",
    {
      personal_note_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
      reminder_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      deadline_date: { type: Sequelize.DATEONLY, allowNull: false },
    },
    {
      tableName: "personal_note_reminders",
      indexes: [
        {
          unique: true,
          fields: ["personal_note_id", "reminder_type", "deadline_date"],
        },
      ],
    }
  );
};
