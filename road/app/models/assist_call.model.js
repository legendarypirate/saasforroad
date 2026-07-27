module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "assist_call",
    {
      request_code: { type: Sequelize.STRING(40), allowNull: false },
      driver_id: { type: Sequelize.INTEGER, allowNull: false },
      assist_service_id: { type: Sequelize.INTEGER, allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      driver_lat: { type: Sequelize.DOUBLE, allowNull: false },
      driver_lng: { type: Sequelize.DOUBLE, allowNull: false },
      /** searching | ringing | assigned | en_route | in_progress | completed | cancelled | failed */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "searching",
      },
      current_service_man_id: { type: Sequelize.INTEGER, allowNull: true },
      assigned_service_man_id: { type: Sequelize.INTEGER, allowNull: true },
      offered_ids: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      service_man_lat: { type: Sequelize.DOUBLE, allowNull: true },
      service_man_lng: { type: Sequelize.DOUBLE, allowNull: true },
      distance_km: { type: Sequelize.DOUBLE, allowNull: true },
      eta_minutes: { type: Sequelize.INTEGER, allowNull: true },
      ring_started_at: { type: Sequelize.DATE, allowNull: true },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      work_started_at: { type: Sequelize.DATE, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      driver_rating: { type: Sequelize.INTEGER, allowNull: true },
      driver_review: { type: Sequelize.TEXT, allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      /** Equipment linked via plate lookup before call */
      equipment_id: { type: Sequelize.INTEGER, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true },
      plate_number: { type: Sequelize.STRING(40), allowNull: true },
    },
    { tableName: "assist_calls" }
  );
};
