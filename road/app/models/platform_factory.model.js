module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "platform_factory",
    {
      /** Owning company account (mobile app user). */
      company_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      owner_name: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(120), allowNull: true },
      /** asphalt | cement | crushing | emulsion | ctb | other */
      plant_type: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "other",
      },
      province: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      image: { type: Sequelize.STRING(512), allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      /** pending | active | rejected | inactive */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rejection_note: { type: Sequelize.STRING(500), allowNull: true },
    },
    { tableName: "platform_factories" }
  );
};
