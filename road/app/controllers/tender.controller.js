const db = require("../models");
const multer = require("multer");
const { extractDocument, DOC_TYPE_LABELS } = require("../utils/aiExtractor");
const { generateTenderDocx } = require("../utils/docxGenerator");
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile, uploadBuffer } = require("../utils/cloudinary");

const TenderPackage = db.tender_packages;
const TenderDocument = db.tender_documents;

const upload = memoryUpload({
  maxSize: 15 * 1024 * 1024,
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    cb(ok ? null : new Error("Зөвхөн JPG, PNG, PDF файл хүлээн авна"), ok);
  },
}).single("file");

const packageInclude = [{ model: TenderDocument, as: "documents" }];

exports.createPackage = async (req, res) => {
  try {
    const data = await TenderPackage.create({
      title: req.body.title,
      tender_number: req.body.tender_number,
      project_name: req.body.project_name,
      client_name: req.body.client_name,
      notes: req.body.notes,
      status: "draft",
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAllPackages = async (_req, res) => {
  try {
    const data = await TenderPackage.findAll({
      include: packageInclude,
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOnePackage = async (req, res) => {
  try {
    const data = await TenderPackage.findByPk(req.params.id, { include: packageInclude });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const row = await TenderPackage.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update(req.body);
    const data = await TenderPackage.findByPk(row.id, { include: packageInclude });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const row = await TenderPackage.findByPk(req.params.id, { include: packageInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "Файл шаардлагатай" });

    try {
      const pkg = await TenderPackage.findByPk(req.params.id);
      if (!pkg) return res.status(404).json({ success: false, message: "Тендер олдсонгүй" });

      const result = await uploadMulterFile(req.file, "tender-uploads");

      const doc = await TenderDocument.create({
        tender_package_id: pkg.id,
        doc_type: req.body.doc_type || "other",
        engineer_name: req.body.engineer_name || "",
        original_filename: req.file.originalname,
        file_path: result.secure_url,
        mime_type: req.file.mimetype,
        status: "uploaded",
      });

      await pkg.update({ status: "draft" });
      res.json({ success: true, data: doc });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
};

exports.processDocument = async (req, res) => {
  try {
    const doc = await TenderDocument.findByPk(req.params.docId);
    if (!doc) return res.status(404).json({ success: false, message: "Баримт олдсонгүй" });

    await doc.update({ status: "processing", extraction_error: null });

    const extracted = await extractDocument(doc.file_path, doc.mime_type, doc.doc_type);
    await doc.update({
      extracted_data: extracted,
      status: "processed",
      engineer_name: doc.engineer_name || extracted.full_name || doc.engineer_name,
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    if (req.params.docId) {
      await TenderDocument.update(
        { status: "error", extraction_error: err.message },
        { where: { id: req.params.docId } }
      );
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.processAllDocuments = async (req, res) => {
  try {
    const pkg = await TenderPackage.findByPk(req.params.id, { include: packageInclude });
    if (!pkg) return res.status(404).json({ success: false, message: "Тендер олдсонгүй" });

    await pkg.update({ status: "processing" });
    const results = [];

    for (const doc of pkg.documents || []) {
      try {
        await doc.update({ status: "processing", extraction_error: null });
        const extracted = await extractDocument(doc.file_path, doc.mime_type, doc.doc_type);
        await doc.update({
          extracted_data: extracted,
          status: "processed",
          engineer_name: doc.engineer_name || extracted.full_name || "",
        });
        results.push({ id: doc.id, success: true });
      } catch (e) {
        await doc.update({ status: "error", extraction_error: e.message });
        results.push({ id: doc.id, success: false, message: e.message });
      }
    }

    const refreshed = await TenderPackage.findByPk(pkg.id, { include: packageInclude });
    const allOk = (refreshed.documents || []).every((d) => d.status === "processed");
    await refreshed.update({ status: allOk ? "ready" : "draft" });

    res.json({ success: true, data: refreshed, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateDocx = async (req, res) => {
  try {
    const pkg = await TenderPackage.findByPk(req.params.id, { include: packageInclude });
    if (!pkg) return res.status(404).json({ success: false, message: "Тендер олдсонгүй" });

    const { filename, buffer } = await generateTenderDocx(pkg, pkg.documents || []);
    const result = await uploadBuffer(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      {
        folder: "rd_zam/tender-exports",
        original_filename: filename,
        resource_type: "raw",
      }
    );

    await pkg.update({
      status: "ready",
      summary: {
        ...(pkg.summary || {}),
        last_export: result.secure_url,
        last_export_at: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        filename,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await TenderDocument.findByPk(req.params.docId);
    if (!doc) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await doc.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDocTypes = (_req, res) => {
  res.json({ success: true, data: DOC_TYPE_LABELS });
};
