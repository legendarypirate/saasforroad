module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_timeline_event",
    {
      brigade_id: { type: Sequelize.INTEGER, allowNull: false },
      /** created | member_added | hire_accepted | project_started | project_completed | review_added | status_changed */
      event_type: { type: Sequelize.STRING(60), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      actor_user_id: { type: Sequelize.INTEGER, allowNull: true },
    },
    { tableName: "brigade_timeline_events" }
  );
};
