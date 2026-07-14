module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_capa", {
    source_type: { type: Sequelize.STRING(40), allowNull: false },
    source_id: { type: Sequelize.INTEGER, allowNull: true },
    action: { type: Sequelize.TEXT, allowNull: false },
    responsible_user_id: { type: Sequelize.INTEGER, allowNull: true },
    deadline: { type: Sequelize.DATEONLY, allowNull: true },
    evidence_url: { type: Sequelize.STRING(500), allowNull: true },
    verification_notes: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "open" },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    verified_by: { type: Sequelize.INTEGER, allowNull: true },
    verified_at: { type: Sequelize.DATE, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
