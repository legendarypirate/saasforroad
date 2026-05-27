const express = require('express');
const db = require("../models");
const Project = db.projects;
const Task = db.tasks;

const Op = db.Sequelize.Op;
const app = express();

// Set up multer for file uploads
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'app/assets'); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer upload
const upload = multer({ storage: storage }).single('image');
app.use('/assets', express.static('app/assets')); // Serve files from 'app/assets' folder under the '/assets' URL

// Create and Save a new Banner
exports.create = (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "Error uploading file." });
    } else if (err) {
      return res.status(500).json({ success: false, message: "Unknown error." });
    }

    console.log(req.body);  // Log the request body
    console.log(req.file);   // Log the uploaded file object

    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "Link and image are required!" });
    }

    const project = {
      name: req.body.name,
      location: req.body.location,
      purpose: req.body.purpose,
      engineer: req.body.engineer,
      budget: req.body.budget,
      equipment: req.body.equipment,
      staff: req.body.staff,

    };

    Project.create(project)
      .then(data => {
        res.json({ success: true, data: data });
      })
      .catch(err => {
        res.status(500).json({ success: false, message: err.message || "Some error occurred while creating the Banner." });
      });
  });
};
// Get all projects with their invited users
exports.getProjectsWithUsers = async (req, res) => {
    try {
      const projects = await db.projects.findAll({
        include: [
          {
            model: db.users,
            attributes: ['id', 'username', 'email'],
            through: {
              attributes: ['inviteStatus', 'role'], // from invite table
            }
          }
        ]
      });
  
      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || "Error retrieving projects with users."
      });
    }
  };

 
  
// Retrieve all Banners from the database.
exports.findAll = async (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  try {
    const data = await Project.findAll({ where: condition });
    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving banners." });
  }
};

// Find a single Banner with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Doctor.findByPk(id)
    .then(data => {
      if (data) {
        res.json({ success: true, data: data });
      } else {
        res.status(404).json({ success: false, message: `Cannot find Banner with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).json({ success: false, message: "Error retrieving Banner with id=" + id });
    });
};

exports.total = async (req, res) => {
  const lastname = req.query.lastname;
  const condition = lastname ? { lastname: { [Op.like]: `%${lastname}%` } } : null;

  try {
    // Get all projects
    const projects = await Project.findAll({ where: condition });

    const total = projects.length;
    const ongoing = projects.filter(p => p.status === 1).length;
    const done = projects.filter(p => p.status === 2).length;

    // Count total number of tasks (across all projects)
    const tasks = await Task.count();

    res.send({
      success: true,
      total,
      ongoing,
      done,
      tasks
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving summary."
    });
  }
};

// Update a Banner by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // Use multer to process form-data and files
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ success: false, message: "Error uploading file." });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message || "Unknown error." });
    }

    // Log form data and file
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    // Validate at least one field to update
    if (!req.body.name && !req.body.location && !req.body.purpose && !req.body.engineer) {
      return res.status(400).json({
        success: false,
        message: "Request body is empty or invalid. Provide at least one field to update.",
      });
    }

    // Build update data object
    const updateData = {
      name: req.body.name,
      location: req.body.location,
      purpose: req.body.purpose,
      engineer: req.body.engineer,
      budget: req.body.budget,
      equipment: req.body.equipment,
      staff: req.body.staff,
      // Optional: handle image or file fields if used
      // image: req.file ? req.file.filename : req.body.image || null
    };

    // Remove undefined or null fields to prevent overwriting
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update project
    Project.update(updateData, { where: { id: id } })
      .then(num => {
        if (num == 1) {
          return Project.findByPk(id);
        } else {
          throw new Error("Project not found or no changes were made.");
        }
      })
      .then(updatedProject => {
        res.json({
          success: true,
          message: "Project updated successfully.",
          data: updatedProject
        });
      })
      .catch(err => {
        res.status(500).json({
          success: false,
          message: "Error updating project with id=" + id,
          error: err.message
        });
      });
  });
};


// Delete a Banner with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Doctor.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Doctor was deleted successfully!" });
      } else {
        res.status(404).json({ success: false, message: `Cannot delete Doctor with id=${id}. Maybe Doctor was not found!` });
      }
    })
    .catch(err => {
      res.status(500).json({ success: false, message: "Could not delete Doctor with id=" + id });
    });
};

// Delete all Banners from the database.
exports.deleteAll = (req, res) => {
  Banner.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.json({ success: true, message: `${nums} Banners were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: err.message || "Some error occurred while removing all banners." });
    });
};

// find all published Banner
exports.findAllPublished = (req, res) => {
  Banner.findAll({ where: { published: true } })
    .then(data => {
      res.json({ success: true, data: data });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving banners." });
    });
};
