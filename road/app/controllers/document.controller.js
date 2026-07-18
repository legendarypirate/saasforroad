const db = require("../models");
const Document = db.documents;
const Folder = db.document_folders;
const Op = db.Sequelize.Op;
const { memoryUpload, fixMulterFile } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");
const { saveLocalUpload } = require("../utils/localUpload");
const multer = require("multer");

const upload = memoryUpload().single("file");

async function storeDocumentFile(file) {
  // Local-first for DMS — Cloudinary PDF/Office uploads often fail (paid PDF
  // add-on, raw quirks) while the UI already shows success. Disk is reliable.
  try {
    return saveLocalUpload(file, "documents");
  } catch (localErr) {
    console.warn("local document save failed, trying Cloudinary:", localErr?.message);
    return uploadMulterFile(file, "documents");
  }
}
const DOC_INCLUDE = [
  {
    model: db.projects,
    as: "project",
    attributes: ["id", "name", "road_name", "contract_number"],
    required: false,
  },
  {
    model: db.users,
    as: "creator",
    attributes: ["id", "username"],
    required: false,
  },
];

function parseParentId(value) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildMetaFromBody(body = {}) {
  const issue = body.issue_date != null ? String(body.issue_date).trim() : "";
  const expiry = body.expiry_date != null ? String(body.expiry_date).trim() : "";
  return {
    description: body.description ? String(body.description).trim() || null : null,
    doc_type: body.doc_type || "other",
    doc_number: body.doc_number ? String(body.doc_number).trim() || null : null,
    status: body.status || "active",
    project_id: parseOptionalInt(body.project_id),
    tags: body.tags ? String(body.tags).trim() || null : null,
    issue_date: issue || null,
    expiry_date: expiry || null,
    issuer: body.issuer ? String(body.issuer).trim() || null : null,
    notes: body.notes ? String(body.notes).trim() || null : null,
  };
}

/** company (default) | personal — from query or X-Doc-Scope header */
function resolveScope(req) {
  const raw =
    req.query?.scope ||
    req.headers["x-doc-scope"] ||
    req.headers["X-Doc-Scope"] ||
    "company";
  return String(raw).toLowerCase() === "personal" ? "personal" : "company";
}

function requireUserId(req, res) {
  const id = req.user?.id;
  if (!id) {
    res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    return null;
  }
  return id;
}

/** Owner filter: company = null only; personal = current user */
function ownerWhere(req, res) {
  const scope = resolveScope(req);
  if (scope === "personal") {
    const userId = requireUserId(req, res);
    if (userId == null) return null;
    return { scope, owner_user_id: userId, userId };
  }
  return { scope: "company", owner_user_id: null, userId: req.user?.id || null };
}

function scopeOwnerCondition(scopeInfo) {
  if (scopeInfo.scope === "personal") {
    return { owner_user_id: scopeInfo.owner_user_id };
  }
  // Explicit IS NULL — plain `null` can be unreliable with some Sequelize + AND combos
  return { owner_user_id: { [Op.is]: null } };
}

function matchesScope(row, scopeInfo) {
  if (!row) return false;
  if (scopeInfo.scope === "personal") {
    return Number(row.owner_user_id) === Number(scopeInfo.owner_user_id);
  }
  return row.owner_user_id == null;
}

// ─── Folders ───────────────────────────────────────────────────────────────

