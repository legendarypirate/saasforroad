module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_ppe_assignment", {
    ppe_item_id: { type: Sequelize.INTEGER, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    issued_at: { type: Sequelize.DATEONLY, allowNull: false },
    replacement_due_at: { type: Sequelize.DATEONLY, allowNull: true },
    returned_at: { type: Sequelize.DATEONLY, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "active" },
    issued_by: { type: Sequelize.INTEGER, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
