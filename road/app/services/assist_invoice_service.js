const { QueryTypes } = require("sequelize");
const db = require("../models");

const DEFAULT_ASSIST_FEE = Number(process.env.ASSIST_DEFAULT_FEE || 50000);

function normalizePlate(plate) {
  return String(plate || "")
    .trim()
    .toUpperCase()
    .replace(/[\s\-–—_]/g, "");
}

/**
 * Cross-tenant plate lookup for freelancer call gate.
 * @returns {Promise<object|null>}
 */
async function lookupEquipmentByPlate(plate) {
  const norm = normalizePlate(plate);
  if (!norm || norm.length < 3) return null;

  const rows = await db.sequelize.query(
    `SELECT e.id,
            e.name,
            e.model,
            e.registration_number,
            e.tenant_id,
            t.name AS tenant_name,
            t.slug AS tenant_slug,
            t.company_name AS tenant_company_name
     FROM equipments e
     LEFT JOIN tenants t ON t.id = e.tenant_id
     WHERE e.registration_number IS NOT NULL
       AND REPLACE(
             REPLACE(
               REPLACE(
                 REPLACE(UPPER(TRIM(e.registration_number)), ' ', ''),
                 '-', ''
               ),
               '–', ''
             ),
             '_', ''
           ) = :norm
     LIMIT 1`,
    { replacements: { norm }, type: QueryTypes.SELECT }
  );
  return rows[0] || null;
}

/** Same as lookupEquipmentByPlate but restricted to one tenant. */
async function lookupEquipmentByPlateForTenant(plate, tenantId) {
  const norm = normalizePlate(plate);
  const tid = Number(tenantId);
  if (!norm || norm.length < 3 || !tid) return null;

  const rows = await db.sequelize.query(
    `SELECT e.id,
            e.name,
            e.model,
            e.registration_number,
            e.tenant_id,
            t.name AS tenant_name,
            t.slug AS tenant_slug,
            t.company_name AS tenant_company_name
     FROM equipments e
     LEFT JOIN tenants t ON t.id = e.tenant_id
     WHERE e.tenant_id = :tid
       AND e.registration_number IS NOT NULL
       AND REPLACE(
             REPLACE(
               REPLACE(
                 REPLACE(UPPER(TRIM(e.registration_number)), ' ', ''),
                 '-', ''
               ),
               '–', ''
             ),
             '_', ''
           ) = :norm
     LIMIT 1`,
    { replacements: { norm, tid }, type: QueryTypes.SELECT }
  );
  return rows[0] || null;
}

async function createInvoiceForCompletedCall(callId) {
  const existing = await db.assist_invoices.findOne({
    where: { assist_call_id: callId },
    skipTenantScope: true,
  });
  if (existing) return existing;

  const call = await db.assist_calls.findByPk(callId, {
    include: [
      { model: db.assist_services, as: "service" },
      {
        model: db.road_drivers,
        as: "driver",
        attributes: ["id", "full_name", "phone"],
      },
      {
        model: db.service_men,
        as: "assignedServiceMan",
        attributes: ["id", "full_name", "phone"],
      },
      {
        model: db.equipments,
        as: "equipment",
        attributes: ["id", "name", "registration_number"],
        required: false,
      },
    ],
    skipTenantScope: true,
  });
  if (!call) return null;
  if (!call.tenant_id) {
    console.warn(`assist invoice skipped: call ${callId} has no tenant_id`);
    return null;
  }

  const service = call.service;
  const amount =
    service?.base_price != null && Number(service.base_price) > 0
      ? Number(service.base_price)
      : DEFAULT_ASSIST_FEE;

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${callId}`;

  return db.assist_invoices.create(
    {
      invoice_number: invoiceNumber,
      assist_call_id: call.id,
      tenant_id: call.tenant_id,
      equipment_id: call.equipment_id || null,
      plate_number: call.plate_number || call.equipment?.registration_number || null,
      equipment_name: call.equipment?.name || null,
      service_name: service?.name_mn || service?.name || null,
      driver_name: call.driver?.full_name || null,
      service_man_name: call.assignedServiceMan?.full_name || null,
      amount,
      currency: "MNT",
      status: "unpaid",
    },
    { skipTenantScope: true }
  );
}

module.exports = {
  normalizePlate,
  lookupEquipmentByPlate,
  lookupEquipmentByPlateForTenant,
  createInvoiceForCompletedCall,
  DEFAULT_ASSIST_FEE,
};
