const db = require("../models");
const Supplier = db.suppliers;
const Op = db.Sequelize.Op;

// Create and Save a new Supplier
exports.create = (req, res) => {
  const { name, phone, email, address, register, productTypes } = req.body;

  // Validate required fields
  if (!name || !phone) {
    return res.status(400).send({
      success: false,
      message: "Name and phone number are required!",
    });
  }

  // Ensure productTypes is an array (or empty if not provided)
  const safeProductTypes = Array.isArray(productTypes) ? productTypes : [];
  console.log(safeProductTypes);
  // Create supplier object
  const supplier = {
    name,
    phone,
    email,
    address,
    register,
    productTypes: safeProductTypes,
  };

  // Save to DB
  Supplier.create(supplier)
    .then(data => {
      res.json({ success: true, data });
    })
    .catch(err => {
      console.error("Error creating supplier:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Some error occurred while creating the supplier.",
      });
    });
};


// Retrieve all Suppliers from the database.
exports.findAll = async (req, res) => {
  const name = req.query.name;
  const condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  try {
    const data = await Supplier.findAll({ where: condition });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving suppliers."
    });
  }
};

// Find a single Supplier with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Supplier.findByPk(id)
    .then(data => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot find supplier with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Error retrieving supplier with id=" + id
      });
    });
};

// Update a Supplier by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const { name, phone, email, address, register } = req.body;

  const updateData = { name, phone, email, address, register };

  Supplier.update(updateData, {
    where: { id }
  })
    .then(num => {
      if (num == 1) {
        return Supplier.findByPk(id); // Fetch updated supplier
      } else {
        throw new Error(`Cannot update supplier with id=${id}. Maybe not found or body is empty.`);
      }
    })
    .then(updated => {
      res.json({
        success: true,
        message: "Supplier was updated successfully.",
        data: updated
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: err.message || "Error updating supplier."
      });
    });
};

// Delete a Supplier with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Supplier.destroy({ where: { id } })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Supplier was deleted successfully!" });
      } else {
        res.status(404).send({
          success: false,
          message: `Cannot delete supplier with id=${id}. Maybe not found.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Could not delete supplier with id=" + id
      });
    });
};

// Delete all Suppliers from the database.
exports.deleteAll = (req, res) => {
  Supplier.destroy({ where: {}, truncate: false })
    .then(nums => {
      res.send({ success: true, message: `${nums} suppliers were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while removing all suppliers."
      });
    });
};
