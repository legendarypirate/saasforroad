module.exports = (sequelize, Sequelize) => {
  const ProjectEquipmentLink = sequelize.define(
    "project_equipment_link",
    {
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "project_equipment_links",
      indexes: [
        {
          unique: true,
          fields: ["project_id", "equipment_id"],
        },
      ],
    }
  );

  return ProjectEquipmentLink;
};
