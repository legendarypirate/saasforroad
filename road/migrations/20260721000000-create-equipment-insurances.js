'use strict';

const LEGACY_COLUMNS = [
  'insurance_company',
  'insurance_status',
  'insurance_expiry',
  'insurance_amount',
  'insurance_contract_no',
  'insurance_notes',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // sync() may have already created the table at boot — only create if missing.
    const tables = await queryInterface.showAllTables();
    const exists = tables
      .map((t) => (typeof t === 'string' ? t : t.tableName))
      .includes('equipment_insurances');

    if (!exists) {
      await queryInterface.createTable('equipment_insurances', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        equipment_id: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: { model: 'equipments', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        company: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: true },
        contract_no: { type: Sequelize.STRING, allowNull: true },
        amount: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
        start_date: { type: Sequelize.DATEONLY, allowNull: true },
        expiry: { type: Sequelize.DATEONLY, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
        tenant_id: { type: Sequelize.INTEGER, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE },
      });

      await queryInterface.addIndex('equipment_insurances', ['equipment_id']);
    }

    // Move any existing flat snapshot into the new one-to-many table.
    // Only when the legacy columns still exist, and skip equipment that
    // already has insurance rows so re-runs can't create duplicates.
    const [legacyCols] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'equipments'
        AND column_name = 'insurance_company'
    `);

    if (legacyCols.length) {
      await queryInterface.sequelize.query(`
        INSERT INTO equipment_insurances
          (equipment_id, company, status, expiry, amount, contract_no, notes, tenant_id, "createdAt", "updatedAt")
        SELECT e.id, e.insurance_company, e.insurance_status, e.insurance_expiry,
               e.insurance_amount, e.insurance_contract_no, e.insurance_notes, e.tenant_id, NOW(), NOW()
        FROM equipments e
        WHERE (e.insurance_company IS NOT NULL
            OR e.insurance_status IS NOT NULL
            OR e.insurance_expiry IS NOT NULL
            OR e.insurance_amount IS NOT NULL
            OR e.insurance_contract_no IS NOT NULL
            OR e.insurance_notes IS NOT NULL)
          AND NOT EXISTS (
            SELECT 1 FROM equipment_insurances i WHERE i.equipment_id = e.id
          )
      `);

      for (const column of LEGACY_COLUMNS) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "equipments" DROP COLUMN IF EXISTS "${column}";`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_company" VARCHAR(255);`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_status" VARCHAR(64);`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_expiry" DATE;`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_amount" DECIMAL(14,2);`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_contract_no" VARCHAR(128);`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_notes" TEXT;`
    );

    // Restore the most recent insurance row back into the flat columns.
    await queryInterface.sequelize.query(`
      UPDATE equipments e SET
        insurance_company = i.company,
        insurance_status = i.status,
        insurance_expiry = i.expiry,
        insurance_amount = i.amount,
        insurance_contract_no = i.contract_no,
        insurance_notes = i.notes
      FROM (
        SELECT DISTINCT ON (equipment_id)
          equipment_id, company, status, expiry, amount, contract_no, notes
        FROM equipment_insurances
        ORDER BY equipment_id, expiry DESC NULLS LAST, id DESC
      ) i
      WHERE e.id = i.equipment_id
    `);

    await queryInterface.dropTable('equipment_insurances');
  },
};
