module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade",
    {
      name: { type: Sequelize.STRING(255), allowNull: false },
      logo: { type: Sequelize.STRING(512), allowNull: true },
      /** Login credentials live on brigades — never on company users. */
      username: { type: Sequelize.STRING(120), allowNull: true, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: true },
      leader_name: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      /** @deprecated kept nullable for legacy rows; do not use for identity */
      leader_user_id: { type: Sequelize.INTEGER, allowNull: true },
      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      contact_phone: { type: Sequelize.STRING(40), allowNull: true },
      contact_email: { type: Sequelize.STRING(120), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      skills: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      /** available | busy | unavailable */
      availability: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "available",
      },
      /** active | suspended | inactive */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
      average_rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reputation_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      safety_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
      },
      completed_tasks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      active_tasks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cancelled_tasks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      completion_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
      },
      average_delay: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },
      attendance_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
      },
      response_time_hours: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 24,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: "brigades" }
  );
};
