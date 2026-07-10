module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_sale", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    product_id: { type: Sequelize.INTEGER, allowNull: true },
    batch_id: { type: Sequelize.INTEGER, allowNull: true },
    project_id: { type: Sequelize.INTEGER, allowNull: true },
    sale_date: { type: Sequelize.DATEONLY, allowNull: false },
    buyer_name: { type: Sequelize.STRING, allowNull: false },
    /** project | external | internal */
    buyer_type: { type: Sequelize.STRING(20), defaultValue: "project" },
    quantity: { type: Sequelize.DECIMAL(14, 3), defaultValue: 0 },
    unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    unit_price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
    total_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    /** unpaid | partial | paid */
    payment_status: { type: Sequelize.STRING(20), defaultValue: "unpaid" },
    invoice_no: { type: Sequelize.STRING(80), allowNull: true },
    delivery_note: { type: Sequelize.STRING(120), allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
  });
};
