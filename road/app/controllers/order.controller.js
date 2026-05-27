const db = require("../models");
const Order = db.orders;
const Project = db.projects;  // Add this line to import the Project model
const Milestone = db.milestones;  // Add this line to import the Project model

const Op = db.Sequelize.Op;
const statusMap = {
    1: 'ToDo',
    2: 'In Progress',
    3: 'Completed'
  };
  
// Create and Save a new Categories
exports.create = (req, res) => {
  // Validate request


  // Create a Categories
  const order = {
    name: req.body.name,
    detail: req.body.detail,
    due_date: req.body.due_date,
    milestone_id: req.body.milestone_id,
    project_id: req.body.project_id,
    status: req.body.status
  };

  // Save Categories in the database
  Order.create(order)
  .then(data => {
    res.json({ success: true, data: data });
  })
  .catch(err => {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while creating the Banner." });
  });
};

exports.findAll = async (req, res) => {
    const name = req.query.name;
    const condition = name ? { name: { [Op.like]: `%${name}%` } } : undefined;
  
    try {
      const data = await Order.findAll({
        where: condition,
        include: [
          {
            model: Project,
            attributes: ['id', 'name'], // Fetch only the id and name of the project
          },
          {
            model: Milestone,
            attributes: ['id', 'name'], // Fetch milestone's id and name from the Milestone table
          }
        ]
      });
  
      // Map statuses to human-readable values
      const tasks = data.map(task => {
        return {
          ...task.toJSON(),
          status: statusMap[task.status] || 'Unknown', // Map status to readable value
          milestone: task.milestone ? task.milestone.name : 'No milestone' // Fetch milestone name
        };
      });
  
      res.send({
        success: true,
        data: tasks
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message || "Some error occurred while retrieving tasks."
      });
    }
  };

// PATCH /api/task/:id
exports.updateStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  // Optional: Validate status is 1, 2, or 3
  if (![1, 2, 3].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const [updated] = await Task.update(
      { status },
      { where: { id } }
    );

    if (updated === 0) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updatedTask = await Task.findByPk(id);
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating task" });
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

  category.findByPk(id)
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

  category.update(updateData, {
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

  category.destroy({
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
  category.destroy({
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
