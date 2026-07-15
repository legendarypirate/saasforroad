module.exports = (sequelize, Sequelize) => {
  const PlatformDataEntry = sequelize.define(
    "platform_data_entry",
    {
      /** brigada | job-seeker | factory | student | laboratory | technique | road-sign */
      kind: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      contact_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      province: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      /** Extra fields per kind (skills, school, plant_type, …) */
      meta: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      image: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "active",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "platform_data_entries",
      indexes: [{ fields: ["kind"] }, { fields: ["is_active"] }],
    }
  );

  return PlatformDataEntry;
};
