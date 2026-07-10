module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_expense", {
    plant_id: { type: Sequelize.INTEGER, allowNull: false },
    expense_date: { type: Sequelize.DATEONLY, allowNull: false },
    /** fuel | power | labor | repair | transport | lab | bitumen | material | other */
    category: { type: Sequelize.STRING(40), defaultValue: "other" },
    amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    vat_amount: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
    description: { type: Sequelize.STRING, allowNull: true },
    vendor_name: { type: Sequelize.STRING, allowNull: true },
    /** draft | posted */
    status: { type: Sequelize.STRING(20), defaultValue: "posted" },
    notes: { type: Sequelize.TEXT, allowNull: true },
  });
};
