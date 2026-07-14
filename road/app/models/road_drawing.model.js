module.exports = (sequelize, Sequelize) => {
  return sequelize.define("road_drawing", {
    project_id: { type: Sequelize.INTEGER, allowNull: false },
    drawing_type: { type: Sequelize.STRING(50), allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: false },
    sheet_no: { type: Sequelize.STRING(50), allowNull: true },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "draft" },
    file_url: { type: Sequelize.STRING(500), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
