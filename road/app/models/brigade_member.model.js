module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_member",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      /** Local member identity — not a company user. */
      full_name: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      /** @deprecated optional legacy link; prefer full_name */
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      position: {
        type: Sequelize.STRING(120),
        allowNull: false,
        defaultValue: "member",
      },
      skills: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      experience_years: { type: Sequelize.DECIMAL(4, 1), allowNull: true },
      attendance_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
      },
      /** active | inactive */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
      current_assignment: { type: Sequelize.STRING(255), allowNull: true },
      photo: { type: Sequelize.STRING(512), allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "brigade_members" }
  );
};
