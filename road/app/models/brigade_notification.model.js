module.exports = (sequelize, Sequelize) => {
  return sequelize.define(
    "brigade_notification",
    {
      /** Recipient is the brigade (app inbox), not a company user. */
      brigade_id: { type: Sequelize.INTEGER, allowNull: true },
      /** Optional company staff recipient (e.g. hire requester). */
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      /** hire_request | hire_accepted | hire_rejected | project_assigned | project_completed | review_added */
      type: { type: Sequelize.STRING(60), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      related_id: { type: Sequelize.INTEGER, allowNull: true },
      related_type: { type: Sequelize.STRING(60), allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    { tableName: "brigade_notifications" }
  );
};
