module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_issue", {
    number: { type: Sequelize.STRING(60), allowNull: false },
    issue_date: { type: Sequelize.DATEONLY, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    project_id: { type: Sequelize.INTEGER },
    issued_by: { type: Sequelize.INTEGER },
    status: { type: Sequelize.STRING(30), defaultValue: "issued" },
    notes: { type: Sequelize.TEXT },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
