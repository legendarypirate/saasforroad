module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_request", {
    request_date: { type: Sequelize.DATEONLY, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    project_id: { type: Sequelize.INTEGER },
    item_id: { type: Sequelize.INTEGER, allowNull: false },
    size: { type: Sequelize.STRING(40) },
    qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: Sequelize.STRING(30), defaultValue: "pending" },
    notes: { type: Sequelize.TEXT },
    approved_by: { type: Sequelize.INTEGER },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
