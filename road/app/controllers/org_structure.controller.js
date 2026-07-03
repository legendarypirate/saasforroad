const db = require("../models");
const OrgNode = db.org_nodes;
const User = db.users;
const Role = db.roles;
const Op = db.Sequelize.Op;

const userAttrs = ["id", "username", "position", "profile_image", "phone", "email", "role"];
const userInclude = [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }];

const nodeInclude = [
  {
    model: User,
    as: "user",
    attributes: userAttrs,
    include: userInclude,
  },
];

function buildTree(nodes, parentId = null) {
  return nodes
    .filter((n) => (n.parent_id ?? null) === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((n) => {
      const plain = n.toJSON ? n.toJSON() : n;
      return {
        ...plain,
        children: buildTree(nodes, plain.id),
      };
    });
}

async function isDescendant(nodeId, potentialParentId, nodes) {
  if (!potentialParentId) return false;
  let current = potentialParentId;
  while (current) {
    if (current === nodeId) return true;
    const parent = nodes.find((n) => n.id === current);
    current = parent ? parent.parent_id : null;
  }
  return false;
}

async function deleteRecursive(nodeId) {
  const children = await OrgNode.findAll({ where: { parent_id: nodeId } });
  for (const child of children) {
    await deleteRecursive(child.id);
  }
  await OrgNode.destroy({ where: { id: nodeId } });
}

async function nextSortOrder(parentId) {
  const max = await OrgNode.max("sort_order", {
    where: { parent_id: parentId ?? null },
  });
  return (max ?? 0) + 1;
}

async function ensureRoot() {
  const count = await OrgNode.count();
  if (count === 0) {
    await OrgNode.create({
      name: "Байгууллага",
      node_type: "department",
      parent_id: null,
      sort_order: 0,
    });
  }
}

exports.getTree = async (req, res) => {
  try {
    await ensureRoot();
    const nodes = await OrgNode.findAll({
      include: nodeInclude,
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"],
      ],
    });

    const assignedUserIds = nodes.map((n) => n.user_id).filter(Boolean);
    const unassignedWhere =
      assignedUserIds.length > 0 ? { id: { [Op.notIn]: assignedUserIds } } : {};

    const unassigned = await User.findAll({
      where: unassignedWhere,
      attributes: userAttrs,
      include: userInclude,
      order: [["username", "ASC"]],
    });

    res.json({
      success: true,
      data: {
        tree: buildTree(nodes),
        unassigned,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Хэлтсийн нэр шаардлагатай" });
  }

  try {
    if (parent_id) {
      const parent = await OrgNode.findByPk(parent_id);
      if (!parent || parent.node_type !== "department") {
        return res.status(400).json({ success: false, message: "Эцэг хэлтэс олдсонгүй" });
      }
    }

    const node = await OrgNode.create({
      name: name.trim(),
      parent_id: parent_id || null,
      node_type: "department",
      sort_order: await nextSortOrder(parent_id || null),
    });

    const full = await OrgNode.findByPk(node.id, { include: nodeInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const { name, position_title } = req.body;

  try {
    const node = await OrgNode.findByPk(id);
    if (!node) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (position_title !== undefined) updates.position_title = position_title;

    await node.update(updates);
    const full = await OrgNode.findByPk(id, { include: nodeInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignUser = async (req, res) => {
  const { user_id, parent_id, position_title } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id шаардлагатай" });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    if (parent_id) {
      const parent = await OrgNode.findByPk(parent_id);
      if (!parent || parent.node_type !== "department") {
        return res.status(400).json({ success: false, message: "Хэлтэс сонгоно уу" });
      }
    }

    const existing = await OrgNode.findOne({ where: { user_id } });
    if (existing) {
      await existing.update({
        parent_id: parent_id || null,
        position_title: position_title ?? existing.position_title ?? user.position,
      });
      const full = await OrgNode.findByPk(existing.id, { include: nodeInclude });
      return res.json({ success: true, data: full });
    }

    const node = await OrgNode.create({
      name: user.username,
      parent_id: parent_id || null,
      node_type: "user",
      user_id,
      position_title: position_title || user.position || null,
      sort_order: await nextSortOrder(parent_id || null),
    });

    const full = await OrgNode.findByPk(node.id, { include: nodeInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.move = async (req, res) => {
  const { node_id, parent_id, sort_order } = req.body;
  if (!node_id) {
    return res.status(400).json({ success: false, message: "node_id шаардлагатай" });
  }

  try {
    const node = await OrgNode.findByPk(node_id);
    if (!node) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    const newParentId = parent_id ?? null;

    if (newParentId) {
      const parent = await OrgNode.findByPk(newParentId);
      if (!parent || parent.node_type !== "department") {
        return res.status(400).json({ success: false, message: "Зөвхөн хэлтэс дээр байрлуулна" });
      }
    }

    if (node.node_type === "department") {
      const allNodes = await OrgNode.findAll({ attributes: ["id", "parent_id"] });
      if (node_id === newParentId) {
        return res.status(400).json({ success: false, message: "Өөрөө өөрийн доор байрлуулах боломжгүй" });
      }
      if (await isDescendant(node_id, newParentId, allNodes)) {
        return res.status(400).json({ success: false, message: "Дэд хэлтсийг эцэг хэлтэс болгох боломжгүй" });
      }
    }

    await node.update({
      parent_id: newParentId,
      sort_order: sort_order ?? node.sort_order,
    });

    const full = await OrgNode.findByPk(node_id, { include: nodeInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  const id = req.params.id;

  try {
    const node = await OrgNode.findByPk(id);
    if (!node) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    if (node.node_type === "department" && node.parent_id === null) {
      const rootCount = await OrgNode.count({ where: { parent_id: null, node_type: "department" } });
      if (rootCount <= 1) {
        return res.status(400).json({ success: false, message: "Үндсэн бүтцийг устгах боломжгүй" });
      }
    }

    await deleteRecursive(id);
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.unassignUser = async (req, res) => {
  const id = req.params.id;

  try {
    const node = await OrgNode.findByPk(id);
    if (!node || node.node_type !== "user") {
      return res.status(404).json({ success: false, message: "Ажилтан олдсонгүй" });
    }

    await node.destroy();
    res.json({ success: true, message: "Бүтцээс хасагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
