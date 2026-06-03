module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      username: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING,
      },
      role_id: {
        type: Sequelize.INTEGER,
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
      department_number: {
        type: Sequelize.STRING
      },
      personal_case_number: {
        type: Sequelize.STRING
      },
      project_number: {
        type: Sequelize.STRING
      },
      position: {
        type: Sequelize.STRING
      },
      register_number: {
        type: Sequelize.STRING
      },
      sap_number: {
        type: Sequelize.STRING
      },
      social_insurance_years: {
        type: Sequelize.STRING
      },
      driver_license_class: {
        type: Sequelize.STRING
      },
      driver_license_number: {
        type: Sequelize.STRING
      },
      driver_license_expiry: {
        type: Sequelize.STRING
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // Default: phone is not verified
      },
    });
  
    return User;
  };
  