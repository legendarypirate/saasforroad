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
      affiliation: {
        type: Sequelize.STRING
      },
      residential_address: {
        type: Sequelize.STRING
      },
      id_card_home_address: {
        type: Sequelize.STRING
      },
      bank_account_number: {
        type: Sequelize.STRING
      },
      company_email: {
        type: Sequelize.STRING
      },
      responsible_equipment: {
        type: Sequelize.STRING
      },
      working_conditions: {
        type: Sequelize.STRING
      },
      job_description: {
        type: Sequelize.STRING
      },
      employment_start_date: {
        type: Sequelize.STRING
      },
      employment_order_number: {
        type: Sequelize.STRING
      },
      labor_contract_number: {
        type: Sequelize.STRING
      },
      labor_contract_date: {
        type: Sequelize.STRING
      },
      golden_order: {
        type: Sequelize.STRING
      },
      probation_period: {
        type: Sequelize.STRING
      },
      probation_end_date: {
        type: Sequelize.STRING
      },
      permanent_order_number: {
        type: Sequelize.STRING
      },
      permanent_date: {
        type: Sequelize.STRING
      },
      work_schedule_type: {
        type: Sequelize.STRING,
        defaultValue: 'office_8h',
      },
      cycle_start_date: {
        type: Sequelize.STRING,
      },
      cycle_work_days: {
        type: Sequelize.INTEGER,
        defaultValue: 22,
      },
      cycle_rest_days: {
        type: Sequelize.INTEGER,
        defaultValue: 8,
      },
      daily_work_hours: {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 8,
      },
      extended_cycle: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // Default: phone is not verified
      },
      profile_image: {
        type: Sequelize.STRING,
      },
      salary: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      /** Admin UI prefs, e.g. { folderOrder: { modules: [], data: [] } } */
      ui_preferences: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    });
  
    return User;
  };
  