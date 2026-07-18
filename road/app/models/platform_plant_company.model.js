module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "platform_plant_company",
    {
      username: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      /** Company / organization display name */
      name: { type: Sequelize.STRING(255), allowNull: false },
      contact_name: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(40), allowNull: true },
      email: { type: Sequelize.STRING(120), allowNull: true },
      province: { type: Sequelize.STRING(120), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      /** active | inactive */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "active",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: "platform_plant_companies" }
  );
};
