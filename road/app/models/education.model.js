module.exports = (sequelize, Sequelize) => {
  const Education = sequelize.define("education", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    school_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    major: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    degree: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    graduation_year: {
      type: Sequelize.STRING,
      allowNull: true,
    },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  });

  return Education;
};
