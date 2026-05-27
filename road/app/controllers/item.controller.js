const db = require("../models");
const Item = db.items;
const Op = db.Sequelize.Op;
const User = db.users;

// Create and Save a new Item
exports.create = (req, res) => {
  if (!req.body.item || !req.body.quantity || !req.body.unit || !req.body.user_id || !req.body.project_id) {
    res.status(400).send({
      message: "Required fields cannot be empty!"
    });
    return;
  }

  const newItem = {
    item: req.body.item,
    quantity: req.body.quantity,
    unit: req.body.unit,
    user_id: req.body.user_id,
    project_id: req.body.project_id,
    staff_id: req.body.staff_id || null,
    status: req.body.status || "pending"
  };

  Item.create(newItem)
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

exports.accept = async (req, res) => {
  const id = req.params.id;
  const comment = req.body.comment;

  try {
    const [updated] = await Item.update(
      { status: "approved", description: comment },
      { where: { id: id } }
    );

    if (updated === 1) {
      res.send({ success: true, message: "Item accepted successfully." });
    } else {
      res.status(404).send({ success: false, message: "Item not found." });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

// Decline an Item
exports.decline = async (req, res) => {
  const id = req.params.id;
  const comment = req.body.comment;

  try {
    const [updated] = await Item.update(
      { status: "declined", description: comment },
      { where: { id: id } }
    );

    if (updated === 1) {
      res.send({ success: true, message: "Item declined successfully." });
    } else {
      res.status(404).send({ success: false, message: "Item not found." });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
// Retrieve all Items from the database
exports.findAll = async (req, res) => {
  const keyword = req.query.item;
  const condition = keyword ? { item: { [Op.like]: `%${keyword}%` } } : undefined;

  try {
    const data = await Item.findAll({
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
