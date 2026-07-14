module.exports = (sequelize, Sequelize) => {
  const EmergencyContact = sequelize.define('emergency_contact', {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    relation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return EmergencyContact;
};
