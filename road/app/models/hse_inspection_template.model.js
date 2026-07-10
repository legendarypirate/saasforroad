module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_inspection_template", {
    name: { type: Sequelize.STRING(255), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: false },
    checklist_items: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
    active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
