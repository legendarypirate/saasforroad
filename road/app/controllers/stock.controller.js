const db = require("../models");
const Stock = db.stocks;
const Material = db.materials;
const Warehouse = db.warehouses;
const Op = db.Sequelize.Op;

// Create and Save a new Categories
exports.create = (req, res) => {
  // Validate request
  if (!req.body.item_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Categories
  const cat = {
    item_id: req.body.item_id,
    warehouse_id: req.body.warehouse_id,
    quantity: req.body.quantity,
  };

  // Save Categories in the database
  Stock.create(cat)
  .then(data => {
    res.json({ success: true, data: data });
  })
  .catch(err => {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while creating the Banner." });
  });
};

// Retrieve all Categories from the database.

exports.findAll = async (req, res) => {
    const name = req.query.name;
  
    try {
      const data = await Stock.findAll({
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name"],
            where: name ? { name: { [Op.like]: `%${name}%` } } : undefined,
          },
          {
            model: Warehouse,
            as: "warehouse",
            attributes: ["id", "name"],
          },
        ],
        order: [["id", "DESC"]],
      });
  
      res.send({
        success: true,
        data: data,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving stocks.",
      });
    }
  };

exports.mobile_cat = async (req, res) => {
  const name = req.query.name;
  var condition = name 
    ? { 
        name: { [Op.like]: `%${name}%` },
        is_shown: '1' 
      } 
    : { is_shown: '1' };

  try {
    console.log("ss");
    const data = await category.findAll({ where: condition });
    console.log(data);

    res.send({
      success: true,
      data: data
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving Categories."
    });
  }
};



// Find a single Categories with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Stock.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find category with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving category with id=" + id
      });
    });
};

// Update a Categories by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  const updateData = {
    name: req.body.name || null,
    is_shown: req.body.is_shown !== undefined ? String(req.body.is_shown) : null // Ensure is_shown is a string ("0" or "1")
  };

  Stock.update(updateData, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        return category.findByPk(id); // Fetch the updated entry
      } else {
        throw new Error(`Cannot update category with id=${id}. Maybe category was not found or req.body is empty!`);
      }
    })
    .then(updatedEntry => {
      res.json({
        success: true,
        message: "Category was updated successfully.",
        data: updatedEntry
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: "Error updating category with id=" + id,
        error: err.message
      });
    });
};



// Delete a category with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Stock.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.json({ success: true, message: "Category was deleted successfully!" });

      } else {
        res.send({
          message: `Cannot delete Categories with id=${id}. Maybe category was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete category with id=" + id
      });
    });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
    Stock.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} category were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all category."
      });
    });
};

// find all published Categories
exports.findAllPublished = (req, res) => {
  category.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving category."
      });
    });
};
