module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_product", {
    plant_id: { type: Sequelize.INTEGER, allowNull: true },
    name: { type: Sequelize.STRING, allowNull: false },
    /** asphalt_mix | aggregate | cement | emulsion | ctb | other */
    product_type: { type: Sequelize.STRING(40), defaultValue: "asphalt_mix" },
    grade: { type: Sequelize.STRING(80), allowNull: true },
    unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    unit_price_default: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
  });
};
