module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_inspection_item", {
    inspection_id: { type: Sequelize.INTEGER, allowNull: false },
    item_key: { type: Sequelize.STRING(80), allowNull: false },
    item_label: { type: Sequelize.STRING(255), allowNull: false },
    result: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "pass" },
    comment: { type: Sequelize.TEXT, allowNull: true },
    photo_url: { type: Sequelize.STRING(500), allowNull: true },
  });
};