exports.listFolders = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;

    const parent_id =
      req.query.parent_id !== undefined ? parseParentId(req.query.parent_id) : undefined;
    const where = { ...scopeOwnerCondition(scopeInfo) };
    if (parent_id !== undefined) where.parent_id = parent_id;

    const data = await Folder.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["name", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "Хавтасны нэр шаардлагатай" });
    }
    const data = await Folder.create({
      name: req.body.name.trim(),
      parent_id: parseParentId(req.body.parent_id),
      description: req.body.description || null,
      sort_order: Number(req.body.sort_order) || 0,
      is_system: false,
      owner_user_id: scopeInfo.owner_user_id,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const folder = await Folder.findByPk(req.params.id);
    if (!folder || !matchesScope(folder, scopeInfo)) {
      return res.status(404).json({ success: false, message: "Хавтас олдсонгүй" });
    }
    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.description !== undefined) patch.description = req.body.description;
    if (req.body.parent_id !== undefined) patch.parent_id = parseParentId(req.body.parent_id);
    if (req.body.sort_order !== undefined) patch.sort_order = Number(req.body.sort_order) || 0;

    await folder.update(patch);
    res.json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const folder = await Folder.findByPk(req.params.id);
    if (!folder || !matchesScope(folder, scopeInfo)) {
      return res.status(404).json({ success: false, message: "Хавтас олдсонгүй" });
    }
    if (folder.is_system) {
      return res.status(400).json({
        success: false,
        message: "Системийн хавтсыг устгах боломжгүй",
      });
    }
    const childFolders = await Folder.count({
      where: { parent_id: folder.id, ...scopeOwnerCondition(scopeInfo) },
    });
    const childFiles = await Document.count({
      where: { parent_id: folder.id, ...scopeOwnerCondition(scopeInfo) },
    });
    if (childFolders > 0 || childFiles > 0) {
      return res.status(400).json({
        success: false,
        message: "Хавтас хоосон биш — эхлээд доторх зүйлсийг устгана уу",
      });
    }
    await folder.destroy();
    res.json({ success: true, message: "Хавтас устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Stats ─────────────────────────────────────────────────────────────────

exports.stats = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const ow = scopeOwnerCondition(scopeInfo);

    const [total, active, draft, archived, folders] = await Promise.all([
      Document.count({ where: ow }),
      Document.count({ where: { ...ow, status: "active" } }),
      Document.count({ where: { ...ow, status: "draft" } }),
      Document.count({ where: { ...ow, status: "archived" } }),
      Folder.count({ where: ow }),
    ]);

    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const expiring = await Document.count({
      where: {
        ...ow,
        expiry_date: { [Op.ne]: null, [Op.lte]: soon.toISOString().slice(0, 10) },
        status: { [Op.ne]: "archived" },
      },
    });

    const byTypeRows = await Document.findAll({
      attributes: ["doc_type", [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"]],
      where: ow,
      group: ["doc_type"],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        draft,
        archived,
        folders,
        expiring,
        by_type: byTypeRows.map((r) => ({
          doc_type: r.doc_type,
          count: Number(r.count) || 0,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Documents ─────────────────────────────────────────────────────────────

exports.create = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Файлын хэмжээ хэтэрсэн (хамгийн ихдээ 50MB)"
          : "File upload error.";
      return res.status(400).json({ success: false, message: msg });
    }
    if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unexpected error." });
    }
    if (!req.body.name || !req.file) {
      return res.status(400).json({ success: false, message: "Name and file are required!" });
    }

    try {
      const scopeInfo = ownerWhere(req, res);
      if (!scopeInfo) return;

      fixMulterFile(req.file);
      const result = await storeDocumentFile(req.file);
      if (!result?.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Файл байршуулалт амжилтгүй (URL олдсонгүй)",
        });
      }

      const meta = buildMetaFromBody(req.body);
      const data = await Document.create({
        name: String(req.body.name).trim(),
        parent_id: parseParentId(req.body.parent_id),
        file_url: result.secure_url,
        mime_type: req.file.mimetype || null,
        file_size: req.file.size || null,
        original_name: req.file.originalname || null,
        version: Number(req.body.version) || 1,
        owner_user_id: scopeInfo.owner_user_id,
        created_by: scopeInfo.userId || null,
        updated_by: scopeInfo.userId || null,
        ...meta,
      });
      let full = await Document.findByPk(data.id, { include: DOC_INCLUDE });
      if (!full) full = data;
      res.status(201).json({ success: true, data: full });
    } catch (error) {
      console.error("document create:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Баримт үүсгэхэд алдаа",
      });
    }
  });
};

exports.findAll = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;

    const {
      name,
      q,
      parent_id,
      doc_type,
      status,
      project_id,
      expiring,
      search_all,
    } = req.query;

    const condition = { ...scopeOwnerCondition(scopeInfo) };
    const search = q || name;

    if (search) {
      condition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { doc_number: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { issuer: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (search_all !== "1" && search_all !== "true") {
      if (parent_id !== undefined) {
        condition.parent_id = parseParentId(parent_id);
      }
    }

    if (doc_type) condition.doc_type = doc_type;
    if (status) condition.status = status;
    if (project_id) condition.project_id = parseOptionalInt(project_id);

    if (expiring === "1" || expiring === "true") {
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);
      condition.expiry_date = {
        [Op.ne]: null,
        [Op.lte]: soon.toISOString().slice(0, 10),
      };
      condition.status = { [Op.ne]: "archived" };
    }

    const data = await Document.findAll({
      where: condition,
      include: DOC_INCLUDE,
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving documents.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const data = await Document.findByPk(req.params.id, { include: DOC_INCLUDE });
    if (!data || !matchesScope(data, scopeInfo)) {
      return res.status(404).json({
        success: false,
        message: `Cannot find Document with id=${req.params.id}.`,
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error retrieving Document with id=" + req.params.id,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const doc = await Document.findByPk(req.params.id);
    if (!doc || !matchesScope(doc, scopeInfo)) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const patch = {};
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.parent_id !== undefined) patch.parent_id = parseParentId(req.body.parent_id);
    if (req.body.file_url !== undefined) patch.file_url = req.body.file_url;
    if (req.body.version !== undefined) patch.version = Number(req.body.version) || doc.version;

    const metaKeys = [
      "description",
      "doc_type",
      "doc_number",
      "status",
      "tags",
      "issue_date",
      "expiry_date",
      "issuer",
      "notes",
    ];
    for (const key of metaKeys) {
      if (req.body[key] !== undefined) patch[key] = req.body[key] || null;
    }
    if (req.body.project_id !== undefined) {
      patch.project_id = parseOptionalInt(req.body.project_id);
    }
    if (scopeInfo.userId) patch.updated_by = scopeInfo.userId;

    await doc.update(patch);
    const full = await Document.findByPk(doc.id, { include: DOC_INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || `Error updating Document with id=${req.params.id}`,
    });
  }
};

exports.replaceFile = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "File upload error." });
    }
    if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unexpected error." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    try {
      const scopeInfo = ownerWhere(req, res);
      if (!scopeInfo) return;
      const doc = await Document.findByPk(req.params.id);
      if (!doc || !matchesScope(doc, scopeInfo)) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }
      fixMulterFile(req.file);
      const result = await storeDocumentFile(req.file);
      await doc.update({
        file_url: result.secure_url,
        mime_type: req.file.mimetype || doc.mime_type,
        file_size: req.file.size || null,
        original_name: req.file.originalname || doc.original_name,
        version: (doc.version || 1) + 1,
        name: req.body.name || doc.name,
        updated_by: scopeInfo.userId || doc.updated_by,
      });
      const full = await Document.findByPk(doc.id, { include: DOC_INCLUDE });
      res.json({ success: true, data: full || doc });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

exports.delete = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    const num = await Document.destroy({
      where: { id: req.params.id, ...scopeOwnerCondition(scopeInfo) },
    });
    if (num === 1) {
      return res.json({ success: true, message: "Document was deleted successfully!" });
    }
    res.status(404).json({
      success: false,
      message: `Cannot delete Document with id=${req.params.id}. Not found.`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not delete Document with id=" + req.params.id,
    });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const scopeInfo = ownerWhere(req, res);
    if (!scopeInfo) return;
    // Never allow mass-delete of company DMS via this endpoint unless explicitly company scope
    if (scopeInfo.scope !== "personal") {
      return res.status(403).json({
        success: false,
        message: "Company DMS mass delete is disabled",
      });
    }
    const nums = await Document.destroy({
      where: { ...scopeOwnerCondition(scopeInfo) },
      truncate: false,
    });
    res.json({ success: true, message: `${nums} documents were deleted successfully!` });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while removing all documents.",
    });
  }
};
