module.exports = (sequelize, Sequelize) => {
  const PlatformLanding = sequelize.define(
    "platform_landing_setting",
    {
      content: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      tableName: "platform_landing_settings",
    }
  );

  return PlatformLanding;
};
