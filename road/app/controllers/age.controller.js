const db = require("../models");
const Age = db.ages;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
  if (!req.body.age) {
    return res.status(400).json({ success: false, message: "age is required!" });
  }

  Age.create({ age: req.body.age })
    .then((data) => res.json({ success: true, data }))
    .catch((err) =>
      res.status(500).json({ success: false, message: err.message || "Some error occurred while creating the entry." })
    );
};

// Retrieve all Banners from the database.
exports.findAll = async (req, res) => {
  const link = req.query.link;
  var condition = link ? { link: { [Op.like]: `%${link}%` } } : null;

  try {
    const data = await Age.findAll({ where: condition });
    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving banners." });
  }
};

// Find a single Banner with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Age.findByPk(id)
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

// Update a Banner by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  const updateData = {
    age: req.body.age || null,// Convert age to JSON if present
  };

  Age.update(updateData, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        return Age.findByPk(id); // Fetch the updated entry
      } else {
        throw new Error(`Cannot update Banner with id=${id}. Maybe Banner was not found or req.body is empty!`);
      }
    })
    .then(updatedEntry => {
      res.json({
        success: true,
        message: "age was updated successfully.",
        data: updatedEntry
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: "Error updating Banner with id=" + id,
        error: err.message
      });
    });
};


// Delete a Banner with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Age.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Age was deleted successfully!" });
      } else {
        res.status(404).json({ success: false, message: `Cannot delete Banner with id=${id}. Maybe Banner was not found!` });
      }
    })
    .catch(err => {
      res.status(500).json({ success: false, message: "Could not delete Banner with id=" + id });
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
    Age.findAll({ where: { published: true } })
    .then(data => {
      res.json({ success: true, data: data });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving banners." });
    });
};
