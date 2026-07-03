module.exports = (sequelize, Sequelize) => {
  const EquipmentRentalPayment = sequelize.define("equipment_rental_payment", {
    rental_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    period_year: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    period_month: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    period_start: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    period_end: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    amount_due: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    amount_paid: {
      type: Sequelize.DECIMAL(14, 2),
      defaultValue: 0,
    },
    paid_date: {
      type: Sequelize.DATEONLY,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "pending",
    },
    invoice_number: {
      type: Sequelize.STRING,
    },
    notes: {
      type: Sequelize.TEXT,
    },
  });

  return EquipmentRentalPayment;
};
