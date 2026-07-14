// models/invite.model.js

module.exports = (sequelize, Sequelize) => {
    const Invite = sequelize.define("invite", {
      inviteStatus: {
        type: Sequelize.ENUM("pending", "accepted", "declined"),
        allowNull: false,
        defaultValue: "pending",
      },
      role: {
        type: Sequelize.STRING,
        defaultValue: "member",
      },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
  });
  
    return Invite;
  };
  