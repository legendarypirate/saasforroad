const db = require("../models");
const Transaction = db.transactions;
const Material = db.materials;
const Project = db.projects;
const Warehouse = db.warehouses;
const Op = db.Sequelize.Op;

// Create and Save a new Transaction
exports.create = (req, res) => {
  if (!req.body.item_id || !req.body.warehouse_id || !req.body.type || !req.body.quantity || !req.body.date) {
    res.status(400).send({ message: "Required fields cannot be empty!" });
    return;
  }

  const trans = {
    item_id: req.body.item_id,
    warehouse_id: req.body.warehouse_id,
    type: req.body.type,
    quantity: req.body.quantity,
    unit_price: req.body.unit_price,
    total_price: req.body.total_price,
    description: req.body.description,
    project_id: req.body.project_id,
    date: req.body.date
  };

  Transaction.create(trans)
    .then(data => {
      res.json({ success: true, data });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: err.message || "Some error occurred while creating the transaction."
      });
    });
};

// Retrieve all Transactions from the database.
exports.findAll = async (req, res) => {
    const type = req.query.type;
    const condition = type ? { type: { [Op.eq]: type } } : null;
  
    try {
      const data = await Transaction.findAll({
        where: condition,
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name"]  // adjust attributes as needed
          },
          {
            model: Project,
            as: "project",
            attributes: ["id", "name"]
          },
          {
            model: Warehouse,
            as: "warehouse",
            attributes: ["id", "name"]
          }
        ]
      });
  
      res.send({ success: true, data });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving transactions."
      });
    }
  };

// Find a single Transaction by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  Transaction.findByPk(id)
    .then(data => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({ message: `Cannot find transaction with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving transaction with id=" + id });
    });
};

// Update a Transaction
exports.update = (req, res) => {
  const id = req.params.id;

  const updateData = {
    item_id: req.body.item_id,
    warehouse_id: req.body.warehouse_id,
    type: req.body.type,
    quantity: req.body.quantity,
    unit_price: req.body.unit_price,
    total_price: req.body.total_price,
    description: req.body.description,
    project_id: req.body.project_id,
    date: req.body.date
  };

  Transaction.update(updateData, { where: { id } })
    .then(num => {
      if (num == 1) {
        return Transaction.findByPk(id);
      } else {
        throw new Error(`Cannot update transaction with id=${id}.`);
      }
    })
    .then(updated => {
      res.json({
        success: true,
        message: "Transaction was updated successfully.",
        data: updated
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: "Error updating transaction with id=" + id,
        error: err.message
      });
    });
};

// Delete a Transaction
exports.delete = (req, res) => {
  const id = req.params.id;

  Transaction.destroy({ where: { id } })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Transaction was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete transaction with id=${id}. Maybe it was not found!` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete transaction with id=" + id });
    });
};

// Delete all Transactions
exports.deleteAll = (req, res) => {
  Transaction.destroy({ where: {}, truncate: false })
    .then(nums => {
      res.send({ message: `${nums} transactions were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while removing all transactions." });
    });
};
