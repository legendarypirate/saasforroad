module.exports = (sequelize, Sequelize) => {
  const Equipment = sequelize.define(
    "equipment",
    {
      /** Дотоод дугаар (Asset No.) e.g. № 24 */
      asset_no: { type: Sequelize.STRING, allowNull: true },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      registration_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      serial_number: { type: Sequelize.STRING, allowNull: true },
      capacity: { type: Sequelize.STRING, allowNull: true },
      country_of_origin: { type: Sequelize.STRING, allowNull: true },
      year_manufactured: { type: Sequelize.STRING, allowNull: true },
      import_date: { type: Sequelize.DATEONLY, allowNull: true },
      site: { type: Sequelize.STRING, allowNull: true },
      color: { type: Sequelize.STRING, allowNull: true },
      responsible_person: { type: Sequelize.STRING, allowNull: true },
      operator_name: { type: Sequelize.STRING, allowNull: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      /** Internal worker FKs (users table) */
      responsible_user_id: { type: Sequelize.INTEGER, allowNull: true },
      operator_user_id: { type: Sequelize.INTEGER, allowNull: true },

      /** machine | tool | material — also used by rental */
      category: {
        type: Sequelize.STRING,
        defaultValue: "machine",
      },
      /** FK → equipment_categories (Экскаватор, Дэвсэгч, …) */
      equipment_category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING,
        defaultValue: "ширхэг",
      },
      default_daily_rate: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      is_rentable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      /** in_service | available | rented | maintenance | retired */
      status: {
        type: Sequelize.STRING,
        defaultValue: "in_service",
      },
      motor_hours: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },

      // B. Даатгал (одоогийн)
      insurance_company: { type: Sequelize.STRING, allowNull: true },
      insurance_status: { type: Sequelize.STRING, allowNull: true },
      insurance_expiry: { type: Sequelize.DATEONLY, allowNull: true },
      insurance_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      insurance_contract_no: { type: Sequelize.STRING, allowNull: true },
      insurance_notes: { type: Sequelize.TEXT, allowNull: true },

      // C. Татвар (сүүлийн)
      road_tax_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      atboyahat_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      air_pollution_fee: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      transaction_fee: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      tax_period: { type: Sequelize.STRING, allowNull: true },
      tax_paid: { type: Sequelize.BOOLEAN, allowNull: true },

      // D. Оношилгоо
      inspection_result: { type: Sequelize.STRING, allowNull: true },
      inspection_date: { type: Sequelize.DATEONLY, allowNull: true },
      next_inspection_date: { type: Sequelize.DATEONLY, allowNull: true },
      inspection_extra_fee: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      inspection_notes: { type: Sequelize.TEXT, allowNull: true },

      // E. Тос масло (сүүлийн товч)
      last_oil_change_date: { type: Sequelize.DATEONLY, allowNull: true },
      last_oil_motor_hours: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      next_oil_motor_hours: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      oil_type_name: { type: Sequelize.STRING, allowNull: true },
      oil_quantity_liters: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      oil_notes: { type: Sequelize.TEXT, allowNull: true },

      // F. Гэрчилгээ
      tech_certificate: { type: Sequelize.STRING, allowNull: true },
      certificate_number: { type: Sequelize.STRING, allowNull: true },
      certificate_expiry: { type: Sequelize.DATEONLY, allowNull: true },
      owner_name: { type: Sequelize.STRING, allowNull: true },
      purchase_document: { type: Sequelize.STRING, allowNull: true },
      certificate_notes: { type: Sequelize.TEXT, allowNull: true },

      photo_front: { type: Sequelize.STRING, allowNull: true },
      photo_back: { type: Sequelize.STRING, allowNull: true },
      photo_left: { type: Sequelize.STRING, allowNull: true },
      photo_right: { type: Sequelize.STRING, allowNull: true },
      certificate_image: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
  },
    {
      tableName: "equipments",
    }
  );

  return Equipment;
};
