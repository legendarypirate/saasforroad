module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_return", {
    return_date: { type: Sequelize.DATEONLY, allowNull: false },
    issue_line_id: { type: Sequelize.INTEGER, allowNull: false },
    qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    condition: { type: Sequelize.STRING(30), defaultValue: "good" },
    notes: { type: Sequelize.TEXT },
    received_by: { type: Sequelize.INTEGER },
  });
};
