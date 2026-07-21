module.exports = (sequelize, Sequelize) => {
  return sequelize.define("fuel_issue", {
    number: { type: Sequelize.STRING(60), allowNull: false },
    issue_date: { type: Sequelize.DATEONLY, allowNull: false },
    equipment_id: { type: Sequelize.INTEGER, allowNull: false },
    driver_user_id: { type: Sequelize.INTEGER },
    project_id: { type: Sequelize.INTEGER },
    tank_id: { type: Sequelize.INTEGER, allowNull: false },
    fuel_type: { type: Sequelize.STRING(40), allowNull: false, defaultValue: "diesel" },
    quantity: { type: Sequelize.DECIMAL(18, 3), allowNull: false },
    odometer: { type: Sequelize.DECIMAL(18, 2) },
    engine_hours: { type: Sequelize.DECIMAL(18, 2) },
    issued_by: { type: Sequelize.INTEGER },
    notes: { type: Sequelize.TEXT },
    /** pending = QR issued, waiting for receiver scan; verified = both sides confirmed */
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "verified" },
    /** One-time token encoded in the QR the receiver scans */
    verify_token: { type: Sequelize.STRING(80) },
    verify_expires_at: { type: Sequelize.DATE },
    verified_at: { type: Sequelize.DATE },
    /** users.id of the driver/receiver who scanned & confirmed */
    verified_by_user_id: { type: Sequelize.INTEGER },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
