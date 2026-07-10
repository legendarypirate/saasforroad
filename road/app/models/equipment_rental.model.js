module.exports = (sequelize, Sequelize) => {
  const EquipmentRental = sequelize.define("equipment_rental", {
    contract_number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    equipment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    client_company: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    client_register: {
      type: Sequelize.STRING,
    },
    client_director: {
      type: Sequelize.STRING,
    },
    client_phone: {
      type: Sequelize.STRING,
    },
    client_email: {
      type: Sequelize.STRING,
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    /** Primary billing input — ₮ / өдөр */
    daily_rate: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    /**
     * Cached display: daily_rate * 30 (approx month).
     * Actual invoices use daily_rate * days in each period.
     */
    monthly_rate: {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    deposit_amount: {
      type: Sequelize.DECIMAL(14, 2),
      defaultValue: 0,
    },
    motor_hours_start: {
      type: Sequelize.DECIMAL(10, 2),
    },
    motor_hours_end: {
      type: Sequelize.DECIMAL(10, 2),
    },
    delivery_location: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "draft",
    },
    notes: {
      type: Sequelize.TEXT,
    },
  });

  return EquipmentRental;
};
