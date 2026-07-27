module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "service_man_service",
    {
      service_man_id: { type: Sequelize.INTEGER, allowNull: false },
      assist_service_id: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      tableName: "service_man_services",
      indexes: [
        {
          unique: true,
          fields: ["service_man_id", "assist_service_id"],
        },
      ],
    }
  );
};
