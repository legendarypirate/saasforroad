const db = require("../models");
const Document = db.documents;
const Op = db.Sequelize.Op;
const { memoryUpload } = require("../utils/multerMemory");
const { uploadMulterFile } = require("../utils/cloudinary");
const multer = require("multer");

const upload = memoryUpload().single("file");

exports.create = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "File upload error." });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unexpected error." });
    }

    if (!req.body.name || !req.file) {
      return res.status(400).json({ success: false, message: "Name and file are required!" });
    }

    try {
      const result = await uploadMulterFile(req.file, "documents");
      const doc = {
        name: req.body.name,
        parent_id: req.body.parent_id || null,
        file_url: result.secure_url,
      };

      const data = await Document.create(doc);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

exports.findAll = (req, res) => {
  const name = req.query.name;
  const parent_id = req.query.parent_id;

  const condition = {};

  if (name) {
    condition.name = { [Op.like]: `%${name}%` };
  }

  if (parent_id !== undefined) {
    condition.parent_id = parent_id === "" ? null : parent_id;
  }

  Document.findAll({ where: condition })
    .then((data) => {
      res.send({ success: true, data });
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving documents.",
      });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;

  Document.findByPk(id)
    .then((data) => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot find Document with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: "Error retrieving Document with id=" + id,
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;
  const updateData = {
    name: req.body.name,
    file_url: req.body.file_url,
    parent_id: req.body.parent_id || null,
  };

  Document.update(updateData, {
    where: { id },
  })
    .then((num) => {
      if (num == 1) {
        return Document.findByPk(id);
      } else {
        throw new Error(`Cannot update Document with id=${id}.`);
      }
    })
    .then((updatedData) => {
      res.json({ success: true, data: updatedData });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: err.message || `Error updating Document with id=${id}`,
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;

  Document.destroy({ where: { id } })
    .then((num) => {
      if (num == 1) {
        res.json({ success: true, message: "Document was deleted successfully!" });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot delete Document with id=${id}. Not found.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: "Could not delete Document with id=" + id,
      });
    });
};

exports.deleteAll = (req, res) => {
  Document.destroy({ where: {}, truncate: false })
    .then((nums) => {
      res.send({ success: true, message: `${nums} documents were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while removing all documents.",
      });
    });
};
