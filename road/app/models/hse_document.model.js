module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_document", {
    title: { type: Sequelize.STRING(255), allowNull: false },
    category: { type: Sequelize.STRING(60), allowNull: false },
    version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    file_url: { type: Sequelize.STRING(500), allowNull: true },
    effective_date: { type: Sequelize.DATEONLY, allowNull: true },
    review_date: { type: Sequelize.DATEONLY, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "draft" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
  });
};
