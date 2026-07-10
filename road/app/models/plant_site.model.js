module.exports = (sequelize, Sequelize) => {
  return sequelize.define("plant_site", {
    code: { type: Sequelize.STRING(40), allowNull: true },
    name: { type: Sequelize.STRING, allowNull: false },
    /** asphalt | cement | crushing | emulsion | ctb | other */
    plant_type: { type: Sequelize.STRING(40), defaultValue: "asphalt" },
    location: { type: Sequelize.STRING, allowNull: true },
    aimag: { type: Sequelize.STRING(80), allowNull: true },
    capacity_per_hour: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    capacity_unit: { type: Sequelize.STRING(20), defaultValue: "тн" },
    /** active | seasonal | mothballed */
    status: { type: Sequelize.STRING(30), defaultValue: "active" },
    manager_name: { type: Sequelize.STRING, allowNull: true },
    phone: { type: Sequelize.STRING(40), allowNull: true },
    opened_date: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
  });
};
