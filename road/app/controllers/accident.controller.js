const db = require("../models");
const Accident = db.accidents;
const Op = db.Sequelize.Op;
const User = db.users;

// Create and Save a new Item
exports.create = (req, res) => {
  if (!req.body.description || !req.body.location || !req.body.status || !req.body.user_id) {
    res.status(400).send({
      message: "Required fields cannot be empty!"
    });
    return;
  }

  const newAccident = {
    description: req.body.description,
    location: req.body.location,
    user_id: req.body.user_id,
    staff_id: req.body.staff_id || null,
    status: req.body.status
  };

  Accident.create(newAccident)
    .then(data => {
      res.json({ success: true, data: data });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: err.message || "Some error occurred while creating the item."
      });
    });
};

// Retrieve all Items from the database
exports.findAll = async (req, res) => {
    const keyword = req.query.location;
    const condition = keyword ? { location: { [Op.like]: `%${keyword}%` } } : undefined;
  
    try {
      const data = await Accident.findAll({
        where: condition,
        include: [
          {
            model: User,
            attributes: ['username'] // include only username from users
          }
        ],
        order: [['createdAt', 'DESC']] // optional: newest first
      });
  
      res.send({ success: true, data: data });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving items."
      });
    }
  };

// Find a single Item with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Item.findByPk(id)
    .then(data => {
      if (data) {
        res.send({ success: true, data: data });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot find Item with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Error retrieving Item with id=" + id
      });
    });
};

// Update an Item by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  const updateData = {
    item: req.body.item,
    quantity: req.body.quantity,
    unit: req.body.unit,
    user_id: req.body.user_id,
    project_id: req.body.project_id,
    staff_id: req.body.staff_id,
    status: req.body.status
  };

  Item.update(updateData, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        return Item.findByPk(id);
      } else {
        throw new Error(`Cannot update Item with id=${id}. Maybe Item was not found or req.body is empty!`);
      }
    })
    .then(updatedEntry => {
      res.json({
        success: true,
        message: "Item was updated successfully.",
        data: updatedEntry
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: "Error updating Item with id=" + id,
        error: err.message
      });
    });
};

// Delete an Item with the specified id
exports.delete = (req, res) => {
  const id = req.params.id;

  Item.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Item was deleted successfully!" });
      } else {
        res.send({
          success: false,
          message: `Cannot delete Item with id=${id}. Maybe Item was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Could not delete Item with id=" + id
      });
    });
};

// Delete all Items
exports.deleteAll = (req, res) => {
  Item.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ success: true, message: `${nums} Items were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while removing all Items."
      });
    });
};

// Find all completed Items
exports.findAllCompleted = (req, res) => {
  Item.findAll({ where: { status: "completed" } })
    .then(data => {
      res.send({ success: true, data: data });
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving completed items."
      });
    });
};
