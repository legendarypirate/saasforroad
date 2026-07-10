const { Op } = require("sequelize");
const db = require("../models");
const { makeCrud, todayISO } = require("../utils/financeCrud");

const Account = db.fin_accounts;
const Contract = db.fin_contracts;
const Invoice = db.fin_invoices;
const InvoiceLine = db.fin_invoice_lines;
const Payment = db.fin_payments;
const Budget = db.fin_budgets;
const Expense = db.fin_expenses;
const VatEntry = db.fin_vat_entries;
const Project = db.projects;
const Supplier = db.suppliers;
const User = db.users;

const projectInc = { model: Project, as: "project", attributes: ["id", "name"], required: false };
const supplierInc = { model: Supplier, as: "supplier", attributes: ["id", "name"], required: false };
const userInc = (as) => ({ model: User, as, attributes: ["id", "username"], required: false });
const accountInc = { model: Account, as: "account", attributes: ["id", "code", "name", "type"], required: false };

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function invoiceStatus(total, paid) {
  const t = num(total);
  const p = num(paid);
  if (t <= 0) return "draft";
  if (p <= 0) return "issued";
  if (p + 0.001 >= t) return "paid";
  return "partial";
}

async function nextDocNumber(Model, prefix) {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;
  const last = await Model.findOne({
    where: { number: { [Op.iLike]: like } },
    order: [["number", "DESC"]],
  });
  let seq = 1;
  if (last?.number) {
    const parts = String(last.number).split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

async function syncVatForInvoice(invoice) {
  if (!invoice || num(invoice.vat_amount) <= 0) return;
  const type = invoice.direction === "ap" ? "input" : "output";
  const existing = await VatEntry.findOne({ where: { invoice_id: invoice.id } });
  const payload = {
    entry_date: invoice.issue_date || todayISO(),
    type,
    invoice_id: invoice.id,
    base_amount: num(invoice.subtotal),
    vat_amount: num(invoice.vat_amount),
    vat_rate: num(invoice.subtotal) > 0 ? (num(invoice.vat_amount) / num(invoice.subtotal)) * 100 : 10,
    counterparty: invoice.counterparty || null,
  };
  if (existing) await existing.update(payload);
  else await VatEntry.create(payload);
}

async function syncVatForExpense(expense) {
  if (!expense || num(expense.vat_amount) <= 0) return;
  const existing = await VatEntry.findOne({ where: { expense_id: expense.id } });
  const payload = {
    entry_date: expense.expense_date || todayISO(),
    type: "input",
    expense_id: expense.id,
    base_amount: Math.max(0, num(expense.amount) - num(expense.vat_amount)),
    vat_amount: num(expense.vat_amount),
    vat_rate: 10,
    counterparty: null,
    notes: expense.description || null,
  };
  if (existing) await existing.update(payload);
  else await VatEntry.create(payload);
}

async function applyPaymentToInvoice(payment) {
  if (!payment.invoice_id) return;
  const invoice = await Invoice.findByPk(payment.invoice_id);
  if (!invoice) return;
  const payments = await Payment.findAll({ where: { invoice_id: invoice.id } });
  const paid = payments.reduce((s, p) => s + num(p.amount), 0);
  const status =
    invoice.status === "cancelled" || invoice.status === "draft"
      ? invoice.status
      : invoiceStatus(invoice.total, paid);
  await invoice.update({
    paid_amount: paid,
    status: invoice.status === "draft" && paid > 0 ? invoiceStatus(invoice.total, paid) : status,
  });
}

async function replaceInvoiceLines(invoiceId, lines) {
  await InvoiceLine.destroy({ where: { invoice_id: invoiceId } });
  if (!Array.isArray(lines) || lines.length === 0) return { subtotal: 0, vat_amount: 0, total: 0 };
  let subtotal = 0;
  let vat_amount = 0;
  for (const line of lines) {
    const qty = num(line.qty, 1);
    const unit_price = num(line.unit_price);
    const amount = num(line.amount, qty * unit_price);
    const vat_rate = num(line.vat_rate, 10);
    subtotal += amount;
    vat_amount += (amount * vat_rate) / 100;
    await InvoiceLine.create({
      invoice_id: invoiceId,
      description: line.description || "",
      qty,
      unit_price,
      amount,
      vat_rate,
    });
  }
  return { subtotal, vat_amount, total: subtotal + vat_amount };
}

// ── Accounts ──────────────────────────────────────────────
const accountCrud = makeCrud(Account, {
  order: [["code", "ASC"]],
  buildPayload: (body) => ({
    code: body.code?.trim() || null,
    name: body.name?.trim(),
    type: body.type || "bank",
    bank_name: body.bank_name || null,
    account_number: body.account_number || null,
    opening_balance: num(body.opening_balance),
    currency: body.currency || "MNT",
    is_active: body.is_active !== false && body.is_active !== "0" && body.is_active !== 0,
    notes: body.notes || null,
  }),
  beforeCreate: async (payload) => {
    if (!payload.name) throw new Error("Нэр шаардлагатай");
    if (!payload.code) {
      const count = await Account.count();
      payload.code = `ACC-${String(count + 1).padStart(3, "0")}`;
    }
  },
});

exports.listAccounts = accountCrud.findAll;
exports.getAccount = accountCrud.findOne;
exports.createAccount = accountCrud.create;
exports.updateAccount = accountCrud.update;
exports.deleteAccount = accountCrud.delete;

// ── Contracts ─────────────────────────────────────────────
const contractCrud = makeCrud(Contract, {
  include: [projectInc, supplierInc],
  buildPayload: (body) => ({
    number: body.number || null,
    type: body.type || "client",
    party_name: body.party_name || null,
    project_id: body.project_id || null,
    supplier_id: body.supplier_id || null,
    amount: num(body.amount),
    vat_rate: num(body.vat_rate, 10),
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    status: body.status || "active",
    notes: body.notes || null,
  }),
  beforeCreate: async (payload) => {
    if (!payload.number) payload.number = await nextDocNumber(Contract, "CTR");
  },
});

exports.listContracts = contractCrud.findAll;
exports.getContract = contractCrud.findOne;
exports.createContract = contractCrud.create;
exports.updateContract = contractCrud.update;
exports.deleteContract = contractCrud.delete;

// ── Invoices (AR + AP via direction) ──────────────────────
const invoiceInclude = [
  projectInc,
  supplierInc,
  { model: Contract, as: "contract", attributes: ["id", "number", "party_name"], required: false },
  userInc("creator"),
  { model: InvoiceLine, as: "lines" },
];

async function saveInvoice(req, res, isUpdate) {
  try {
    const body = req.body || {};
    const direction = body.direction || (isUpdate ? undefined : "ar");
    let row;
    if (isUpdate) {
      row = await Invoice.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    const prefix = (direction || row.direction) === "ap" ? "BILL" : "INV";
    const number = body.number || (isUpdate ? row.number : await nextDocNumber(Invoice, prefix));

    const payload = {
      number,
      direction: direction || row.direction,
      project_id: body.project_id !== undefined ? body.project_id || null : row?.project_id,
      supplier_id: body.supplier_id !== undefined ? body.supplier_id || null : row?.supplier_id,
      contract_id: body.contract_id !== undefined ? body.contract_id || null : row?.contract_id,
      counterparty: body.counterparty !== undefined ? body.counterparty : row?.counterparty,
      issue_date: body.issue_date || row?.issue_date || todayISO(),
      due_date: body.due_date !== undefined ? body.due_date || null : row?.due_date,
      description: body.description !== undefined ? body.description : row?.description,
      status: body.status || row?.status || "draft",
      created_by: row?.created_by || body.created_by || null,
    };

    if (!isUpdate) row = await Invoice.create(payload);
    else await row.update(payload);

    let totals = {
      subtotal: num(body.subtotal, num(row.subtotal)),
      vat_amount: num(body.vat_amount, num(row.vat_amount)),
      total: num(body.total, num(row.total)),
    };
    if (Array.isArray(body.lines)) {
      totals = await replaceInvoiceLines(row.id, body.lines);
    }
    const paid_amount = num(row.paid_amount);
    const status =
      body.status ||
      (payload.status === "cancelled" ? "cancelled" : invoiceStatus(totals.total, paid_amount));
    await row.update({ ...totals, paid_amount, status: status === "draft" && paid_amount > 0 ? invoiceStatus(totals.total, paid_amount) : status });

    const full = await Invoice.findByPk(row.id, { include: invoiceInclude });
    await syncVatForInvoice(full);
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

exports.listInvoices = async (req, res) => {
  try {
    const where = {};
    if (req.query.direction) where.direction = req.query.direction;
    if (req.query.status) where.status = req.query.status;
    if (req.query.project_id) where.project_id = req.query.project_id;
    const data = await Invoice.findAll({
      where,
      include: invoiceInclude,
      order: [["issue_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const row = await Invoice.findByPk(req.params.id, { include: invoiceInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInvoice = (req, res) => saveInvoice(req, res, false);
exports.updateInvoice = (req, res) => saveInvoice(req, res, true);

exports.deleteInvoice = async (req, res) => {
  try {
    await InvoiceLine.destroy({ where: { invoice_id: req.params.id } });
    await VatEntry.destroy({ where: { invoice_id: req.params.id } });
    const numDel = await Invoice.destroy({ where: { id: req.params.id } });
    if (numDel !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Payments ──────────────────────────────────────────────
const paymentInclude = [accountInc, projectInc, supplierInc, userInc("creator"), {
  model: Invoice,
  as: "invoice",
  attributes: ["id", "number", "direction", "total", "paid_amount", "status"],
  required: false,
}];

exports.listPayments = async (req, res) => {
  try {
    const where = {};
    if (req.query.direction) where.direction = req.query.direction;
    if (req.query.account_id) where.account_id = req.query.account_id;
    const data = await Payment.findAll({
      where,
      include: paymentInclude,
      order: [["payment_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const row = await Payment.findByPk(req.params.id, { include: paymentInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.account_id) return res.status(400).json({ success: false, message: "Данс сонгоно уу" });
    if (!num(body.amount)) return res.status(400).json({ success: false, message: "Дүн шаардлагатай" });

    let direction = body.direction;
    if (!direction && body.invoice_id) {
      const inv = await Invoice.findByPk(body.invoice_id);
      direction = inv?.direction === "ap" ? "out" : "in";
    }
    direction = direction || "in";

    const row = await Payment.create({
      number: body.number || (await nextDocNumber(Payment, "PAY")),
      payment_date: body.payment_date || todayISO(),
      account_id: body.account_id,
      direction,
      amount: num(body.amount),
      method: body.method || "transfer",
      invoice_id: body.invoice_id || null,
      project_id: body.project_id || null,
      supplier_id: body.supplier_id || null,
      reference: body.reference || null,
      notes: body.notes || null,
      created_by: body.created_by || null,
    });
    await applyPaymentToInvoice(row);
    const full = await Payment.findByPk(row.id, { include: paymentInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const row = await Payment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const body = req.body || {};
    const prevInvoiceId = row.invoice_id;
    await row.update({
      payment_date: body.payment_date ?? row.payment_date,
      account_id: body.account_id ?? row.account_id,
      direction: body.direction ?? row.direction,
      amount: body.amount !== undefined ? num(body.amount) : row.amount,
      method: body.method ?? row.method,
      invoice_id: body.invoice_id !== undefined ? body.invoice_id || null : row.invoice_id,
      project_id: body.project_id !== undefined ? body.project_id || null : row.project_id,
      supplier_id: body.supplier_id !== undefined ? body.supplier_id || null : row.supplier_id,
      reference: body.reference !== undefined ? body.reference : row.reference,
      notes: body.notes !== undefined ? body.notes : row.notes,
    });
    if (prevInvoiceId) await applyPaymentToInvoice({ invoice_id: prevInvoiceId });
    await applyPaymentToInvoice(row);
    const full = await Payment.findByPk(row.id, { include: paymentInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const row = await Payment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const invoiceId = row.invoice_id;
    await row.destroy();
    if (invoiceId) await applyPaymentToInvoice({ invoice_id: invoiceId });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Budgets ───────────────────────────────────────────────
const budgetCrud = makeCrud(Budget, {
  include: [projectInc],
  order: [["year", "DESC"], ["category", "ASC"]],
  buildPayload: (body) => ({
    project_id: body.project_id || null,
    year: num(body.year, new Date().getFullYear()),
    category: body.category?.trim() || "Ерөнхий",
    planned_amount: num(body.planned_amount),
    notes: body.notes || null,
  }),
});

exports.listBudgets = budgetCrud.findAll;
exports.getBudget = budgetCrud.findOne;
exports.createBudget = budgetCrud.create;
exports.updateBudget = budgetCrud.update;
exports.deleteBudget = budgetCrud.delete;

// ── Expenses ──────────────────────────────────────────────
const expenseInclude = [accountInc, projectInc, userInc("user"), userInc("creator"), userInc("approver")];

const expenseCrud = makeCrud(Expense, {
  include: expenseInclude,
  order: [["expense_date", "DESC"]],
  buildPayload: (body) => ({
    expense_date: body.expense_date || todayISO(),
    account_id: body.account_id || null,
    user_id: body.user_id || body.created_by || null,
    project_id: body.project_id || null,
    category: body.category || null,
    amount: num(body.amount),
    vat_amount: num(body.vat_amount),
    status: body.status || "draft",
    description: body.description || null,
    created_by: body.created_by || null,
  }),
  afterCreate: async (row) => {
    await syncVatForExpense(row);
  },
  afterUpdate: async (row) => {
    await syncVatForExpense(row);
  },
});

exports.listExpenses = expenseCrud.findAll;
exports.getExpense = expenseCrud.findOne;
exports.createExpense = expenseCrud.create;
exports.updateExpense = expenseCrud.update;
exports.deleteExpense = async (req, res) => {
  try {
    await VatEntry.destroy({ where: { expense_id: req.params.id } });
    const n = await Expense.destroy({ where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const row = await Expense.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      status: req.body?.status === "rejected" ? "rejected" : "approved",
      approved_by: req.body?.approved_by || null,
    });
    const full = await Expense.findByPk(row.id, { include: expenseInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── VAT ───────────────────────────────────────────────────
const vatCrud = makeCrud(VatEntry, {
  include: [
    { model: Invoice, as: "invoice", attributes: ["id", "number", "direction"], required: false },
    { model: Expense, as: "expense", attributes: ["id", "category", "description"], required: false },
  ],
  order: [["entry_date", "DESC"]],
  buildPayload: (body) => ({
    entry_date: body.entry_date || todayISO(),
    type: body.type || "output",
    invoice_id: body.invoice_id || null,
    expense_id: body.expense_id || null,
    base_amount: num(body.base_amount),
    vat_amount: num(body.vat_amount),
    vat_rate: num(body.vat_rate, 10),
    counterparty: body.counterparty || null,
    notes: body.notes || null,
  }),
  filterWhere: (q) => {
    const where = {};
    if (q.type) where.type = q.type;
    return where;
  },
});

exports.listVat = vatCrud.findAll;
exports.getVat = vatCrud.findOne;
exports.createVat = vatCrud.create;
exports.updateVat = vatCrud.update;
exports.deleteVat = vatCrud.delete;

// ── Dashboard ─────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const accounts = await Account.findAll({ where: { is_active: true } });
    const payments = await Payment.findAll();
    const cashByAccount = accounts.map((acc) => {
      const related = payments.filter((p) => p.account_id === acc.id);
      const inSum = related.filter((p) => p.direction === "in").reduce((s, p) => s + num(p.amount), 0);
      const outSum = related.filter((p) => p.direction === "out").reduce((s, p) => s + num(p.amount), 0);
      const balance = num(acc.opening_balance) + inSum - outSum;
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance,
      };
    });
    const cash_total = cashByAccount.reduce((s, a) => s + a.balance, 0);

    const arInvoices = await Invoice.findAll({
      where: { direction: "ar", status: { [Op.notIn]: ["cancelled", "draft"] } },
    });
    const apInvoices = await Invoice.findAll({
      where: { direction: "ap", status: { [Op.notIn]: ["cancelled", "draft"] } },
    });

    const openOf = (list) =>
      list.reduce((s, inv) => s + Math.max(0, num(inv.total) - num(inv.paid_amount)), 0);

    const today = todayISO();
    const overdueAr = arInvoices.filter(
      (inv) => inv.due_date && inv.due_date < today && num(inv.total) - num(inv.paid_amount) > 0.01
    ).length;
    const overdueAp = apInvoices.filter(
      (inv) => inv.due_date && inv.due_date < today && num(inv.total) - num(inv.paid_amount) > 0.01
    ).length;

    const monthStart = `${today.slice(0, 7)}-01`;
    const monthPayments = payments.filter((p) => p.payment_date && p.payment_date >= monthStart);
    const month_in = monthPayments.filter((p) => p.direction === "in").reduce((s, p) => s + num(p.amount), 0);
    const month_out = monthPayments.filter((p) => p.direction === "out").reduce((s, p) => s + num(p.amount), 0);

    res.json({
      success: true,
      data: {
        cash_total,
        cash_by_account: cashByAccount,
        ar_open: openOf(arInvoices),
        ap_open: openOf(apInvoices),
        overdue_ar: overdueAr,
        overdue_ap: overdueAp,
        month_in,
        month_out,
        month_net: month_in - month_out,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Reports ───────────────────────────────────────────────
exports.reports = async (req, res) => {
  try {
    const today = todayISO();
    const invoices = await Invoice.findAll({
      where: { status: { [Op.notIn]: ["cancelled"] } },
      include: [projectInc, supplierInc],
    });

    const agingBucket = (due, open) => {
      if (open <= 0) return null;
      if (!due || due >= today) return "current";
      const days = Math.floor((new Date(today) - new Date(due)) / 86400000);
      if (days <= 30) return "1_30";
      if (days <= 60) return "31_60";
      if (days <= 90) return "61_90";
      return "90_plus";
    };

    const emptyAging = () => ({ current: 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 });
    const ar_aging = emptyAging();
    const ap_aging = emptyAging();

    for (const inv of invoices) {
      const open = Math.max(0, num(inv.total) - num(inv.paid_amount));
      const bucket = agingBucket(inv.due_date, open);
      if (!bucket) continue;
      if (inv.direction === "ar") ar_aging[bucket] += open;
      else if (inv.direction === "ap") ap_aging[bucket] += open;
    }

    const accounts = await Account.findAll({ where: { is_active: true } });
    const payments = await Payment.findAll();
    const cash_by_account = accounts.map((acc) => {
      const related = payments.filter((p) => p.account_id === acc.id);
      const inSum = related.filter((p) => p.direction === "in").reduce((s, p) => s + num(p.amount), 0);
      const outSum = related.filter((p) => p.direction === "out").reduce((s, p) => s + num(p.amount), 0);
      return {
        id: acc.id,
        name: acc.name,
        code: acc.code,
        balance: num(acc.opening_balance) + inSum - outSum,
      };
    });

    const year = num(req.query.year, new Date().getFullYear());
    const budgets = await Budget.findAll({
      where: { year },
      include: [projectInc],
    });
    const expenses = await Expense.findAll({
      where: { status: { [Op.in]: ["approved", "paid", "submitted"] } },
    });
    const apBills = invoices.filter((i) => i.direction === "ap" && i.status !== "draft");

    const project_cost = budgets.map((b) => {
      const pid = b.project_id;
      const expenseSum = expenses
        .filter((e) => (pid ? e.project_id === pid : !e.project_id))
        .reduce((s, e) => s + num(e.amount), 0);
      const billSum = apBills
        .filter((i) => (pid ? i.project_id === pid : !i.project_id))
        .reduce((s, i) => s + num(i.total), 0);
      const actual = expenseSum + billSum;
      return {
        budget_id: b.id,
        project_id: pid,
        project_name: b.project?.name || "Компани",
        category: b.category,
        year: b.year,
        planned: num(b.planned_amount),
        actual,
        variance: num(b.planned_amount) - actual,
      };
    });

    const vatRows = await VatEntry.findAll();
    const vat_summary = {
      output: vatRows.filter((v) => v.type === "output").reduce((s, v) => s + num(v.vat_amount), 0),
      input: vatRows.filter((v) => v.type === "input").reduce((s, v) => s + num(v.vat_amount), 0),
    };
    vat_summary.payable = vat_summary.output - vat_summary.input;

    res.json({
      success: true,
      data: {
        ar_aging,
        ap_aging,
        cash_by_account,
        project_cost,
        vat_summary,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
