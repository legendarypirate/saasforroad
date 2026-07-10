const { Op } = require("sequelize");
const db = require("../models");
const { makeCrud, todayISO } = require("../utils/uniformCrud");

const Item = db.uni_items;
const Movement = db.uni_stock_movements;
const Issue = db.uni_issues;
const IssueLine = db.uni_issue_lines;
const Return = db.uni_returns;
const Request = db.uni_requests;
const User = db.users;
const Project = db.projects;

const itemInc = { model: Item, as: "item", attributes: ["id", "code", "name", "category", "stock_qty"], required: false };
const userInc = (as) => ({ model: User, as, attributes: ["id", "username", "position"], required: false });
const projectInc = { model: Project, as: "project", attributes: ["id", "name"], required: false };

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function nextNumber(Model, prefix) {
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

async function changeStock(itemId, delta, meta = {}) {
  const item = await Item.findByPk(itemId);
  if (!item) throw new Error("Бараа олдсонгүй");
  const next = num(item.stock_qty) + delta;
  if (next < 0) throw new Error(`${item.name}: үлдэгдэл хүрэлцэхгүй (${item.stock_qty})`);
  await item.update({ stock_qty: next });
  await Movement.create({
    item_id: itemId,
    movement_date: meta.date || todayISO(),
    type: meta.type || (delta >= 0 ? "in" : "out"),
    qty: Math.abs(delta),
    reference: meta.reference || null,
    notes: meta.notes || null,
    created_by: meta.created_by || null,
  });
  return item;
}

async function refreshIssueStatus(issueId) {
  const lines = await IssueLine.findAll({ where: { issue_id: issueId } });
  if (!lines.length) return;
  const allReturned = lines.every((l) => num(l.qty_returned) >= num(l.qty));
  const anyReturned = lines.some((l) => num(l.qty_returned) > 0);
  const status = allReturned ? "returned" : anyReturned ? "partial_returned" : "issued";
  await Issue.update({ status }, { where: { id: issueId } });
}

// ── Items ─────────────────────────────────────────────────
const itemCrud = makeCrud(Item, {
  order: [["name", "ASC"]],
  buildPayload: (body) => ({
    code: body.code || null,
    name: body.name?.trim(),
    category: body.category || "workwear",
    unit: body.unit || "ширхэг",
    size_options: body.size_options || null,
    unit_cost: num(body.unit_cost),
    stock_qty: body.stock_qty !== undefined ? num(body.stock_qty) : undefined,
    min_stock: num(body.min_stock),
    is_active: body.is_active !== false && body.is_active !== 0 && body.is_active !== "0",
    notes: body.notes || null,
  }),
  beforeCreate: async (payload) => {
    if (!payload.name) throw new Error("Нэр шаардлагатай");
    if (!payload.code) {
      const c = await Item.count();
      payload.code = `UNI-${String(c + 1).padStart(3, "0")}`;
    }
    if (payload.stock_qty === undefined) payload.stock_qty = 0;
  },
});

exports.listItems = itemCrud.findAll;
exports.getItem = itemCrud.findOne;
exports.createItem = itemCrud.create;
exports.updateItem = async (req, res) => {
  try {
    const row = await Item.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const body = req.body || {};
    // Don't allow direct stock_qty overwrite via update — use movements
    await row.update({
      code: body.code !== undefined ? body.code : row.code,
      name: body.name?.trim() || row.name,
      category: body.category || row.category,
      unit: body.unit || row.unit,
      size_options: body.size_options !== undefined ? body.size_options : row.size_options,
      unit_cost: body.unit_cost !== undefined ? num(body.unit_cost) : row.unit_cost,
      min_stock: body.min_stock !== undefined ? num(body.min_stock) : row.min_stock,
      is_active:
        body.is_active !== undefined
          ? body.is_active !== false && body.is_active !== 0 && body.is_active !== "0"
          : row.is_active,
      notes: body.notes !== undefined ? body.notes : row.notes,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.deleteItem = itemCrud.delete;

// ── Stock movements ───────────────────────────────────────
const movementInclude = [itemInc, userInc("creator")];

exports.listMovements = async (req, res) => {
  try {
    const where = {};
    if (req.query.item_id) where.item_id = req.query.item_id;
    if (req.query.type) where.type = req.query.type;
    const data = await Movement.findAll({
      where,
      include: movementInclude,
      order: [["movement_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMovement = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.item_id) return res.status(400).json({ success: false, message: "Бараа сонгоно уу" });
    const qty = num(body.qty);
    if (!qty) return res.status(400).json({ success: false, message: "Тоо шаардлагатай" });
    const type = body.type || "in";
    const delta = type === "out" ? -qty : type === "adjust" ? qty : qty;
    // adjust: qty is signed absolute change if negative string? treat as set delta from body.delta or qty for in
    let d = delta;
    if (type === "adjust") d = body.delta !== undefined ? num(body.delta) : qty;

    await changeStock(body.item_id, d, {
      date: body.movement_date || todayISO(),
      type,
      reference: body.reference || null,
      notes: body.notes || null,
      created_by: body.created_by || null,
    });

    const data = await Movement.findAll({
      where: { item_id: body.item_id },
      include: movementInclude,
      order: [["id", "DESC"]],
      limit: 1,
    });
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Issues ────────────────────────────────────────────────
const issueInclude = [
  userInc("receiver"),
  userInc("issuer"),
  projectInc,
  {
    model: IssueLine,
    as: "lines",
    include: [itemInc],
  },
];

exports.listIssues = async (req, res) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.status) where.status = req.query.status;
    const data = await Issue.findAll({
      where,
      include: issueInclude,
      order: [["issue_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getIssue = async (req, res) => {
  try {
    const row = await Issue.findByPk(req.params.id, { include: issueInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createIssue = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const body = req.body || {};
    if (!body.user_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Ажилтан сонгоно уу" });
    }
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!lines.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Дор хаяж нэг мөр нэмнэ үү" });
    }

    const issue = await Issue.create(
      {
        number: body.number || (await nextNumber(Issue, "UNI")),
        issue_date: body.issue_date || todayISO(),
        user_id: body.user_id,
        project_id: body.project_id || null,
        issued_by: body.issued_by || body.created_by || null,
        status: "issued",
        notes: body.notes || null,
      },
      { transaction: t }
    );

    for (const line of lines) {
      const qty = num(line.qty, 1);
      if (!line.item_id || !qty) continue;
      const item = await Item.findByPk(line.item_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!item) throw new Error("Бараа олдсонгүй");
      if (num(item.stock_qty) < qty) throw new Error(`${item.name}: үлдэгдэл хүрэлцэхгүй`);
      await item.update({ stock_qty: num(item.stock_qty) - qty }, { transaction: t });
      await IssueLine.create(
        {
          issue_id: issue.id,
          item_id: line.item_id,
          size: line.size || null,
          qty,
          qty_returned: 0,
          condition_note: line.condition_note || null,
        },
        { transaction: t }
      );
      await Movement.create(
        {
          item_id: line.item_id,
          movement_date: body.issue_date || todayISO(),
          type: "out",
          qty,
          reference: issue.number,
          notes: `Олголт → user #${body.user_id}`,
          created_by: body.issued_by || body.created_by || null,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const full = await Issue.findByPk(issue.id, { include: issueInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteIssue = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const issue = await Issue.findByPk(req.params.id, {
      include: [{ model: IssueLine, as: "lines" }],
      transaction: t,
    });
    if (!issue) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    for (const line of issue.lines || []) {
      const outstanding = num(line.qty) - num(line.qty_returned);
      if (outstanding > 0) {
        const item = await Item.findByPk(line.item_id, { transaction: t });
        if (item) await item.update({ stock_qty: num(item.stock_qty) + outstanding }, { transaction: t });
      }
      await Return.destroy({ where: { issue_line_id: line.id }, transaction: t });
      await line.destroy({ transaction: t });
    }
    await issue.destroy({ transaction: t });
    await t.commit();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Returns ───────────────────────────────────────────────
const returnInclude = [
  userInc("receiver"),
  {
    model: IssueLine,
    as: "issueLine",
    include: [itemInc, { model: Issue, as: "issue", attributes: ["id", "number", "user_id", "issue_date"] }],
  },
];

exports.listReturns = async (req, res) => {
  try {
    const data = await Return.findAll({
      include: returnInclude,
      order: [["return_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createReturn = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const body = req.body || {};
    if (!body.issue_line_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Олголтын мөр сонгоно уу" });
    }
    const line = await IssueLine.findByPk(body.issue_line_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!line) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Мөр олдсонгүй" });
    }
    const qty = num(body.qty, 1);
    const remaining = num(line.qty) - num(line.qty_returned);
    if (qty <= 0 || qty > remaining) {
      await t.rollback();
      return res.status(400).json({ success: false, message: `Буцаах тоо буруу (үлдсэн: ${remaining})` });
    }

    const condition = body.condition || "good";
    const row = await Return.create(
      {
        return_date: body.return_date || todayISO(),
        issue_line_id: line.id,
        qty,
        condition,
        notes: body.notes || null,
        received_by: body.received_by || body.created_by || null,
      },
      { transaction: t }
    );

    await line.update({ qty_returned: num(line.qty_returned) + qty }, { transaction: t });

    if (condition === "good") {
      const item = await Item.findByPk(line.item_id, { transaction: t });
      if (item) {
        await item.update({ stock_qty: num(item.stock_qty) + qty }, { transaction: t });
        await Movement.create(
          {
            item_id: line.item_id,
            movement_date: body.return_date || todayISO(),
            type: "in",
            qty,
            reference: `RET-${row.id}`,
            notes: "Буцаалт (сайн)",
            created_by: body.received_by || null,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    await refreshIssueStatus(line.issue_id);
    const full = await Return.findByPk(row.id, { include: returnInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReturn = async (req, res) => {
  try {
    const n = await Return.destroy({ where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Open issue lines for return form
exports.listOpenIssueLines = async (req, res) => {
  try {
    const lines = await IssueLine.findAll({
      include: [
        itemInc,
        {
          model: Issue,
          as: "issue",
          attributes: ["id", "number", "issue_date", "user_id", "status"],
          include: [userInc("receiver")],
          where: { status: { [Op.in]: ["issued", "partial_returned"] } },
        },
      ],
      order: [["id", "DESC"]],
    });
    const open = lines.filter((l) => num(l.qty) - num(l.qty_returned) > 0);
    res.json({ success: true, data: open });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Requests ──────────────────────────────────────────────
const requestInclude = [itemInc, projectInc, userInc("requester"), userInc("approver")];

const requestCrud = makeCrud(Request, {
  include: requestInclude,
  order: [["request_date", "DESC"]],
  buildPayload: (body) => ({
    request_date: body.request_date || todayISO(),
    user_id: body.user_id,
    project_id: body.project_id || null,
    item_id: body.item_id,
    size: body.size || null,
    qty: num(body.qty, 1),
    status: body.status || "pending",
    notes: body.notes || null,
  }),
  beforeCreate: async (payload) => {
    if (!payload.user_id || !payload.item_id) throw new Error("Ажилтан болон бараа шаардлагатай");
  },
});

exports.listRequests = requestCrud.findAll;
exports.getRequest = requestCrud.findOne;
exports.createRequest = requestCrud.create;
exports.updateRequest = requestCrud.update;
exports.deleteRequest = requestCrud.delete;

exports.approveRequest = async (req, res) => {
  try {
    const row = await Request.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const status = req.body?.status === "rejected" ? "rejected" : "approved";
    await row.update({
      status,
      approved_by: req.body?.approved_by || null,
    });
    const full = await Request.findByPk(row.id, { include: requestInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Dashboard / reports ───────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const today = todayISO();
    const monthStart = `${today.slice(0, 7)}-01`;
    const items = await Item.findAll({ where: { is_active: true } });
    const low_stock = items.filter((i) => num(i.stock_qty) <= num(i.min_stock));
    const issuesToday = await Issue.count({ where: { issue_date: today } });
    const issuesMonth = await Issue.count({ where: { issue_date: { [Op.gte]: monthStart } } });
    const openIssues = await Issue.count({
      where: { status: { [Op.in]: ["issued", "partial_returned"] } },
    });
    const pendingRequests = await Request.count({ where: { status: "pending" } });

    res.json({
      success: true,
      data: {
        item_count: items.length,
        low_stock_count: low_stock.length,
        low_stock: low_stock.slice(0, 10).map((i) => ({
          id: i.id,
          name: i.name,
          stock_qty: i.stock_qty,
          min_stock: i.min_stock,
        })),
        issues_today: issuesToday,
        issues_month: issuesMonth,
        open_issues: openIssues,
        pending_requests: pendingRequests,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reports = async (req, res) => {
  try {
    const where = {};
    if (req.query.from || req.query.to) {
      where.issue_date = {};
      if (req.query.from) where.issue_date[Op.gte] = req.query.from;
      if (req.query.to) where.issue_date[Op.lte] = req.query.to;
    }
    if (req.query.user_id) where.user_id = req.query.user_id;

    const issues = await Issue.findAll({
      where,
      include: issueInclude,
      order: [["issue_date", "DESC"]],
    });

    const by_person = {};
    const by_item = {};
    for (const issue of issues) {
      const uname = issue.receiver?.username || `#${issue.user_id}`;
      if (!by_person[uname]) by_person[uname] = { username: uname, issues: 0, qty: 0 };
      by_person[uname].issues += 1;
      for (const line of issue.lines || []) {
        by_person[uname].qty += num(line.qty);
        const iname = line.item?.name || `#${line.item_id}`;
        if (!by_item[iname]) by_item[iname] = { name: iname, qty: 0, returned: 0 };
        by_item[iname].qty += num(line.qty);
        by_item[iname].returned += num(line.qty_returned);
      }
    }

    const items = await Item.findAll({ order: [["name", "ASC"]] });
    const stock = items.map((i) => ({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category,
      stock_qty: i.stock_qty,
      min_stock: i.min_stock,
      low: num(i.stock_qty) <= num(i.min_stock),
    }));

    res.json({
      success: true,
      data: {
        by_person: Object.values(by_person),
        by_item: Object.values(by_item),
        stock,
        issues,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
