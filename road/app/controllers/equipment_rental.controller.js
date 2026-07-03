const db = require("../models");
const EquipmentRental = db.equipment_rentals;
const EquipmentRentalPayment = db.equipment_rental_payments;
const Equipment = db.equipments;
const Op = db.Sequelize.Op;

const rentalInclude = [
  {
    model: Equipment,
    as: "equipment",
    attributes: ["id", "name", "model", "registration_number", "motor_hours"],
  },
  {
    model: EquipmentRentalPayment,
    as: "payments",
    separate: true,
    order: [
      ["period_year", "ASC"],
      ["period_month", "ASC"],
    ],
  },
];

function parseDate(value) {
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function refreshPaymentStatus(payment) {
  const due = Number(payment.amount_due) || 0;
  const paid = Number(payment.amount_paid) || 0;
  const today = formatDateOnly(new Date());
  let status = "pending";

  if (paid >= due && due > 0) {
    status = "paid";
  } else if (paid > 0 && paid < due) {
    status = "partial";
  } else if (payment.period_end < today) {
    status = "overdue";
  }

  return status;
}

async function syncPaymentStatuses(rentalId) {
  const payments = await EquipmentRentalPayment.findAll({ where: { rental_id: rentalId } });
  for (const payment of payments) {
    const status = refreshPaymentStatus(payment);
    if (payment.status !== status) {
      await payment.update({ status });
    }
  }
}

function buildMonthlyPayments(rental) {
  const start = parseDate(rental.start_date);
  const end = parseDate(rental.end_date);
  if (!start || !end || end < start) return [];

  const monthlyRate = Number(rental.monthly_rate) || 0;
  const rows = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month - 1, lastDayOfMonth(year, month));
    const periodStart = start > monthStart ? start : monthStart;
    const periodEnd = end < monthEnd ? end : monthEnd;

    rows.push({
      rental_id: rental.id,
      period_year: year,
      period_month: month,
      period_start: formatDateOnly(periodStart),
      period_end: formatDateOnly(periodEnd),
      amount_due: monthlyRate,
      amount_paid: 0,
      status: "pending",
    });

    cursor = new Date(year, month, 1);
  }

  return rows;
}

async function assertEquipmentAvailable(equipmentId, startDate, endDate, excludeRentalId) {
  const where = {
    equipment_id: equipmentId,
    status: { [Op.in]: ["draft", "active"] },
    start_date: { [Op.lte]: endDate },
    end_date: { [Op.gte]: startDate },
  };
  if (excludeRentalId) {
    where.id = { [Op.ne]: excludeRentalId };
  }

  const conflict = await EquipmentRental.findOne({ where });
  if (conflict) {
    throw new Error(
      `Энэ тоног төхөөрөмж ${conflict.contract_number} гэрээгээр тухайн хугацаанд түрээслэгдсэн байна.`
    );
  }
}

