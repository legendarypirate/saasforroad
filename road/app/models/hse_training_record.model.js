module.exports = (sequelize, Sequelize) => {
  return sequelize.define("hse_training_record", {
    training_id: { type: Sequelize.INTEGER, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    certificate_url: { type: Sequelize.STRING(500), allowNull: true },
    issued_at: { type: Sequelize.DATEONLY, allowNull: false },
    expires_at: { type: Sequelize.DATEONLY, allowNull: true },
    trainer: { type: Sequelize.STRING(120), allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.INTEGER, allowNull: true },
    updated_by: { type: Sequelize.INTEGER, allowNull: true },
    tenant_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });
};
