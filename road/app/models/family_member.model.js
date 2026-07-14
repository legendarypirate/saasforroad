module.exports = (sequelize, Sequelize) => {
  const FamilyMember = sequelize.define('family_member', {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    full_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    job: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    relation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return FamilyMember;
};
