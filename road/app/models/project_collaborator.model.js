module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "project_collaborator",
    {
      project_id: { type: Sequelize.INTEGER, allowNull: false },
      owner_tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      collaborator_tenant_id: { type: Sequelize.INTEGER, allowNull: false },
      /** owner_primary | subcontractor | partner | specialist */
      role: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: "subcontractor",
      },
      /** active | removed */
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "active",
      },
      collaboration_request_id: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    {
      tableName: "project_collaborators",
      indexes: [
        { fields: ["project_id"] },
        { fields: ["collaborator_tenant_id"] },
        { fields: ["owner_tenant_id"] },
        {
          unique: true,
          fields: ["project_id", "collaborator_tenant_id", "status"],
          name: "project_collaborators_active_pair",
        },
      ],
    }
  );
};
