const db = require("../models");
const Stock = db.stocks;
const Material = db.materials;
const InvDocument = db.inv_documents;
const InvDocumentLine = db.inv_document_lines;
const InvStockMovement = db.inv_stock_movements;

const DOC_TYPES = {
  RECEIPT: "RECEIPT",
  ISSUE: "ISSUE",
  RETURN: "RETURN",
  TRANSFER: "TRANSFER",
  PROJECT_TRANSFER: "PROJECT_TRANSFER",
  ADJUSTMENT: "ADJUSTMENT",
  COUNT: "COUNT",
  DAMAGE: "DAMAGE",
  LOSS: "LOSS",
  CONSUMPTION: "CONSUMPTION",
};

const MOVEMENT_TYPES = {
  IN: "IN",
  OUT: "OUT",
  TRANSFER: "TRANSFER",
  RETURN: "RETURN",
  ADJUSTMENT: "ADJUSTMENT",
  LOSS: "LOSS",
  DAMAGE: "DAMAGE",
  CONSUMPTION: "CONSUMPTION",
};

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function bizError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function nextDocNo(docType, transaction) {
  const prefixMap = {
    RECEIPT: "GRN",
    ISSUE: "ISS",
    RETURN: "RET",
    TRANSFER: "TRF",
    PROJECT_TRANSFER: "PTR",
    ADJUSTMENT: "ADJ",
    COUNT: "CNT",
    DAMAGE: "DMG",
    LOSS: "LOS",
    CONSUMPTION: "CNS",
  };
  const prefix = prefixMap[docType] || "DOC";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await InvDocument.count({
    where: { doc_type: docType },
    transaction,
  });
  return `${prefix}-${date}-${String(count + 1).padStart(4, "0")}`;
}

