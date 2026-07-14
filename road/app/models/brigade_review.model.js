module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_review",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      hire_request_id: { type: Sequelize.INTEGER, allowNull: true },
      project_id: { type: Sequelize.INTEGER, allowNull: true },
      reviewer_user_id: { type: Sequelize.INTEGER, allowNull: true },
      overall_rating: { type: Sequelize.DECIMAL(3, 2), allowNull: false },
      quality: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      safety: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      speed: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      communication: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      comment: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "brigade_reviews" }
  );
};
