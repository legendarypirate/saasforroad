module.exports = (sequelize, Sequelize) => {
  const UserDevice = sequelize.define("user_device", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    device_id: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: "Stable device fingerprint from mobile app",
    },
    device_name: {
      type: Sequelize.STRING(255),
    },
    platform: {
      type: Sequelize.STRING(32),
      comment: "android | ios",
    },
    model: {
      type: Sequelize.STRING(128),
    },
    status: {
      type: Sequelize.STRING(32),
      defaultValue: "pending",
      comment: "pending | approved | rejected | revoked",
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: "Only one approved device per user can be active",
    },
    approved_by: {
      type: Sequelize.INTEGER,
    },
    approved_at: {
      type: Sequelize.DATE,
    },
    rejected_at: {
      type: Sequelize.DATE,
    },
    review_note: {
      type: Sequelize.TEXT,
    },
    last_login_at: {
      type: Sequelize.DATE,
    },
    last_seen_at: {
      type: Sequelize.DATE,
    },
  }, {
    indexes: [
      { unique: true, fields: ['user_id', 'device_id'] },
      { fields: ['user_id', 'status', 'is_active'] },
    ],
  });

  return UserDevice;
};
