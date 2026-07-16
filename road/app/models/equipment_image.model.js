module.exports = (sequelize, Sequelize) => {
  const EquipmentImage = sequelize.define(
    "equipment_image",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      public_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      caption: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "equipment_images",
    }
  );

  return EquipmentImage;
};
