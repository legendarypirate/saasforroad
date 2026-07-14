module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "hire_request_history",
    {
      hire_request_id: { type: Sequelize.INTEGER, allowNull: false },
      from_status: { type: Sequelize.STRING(30), allowNull: true },
      to_status: { type: Sequelize.STRING(30), allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      changed_by: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "hire_request_history" }
  );
};
