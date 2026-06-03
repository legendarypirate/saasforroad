const db = require("../models");
const Invite = db.invites;
const Project = db.projects;
const User = db.users;
const Op = db.Sequelize.Op;

// Create and Save a new Invite (add member to project brigade)
exports.create = async (req, res) => {
  if (!req.body.userId || !req.body.projectId) {
    return res.status(400).json({
      success: false,
      message: "userId and projectId are required",
    });
  }

  const userId = req.body.userId;
  const projectId = req.body.projectId;
  const role = req.body.role || "member";
  const inviteStatus = req.body.inviteStatus || "accepted";

  try {
    const existing = await Invite.findOne({ where: { userId, projectId } });

    if (existing) {
      await existing.update({ role, inviteStatus });
      return res.json({
        success: true,
        message: "Project member updated successfully",
        data: existing,
      });
    }

    const data = await Invite.create({
      userId,
      projectId,
      role,
      inviteStatus,
    });

    res.json({
      success: true,
      message: "Project member added successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while creating the Invite.",
    });
  }
};


// Find all Invites
exports.findAll = async (req, res) => {
  const userId = req.query.userId;
  const projectId = req.query.projectId;

  let condition = {};

  if (userId) {
    condition.userId = { [Op.eq]: userId };
  }

  if (projectId) {
    condition.projectId = { [Op.eq]: projectId };
  }

  try {
    const data = await Invite.findAll({
      where: condition,
      include: [
        { model: User, attributes: ['username', 'email'] }, // Include user info
        { model: Project, attributes: ['name', 'location'] }, // Include project info
      ],
    });

    res.send({
      success: true,
      data: data
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving Invites."
    });
  }
};

// Find a single Invite with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Invite.findByPk(id, {
    include: [
      { model: User, attributes: ['username', 'email'] }, // Include user info
      { model: Project, attributes: ['name', 'location'] }, // Include project info
    ],
  })
    .then(data => {
      if (data) {
        res.send({
          success: true,
          data: data
        });
      } else {
        res.status(404).send({
          message: `Cannot find Invite with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        success: false,
        message: "Error retrieving Invite with id=" + id
      });
    });
};

// Update an Invite by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  // Prepare the data for updating
  const updateData = {
    inviteStatus: req.body.inviteStatus || 'pending',  // Default to 'pending'
    role: req.body.role || 'member',  // Default to 'member'
  };

  try {
    // Check if the invite exists before updating
    const existingInvite = await Invite.findByPk(id);
    if (!existingInvite) {
      return res.status(404).json({
        success: false,
        message: `Invite with id=${id} not found.`
      });
    }

    // Update the invite
    const [num] = await Invite.update(updateData, { where: { id: id } });

    if (num === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made. The data might already be the same."
      });
    }

    // Fetch the updated invite data
    const updatedInvite = await Invite.findByPk(id);

    // Return the response with the updated invite data
    res.json({
      success: true,
      message: "Invite was updated successfully.",
      data: updatedInvite,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error updating Invite with id=${id}`,
      error: err.message,
    });
  }
};

// Delete an Invite with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Invite.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.json({
          success: true,
          message: "Invite was deleted successfully!"
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Cannot delete Invite with id=${id}. Maybe Invite was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: "Could not delete Invite with id=" + id
      });
    });
};

// Delete all Invites from the database.
exports.deleteAll = (req, res) => {
  Invite.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Invites were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all Invites."
      });
    });
};
