module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_issue_line", {
    issue_id: { type: Sequelize.INTEGER, allowNull: false },
    item_id: { type: Sequelize.INTEGER, allowNull: false },
    size: { type: Sequelize.STRING(40) },
    qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    qty_returned: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    condition_note: { type: Sequelize.STRING(255) },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
