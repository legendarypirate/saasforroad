module.exports = (sequelize, Sequelize) => {
  return sequelize.define("uni_stock_movement", {
    item_id: { type: Sequelize.INTEGER, allowNull: false },
    movement_date: { type: Sequelize.DATEONLY, allowNull: false },
    type: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "in" },
    qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    reference: { type: Sequelize.STRING(120) },
    notes: { type: Sequelize.TEXT },
    created_by: { type: Sequelize.INTEGER },
  });
};
