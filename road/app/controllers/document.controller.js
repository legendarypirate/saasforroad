// controllers/document.controller.js

const db = require("../models");
const Document = db.documents;
const Op = db.Sequelize.Op;

const multer = require('multer');
const path = require('path');

// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'app/assets/documents'); // Folder for storing documents
  },
  filename: function (req, file, cb) {
    cb(null, 'doc-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage }).single('file');

// Create and save new Document
exports.create = (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "File upload error." });
    } else if (err) {
      return res.status(500).json({ success: false, message: "Unexpected error." });
    }

    if (!req.body.name || !req.file) {
      return res.status(400).json({ success: false, message: "Name and file are required!" });
    }

    const doc = {
      name: req.body.name,
      parent_id: req.body.parent_id || null,
      file_url: req.file.filename
    };

    Document.create(doc)
      .then(data => res.json({ success: true, data }))
      .catch(error => res.status(500).json({ success: false, message: error.message }));
  });
};

// Retrieve all Documents
exports.findAll = (req, res) => {
    const name = req.query.name;
    const parent_id = req.query.parent_id;
  
    // Build the where condition object
    const condition = {};
  
    if (name) {
      condition.name = { [Op.like]: `%${name}%` };
    }
  
    // For parent_id, if empty string or null, treat as null
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

// Find a single Document by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  Document.findByPk(id)
    .then(data => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot find Document with id=${id}.`,
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Error retrieving Document with id=" + id,
      });
    });
};

// Update a Document
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
    .then(num => {
      if (num == 1) {
        return Document.findByPk(id);
      } else {
        throw new Error(`Cannot update Document with id=${id}.`);
      }
    })
    .then(updatedData => {
      res.json({ success: true, data: updatedData });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: err.message || `Error updating Document with id=${id}`,
      });
    });
};

// Delete a Document
exports.delete = (req, res) => {
  const id = req.params.id;

  Document.destroy({ where: { id } })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Document was deleted successfully!" });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot delete Document with id=${id}. Not found.`,
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Could not delete Document with id=" + id,
      });
    });
};

// Delete all Documents
exports.deleteAll = (req, res) => {
  Document.destroy({ where: {}, truncate: false })
    .then(nums => {
      res.send({ success: true, message: `${nums} documents were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while removing all documents.",
      });
    });
};
