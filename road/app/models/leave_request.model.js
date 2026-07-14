module.exports = (sequelize, Sequelize) => {
  const LeaveRequest = sequelize.define("leave_request", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    leave_type: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "paid | unpaid",
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    start_at: {
      type: Sequelize.DATE,
      comment: "Leave start datetime",
    },
    end_at: {
      type: Sequelize.DATE,
      comment: "Leave end datetime",
    },
    hours: {
      type: Sequelize.DECIMAL(8, 2),
      comment: "Optional partial-day hours (single day only)",
    },
    total_hours: {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reason: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "pending",
      comment: "pending | approved | rejected",
    },
    reviewed_by: {
      type: Sequelize.INTEGER,
    },
    reviewed_at: {
      type: Sequelize.DATE,
    },
    review_note: {
      type: Sequelize.TEXT,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return LeaveRequest;
};
