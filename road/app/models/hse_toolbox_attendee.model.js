module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_toolbox_attendee", {
    meeting_id: { type: Sequelize.INTEGER, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    signed_at: { type: Sequelize.DATE, allowNull: true },
    signature_url: { type: Sequelize.STRING(500), allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