exports.stats = async (_req, res) => {
  try {
    const rentals = await EquipmentRental.findAll({ attributes: ["id"] });
    for (const rental of rentals) {
      await syncPaymentStatuses(rental.id);
    }

    const activeRentals = await EquipmentRental.count({ where: { status: "active" } });
    const activeRows = await EquipmentRental.findAll({
      where: { status: "active" },
      attributes: ["monthly_rate"],
    });
    const monthlyRevenue = activeRows.reduce((sum, row) => sum + Number(row.monthly_rate || 0), 0);

    const overduePayments = await EquipmentRentalPayment.findAll({
      where: { status: { [Op.in]: ["overdue", "partial"] } },
    });
    const overdueAmount = overduePayments.reduce(
      (sum, row) => sum + Math.max(0, Number(row.amount_due) - Number(row.amount_paid)),
      0
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const paidThisMonth = await EquipmentRentalPayment.sum("amount_paid", {
      where: { period_year: year, period_month: month },
    });

    res.json({
      success: true,
      data: {
        activeRentals,
        monthlyRevenue,
        overdueAmount,
        paidThisMonth: Number(paidThisMonth) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { status, equipment_id, q } = req.query;
  const where = {};

  if (status) where.status = status;
  if (equipment_id) where.equipment_id = equipment_id;
  if (q) {
    where[Op.or] = [
      { contract_number: { [Op.iLike]: `%${q}%` } },
      { client_company: { [Op.iLike]: `%${q}%` } },
      { client_register: { [Op.iLike]: `%${q}%` } },
    ];
  }

  try {
    const data = await EquipmentRental.findAll({
      where,
      include: rentalInclude,
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await EquipmentRental.findByPk(req.params.id, { include: rentalInclude });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await syncPaymentStatuses(data.id);
    const refreshed = await EquipmentRental.findByPk(req.params.id, { include: rentalInclude });
    res.json({ success: true, data: refreshed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  const body = req.body;
  if (!body.equipment_id || !body.client_company || !body.start_date || !body.end_date) {
    return res.status(400).json({
      success: false,
      message: "Тоног төхөөрөмж, түрээслэгч компани, эхлэх/дуусах огноо заавал.",
    });
  }

  try {
    await assertEquipmentAvailable(body.equipment_id, body.start_date, body.end_date);

    const rental = await EquipmentRental.create({
      contract_number: body.contract_number || `TR-${Date.now()}`,
      equipment_id: body.equipment_id,
      client_company: body.client_company,
      client_register: body.client_register,
      client_director: body.client_director,
      client_phone: body.client_phone,
      client_email: body.client_email,
      start_date: body.start_date,
      end_date: body.end_date,
      monthly_rate: body.monthly_rate || 0,
      deposit_amount: body.deposit_amount || 0,
      motor_hours_start: body.motor_hours_start,
      motor_hours_end: body.motor_hours_end,
      delivery_location: body.delivery_location,
      status: body.status || "active",
      notes: body.notes,
    });

    const paymentRows = buildMonthlyPayments(rental);
    if (paymentRows.length) {
      await EquipmentRentalPayment.bulkCreate(paymentRows);
    }

    const data = await EquipmentRental.findByPk(rental.id, { include: rentalInclude });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const rental = await EquipmentRental.findByPk(req.params.id);
    if (!rental) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const nextEquipmentId = req.body.equipment_id ?? rental.equipment_id;
    const nextStart = req.body.start_date ?? rental.start_date;
    const nextEnd = req.body.end_date ?? rental.end_date;
    const nextRate = req.body.monthly_rate ?? rental.monthly_rate;

    await assertEquipmentAvailable(nextEquipmentId, nextStart, nextEnd, rental.id);

    const scheduleChanged =
      nextStart !== rental.start_date ||
      nextEnd !== rental.end_date ||
      Number(nextRate) !== Number(rental.monthly_rate);

    await rental.update(req.body);

    if (scheduleChanged) {
      await EquipmentRentalPayment.destroy({ where: { rental_id: rental.id } });
      const paymentRows = buildMonthlyPayments(rental);
      if (paymentRows.length) {
        await EquipmentRentalPayment.bulkCreate(paymentRows);
      }
    }

    const data = await EquipmentRental.findByPk(rental.id, { include: rentalInclude });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await EquipmentRental.destroy({ where: { id: req.params.id } });
    if (!num) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  const { amount_paid, paid_date, invoice_number, notes } = req.body;
  try {
    const payment = await EquipmentRentalPayment.findByPk(req.params.paymentId);
    if (!payment || String(payment.rental_id) !== String(req.params.id)) {
      return res.status(404).json({ success: false, message: "Төлбөр олдсонгүй" });
    }

    const paid = amount_paid !== undefined ? amount_paid : payment.amount_paid;
    const nextStatus = refreshPaymentStatus({
      ...payment.toJSON(),
      amount_paid: paid,
    });

    await payment.update({
      amount_paid: paid,
      paid_date: paid_date || payment.paid_date || formatDateOnly(new Date()),
      invoice_number: invoice_number ?? payment.invoice_number,
      notes: notes ?? payment.notes,
      status: nextStatus,
    });

    const data = await EquipmentRental.findByPk(req.params.id, { include: rentalInclude });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.completeRental = async (req, res) => {
  try {
    const rental = await EquipmentRental.findByPk(req.params.id);
    if (!rental) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    await rental.update({
      status: "completed",
      motor_hours_end: req.body.motor_hours_end ?? rental.motor_hours_end,
    });

    const data = await EquipmentRental.findByPk(rental.id, { include: rentalInclude });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
