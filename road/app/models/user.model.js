module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      username: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      otp: {
        type: Sequelize.STRING
      },
      school: {
        type: Sequelize.STRING
      },
      end_date: {
        type: Sequelize.STRING
      },
      is_active: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // Default: phone is not verified
      },
    });
  
    return User;
  };
  