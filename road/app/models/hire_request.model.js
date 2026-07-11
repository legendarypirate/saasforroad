module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "hire_request",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      project_id: { type: Sequelize.INTEGER, allowNull: false },
      requested_by: { type: Sequelize.INTEGER, allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: true },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      /** low | normal | high | urgent */
      priority: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "normal",
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      required_skills: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      required_equipment: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      /**
       * draft | sent | accepted | rejected | active | completed | reviewed
       * (+ changes_requested for mobile "Request Changes")
       */
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "draft",
      },
      change_request_note: { type: Sequelize.TEXT, allowNull: true },
      response_note: { type: Sequelize.TEXT, allowNull: true },
      responded_at: { type: Sequelize.DATE, allowNull: true },
      progress: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    { tableName: "hire_requests" }
  );
};
