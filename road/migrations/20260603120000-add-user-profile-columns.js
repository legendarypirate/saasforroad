'use strict';

const USER_PROFILE_COLUMNS = [
  'department_number',
  'personal_case_number',
  'project_number',
  'position',
  'register_number',
  'sap_number',
  'social_insurance_years',
  'driver_license_class',
  'driver_license_number',
  'driver_license_expiry',
  'affiliation',
  'residential_address',
  'id_card_home_address',
  'bank_account_number',
  'company_email',
  'responsible_equipment',
  'working_conditions',
  'job_description',
  'employment_start_date',
  'employment_order_number',
  'labor_contract_number',
  'labor_contract_date',
  'golden_order',
  'probation_period',
  'probation_end_date',
  'permanent_order_number',
  'permanent_date',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const column of USER_PROFILE_COLUMNS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS "${column}" VARCHAR(255);`
      );
    }
  },

  async down(queryInterface) {
    for (const column of USER_PROFILE_COLUMNS) {
      await queryInterface.removeColumn('users', column).catch(() => {});
    }
  },
};