async function nextMovementNo(transaction) {
  const count = await InvStockMovement.count({ transaction });
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MOV-${date}-${String(count + 1).padStart(6, "0")}`;
}

async function nextMaterialCode(transaction) {
  const count = await Material.count({ transaction });
  return `MAT-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Get or create stock balance row with row lock.
 */
async function getBalance(materialId, warehouseId, transaction) {
  let balance = await Stock.findOne({
    where: { item_id: materialId, warehouse_id: warehouseId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!balance) {
    balance = await Stock.create(
      {
        item_id: materialId,
        warehouse_id: warehouseId,
        quantity: 0,
        reserved_quantity: 0,
        on_order_quantity: 0,
        average_cost: 0,
        last_updated: new Date(),
      },
      { transaction }
    );
  }
  return balance;
}

/**
 * Apply signed quantity delta to balance and write immutable movement.
 * delta > 0 = IN, delta < 0 = OUT
 */
async function postMovement(
  {
    movementType,
    warehouseId,
    toWarehouseId,
    materialId,
    projectId,
    quantity,
    unitCost,
    referenceType,
    referenceId,
    documentId,
    documentLineId,
    createdBy,
    approvedBy,
    transactionDate,
    remarks,
  },
  transaction
) {
  const qty = round3(quantity);
  if (!qty) throw bizError("Тоо хэмжээ 0 байж болохгүй");

  const balance = await getBalance(materialId, warehouseId, transaction);
  const currentQty = Number(balance.quantity) || 0;
  const currentAvg = Number(balance.average_cost) || 0;
  const cost = Number(unitCost) || currentAvg || 0;

  let nextQty = currentQty;
  let nextAvg = currentAvg;

  if (qty > 0) {
    // Weighted average cost on receipt
    const totalValue = currentQty * currentAvg + qty * cost;
    nextQty = currentQty + qty;
    nextAvg = nextQty > 0 ? totalValue / nextQty : cost;
  } else {
    nextQty = currentQty + qty;
    if (nextQty < -0.0001) {
      throw bizError(
        `Үлдэгдэл хүрэлцэхгүй (агуулах #${warehouseId}, бараа #${materialId}: ${currentQty}, шаардлагатай: ${Math.abs(qty)})`
      );
    }
    nextQty = Math.max(0, nextQty);
  }

  await balance.update(
    {
      quantity: round3(nextQty),
      average_cost: round2(nextAvg),
      last_updated: new Date(),
    },
    { transaction }
  );

  const material = await Material.findByPk(materialId, { transaction });
  if (material && qty > 0 && cost > 0) {
    await material.update(
      {
        average_cost: round2(nextAvg),
        last_purchase_price: round2(cost),
      },
      { transaction }
    );
  }

  const movement = await InvStockMovement.create(
    {
      movement_no: await nextMovementNo(transaction),
      movement_type: movementType,
      warehouse_id: warehouseId,
      to_warehouse_id: toWarehouseId || null,
      material_id: materialId,
      project_id: projectId || null,
      quantity: qty,
      unit_cost: round2(cost),
      total_cost: round2(Math.abs(qty) * cost),
      balance_after: round3(nextQty),
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      document_id: documentId || null,
      document_line_id: documentLineId || null,
      created_by: createdBy || null,
      approved_by: approvedBy || null,
      transaction_date: transactionDate,
      remarks: remarks || null,
    },
    { transaction }
  );

  return movement;
}

function resolveLineMovements(doc, line) {
  const qty = Number(line.quantity);
  const cost = Number(line.unit_cost) || 0;
  const base = {
    materialId: line.material_id,
    projectId: doc.project_id,
    unitCost: cost,
    documentId: doc.id,
    documentLineId: line.id,
    transactionDate: doc.doc_date,
    remarks: line.remarks || doc.remarks,
  };

  switch (doc.doc_type) {
    case DOC_TYPES.RECEIPT:
    case DOC_TYPES.RETURN:
      return [
        {
          ...base,
          movementType: doc.doc_type === DOC_TYPES.RETURN ? MOVEMENT_TYPES.RETURN : MOVEMENT_TYPES.IN,
          warehouseId: doc.warehouse_id,
          quantity: qty,
        },
      ];
    case DOC_TYPES.ISSUE:
    case DOC_TYPES.CONSUMPTION:
      return [
        {
          ...base,
          movementType:
            doc.doc_type === DOC_TYPES.CONSUMPTION
              ? MOVEMENT_TYPES.CONSUMPTION
              : MOVEMENT_TYPES.OUT,
          warehouseId: doc.warehouse_id,
          quantity: -qty,
        },
      ];
    case DOC_TYPES.DAMAGE:
      return [
        {
          ...base,
          movementType: MOVEMENT_TYPES.DAMAGE,
          warehouseId: doc.warehouse_id,
          quantity: -qty,
        },
      ];
    case DOC_TYPES.LOSS:
      return [
        {
          ...base,
          movementType: MOVEMENT_TYPES.LOSS,
          warehouseId: doc.warehouse_id,
          quantity: -qty,
        },
      ];
    case DOC_TYPES.ADJUSTMENT: {
      // quantity sign: positive increase, negative decrease
      const signed = Number(line.quantity);
      return [
        {
          ...base,
          movementType: MOVEMENT_TYPES.ADJUSTMENT,
          warehouseId: doc.warehouse_id,
          quantity: signed,
          unitCost: cost,
        },
      ];
    }
    case DOC_TYPES.TRANSFER:
      return [
        {
          ...base,
          movementType: MOVEMENT_TYPES.TRANSFER,
          warehouseId: doc.warehouse_id,
          toWarehouseId: doc.to_warehouse_id,
          quantity: -qty,
        },
        {
          ...base,
          movementType: MOVEMENT_TYPES.TRANSFER,
          warehouseId: doc.to_warehouse_id,
          toWarehouseId: doc.warehouse_id,
          quantity: qty,
        },
      ];
    case DOC_TYPES.PROJECT_TRANSFER: {
      // project_id = from, to_project_id = to
      // Optional warehouse move: to_warehouse_id defaults to same warehouse
      const fromWh = doc.warehouse_id;
      const toWh = doc.to_warehouse_id || doc.warehouse_id;
      return [
        {
          ...base,
          projectId: doc.project_id,
          movementType: MOVEMENT_TYPES.TRANSFER,
          warehouseId: fromWh,
          toWarehouseId: toWh !== fromWh ? toWh : null,
          quantity: -qty,
        },
        {
          ...base,
          projectId: doc.to_project_id,
          movementType: MOVEMENT_TYPES.TRANSFER,
          warehouseId: toWh,
          toWarehouseId: toWh !== fromWh ? fromWh : null,
          quantity: qty,
        },
      ];
    }
    case DOC_TYPES.COUNT: {
      // line.quantity = counted qty; we adjust to match
      // actual delta computed at post time using current balance
      return [{ ...base, movementType: MOVEMENT_TYPES.ADJUSTMENT, warehouseId: doc.warehouse_id, quantity: qty, isCount: true }];
    }
    default:
      throw bizError(`Тодорхойгүй баримтын төрөл: ${doc.doc_type}`);
  }
}

async function createDocument({
  docType,
  warehouseId,
  toWarehouseId,
  projectId,
  toProjectId,
  supplierId,
  receiverName,
  docDate,
  remarks,
  reason,
  lines,
  createdBy,
  postImmediately = true,
}) {
  if (!lines?.length) throw bizError("Барааны мөр шаардлагатай");
  if (!warehouseId && docType !== DOC_TYPES.TRANSFER && docType !== DOC_TYPES.PROJECT_TRANSFER) {
    throw bizError("Агуулах сонгоно уу");
  }
  if (docType === DOC_TYPES.TRANSFER && (!warehouseId || !toWarehouseId)) {
    throw bizError("Шилжүүлэх агуулахуудыг сонгоно уу");
  }
  if (docType === DOC_TYPES.TRANSFER && warehouseId && toWarehouseId && warehouseId === toWarehouseId) {
    throw bizError("Ижил агуулах руу шилжүүлэх боломжгүй");
  }
  if (docType === DOC_TYPES.PROJECT_TRANSFER) {
    if (!warehouseId) throw bizError("Агуулах сонгоно уу");
    if (!projectId || !toProjectId) throw bizError("Гарах болон орох төслийг сонгоно уу");
    if (Number(projectId) === Number(toProjectId)) {
      throw bizError("Ижил төсөл рүү шилжүүлэх боломжгүй");
    }
    const destWh = toWarehouseId || warehouseId;
    if (Number(warehouseId) === Number(destWh) && Number(projectId) === Number(toProjectId)) {
      throw bizError("Агуулах болон төсөл хоёулаа ижил байна");
    }
  }

  const t = await db.sequelize.transaction();
  try {
    let totalAmount = 0;
    const preparedLines = lines.map((l) => {
      const quantity = Number(l.quantity);
      if (!l.material_id || !quantity) {
        throw bizError("Бараа болон тоо хэмжээ шаардлагатай");
      }
      if (docType !== DOC_TYPES.ADJUSTMENT && quantity <= 0) {
        throw bizError("Тоо хэмжээ 0-ээс их байх ёстой");
      }
      const unitCost = Number(l.unit_cost) || 0;
      const totalCost = round2(Math.abs(quantity) * unitCost);
      totalAmount += totalCost;
      return {
        material_id: l.material_id,
        quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
        remarks: l.remarks || null,
      };
    });

    const doc = await InvDocument.create(
      {
        doc_no: await nextDocNo(docType, t),
        doc_type: docType,
        status: "DRAFT",
        warehouse_id: warehouseId || null,
        to_warehouse_id:
          docType === DOC_TYPES.PROJECT_TRANSFER
            ? toWarehouseId && Number(toWarehouseId) !== Number(warehouseId)
              ? toWarehouseId
              : null
            : toWarehouseId || null,
        project_id: projectId || null,
        to_project_id: toProjectId || null,
        supplier_id: supplierId || null,
        receiver_name: receiverName || null,
        doc_date: docDate || new Date().toISOString().slice(0, 10),
        remarks: remarks || null,
        reason: reason || null,
        total_amount: round2(totalAmount),
        created_by: createdBy || null,
      },
      { transaction: t }
    );

    for (const line of preparedLines) {
      await InvDocumentLine.create({ ...line, document_id: doc.id }, { transaction: t });
    }

    if (postImmediately) {
      await postDocumentInternal(doc.id, createdBy, t);
    }

    await t.commit();
    return getDocument(doc.id);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function postDocumentInternal(documentId, approvedBy, transaction) {
  // Lock only the document row — FOR UPDATE cannot target LEFT JOIN (lines).
  const doc = await InvDocument.findByPk(documentId, {
    transaction,
    lock: { level: transaction.LOCK.UPDATE, of: InvDocument },
  });
  if (!doc) throw bizError("Баримт олдсонгүй", 404);
  if (doc.status === "POSTED") throw bizError("Баримт аль хэдийн батлагдсан");
  if (doc.status === "CANCELLED") throw bizError("Цуцлагдсан баримтыг батлах боломжгүй");

  const lines = await InvDocumentLine.findAll({
    where: { document_id: documentId },
    transaction,
    lock: { level: transaction.LOCK.UPDATE, of: InvDocumentLine },
  });

  for (const line of lines) {
    const specs = resolveLineMovements(doc, line);
    for (const spec of specs) {
      let quantity = spec.quantity;
      if (spec.isCount) {
        const balance = await getBalance(spec.materialId, spec.warehouseId, transaction);
        quantity = Number(line.quantity) - Number(balance.quantity);
        if (quantity === 0) continue;
      }
      await postMovement(
        {
          ...spec,
          quantity,
          createdBy: doc.created_by,
          approvedBy: approvedBy || doc.created_by,
          referenceType: doc.doc_type,
          referenceId: doc.id,
        },
        transaction
      );
    }
  }

  await doc.update(
    {
      status: "POSTED",
      approved_by: approvedBy || doc.created_by,
      posted_at: new Date(),
    },
    { transaction }
  );

  return doc;
}

async function postDocument(documentId, approvedBy) {
  const t = await db.sequelize.transaction();
  try {
    await postDocumentInternal(documentId, approvedBy, t);
    await t.commit();
    return getDocument(documentId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/**
 * Cancel posted document by creating reversing movements (never delete history).
 */
async function cancelDocument(documentId, reason, cancelledBy) {
  const t = await db.sequelize.transaction();
  try {
    const doc = await InvDocument.findByPk(documentId, {
      transaction: t,
      lock: { level: t.LOCK.UPDATE, of: InvDocument },
    });
    if (!doc) throw bizError("Баримт олдсонгүй", 404);
    if (doc.status !== "POSTED") throw bizError("Зөвхөн батлагдсан баримтыг цуцлана");

    const movements = await InvStockMovement.findAll({
      where: { document_id: doc.id },
      transaction: t,
    });

    for (const mov of movements) {
      await postMovement(
        {
          movementType: MOVEMENT_TYPES.ADJUSTMENT,
          warehouseId: mov.warehouse_id,
          toWarehouseId: mov.to_warehouse_id,
          materialId: mov.material_id,
          projectId: mov.project_id,
          quantity: -Number(mov.quantity),
          unitCost: mov.unit_cost,
          referenceType: "CANCEL",
          referenceId: doc.id,
          documentId: doc.id,
          createdBy: cancelledBy,
          approvedBy: cancelledBy,
          transactionDate: new Date().toISOString().slice(0, 10),
          remarks: `Цуцлалт: ${doc.doc_no}. ${reason || ""}`,
        },
        t
      );
    }

    await doc.update(
      {
        status: "CANCELLED",
        cancelled_at: new Date(),
        cancel_reason: reason || null,
      },
      { transaction: t }
    );

    await t.commit();
    return getDocument(documentId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function getDocument(id) {
  return InvDocument.findByPk(id, {
    include: [
      { model: InvDocumentLine, as: "lines", include: [{ model: Material, as: "material" }] },
      { model: db.warehouses, as: "warehouse" },
      { model: db.warehouses, as: "toWarehouse" },
      { model: db.projects, as: "project" },
      { model: db.projects, as: "toProject" },
      { model: db.suppliers, as: "supplier" },
    ],
  });
}

module.exports = {
  DOC_TYPES,
  MOVEMENT_TYPES,
  nextMaterialCode,
  createDocument,
  postDocument,
  cancelDocument,
  getDocument,
  getBalance,
};
