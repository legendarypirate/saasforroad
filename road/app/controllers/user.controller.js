const db = require("../models");
const User = db.users;
const Role = db.roles;
const Op = db.Sequelize.Op;
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const userInclude = [
  { model: Role, as: "roleRecord", attributes: ["id", "name", "mobile_access"] },
];

async function resolveRoleFields(body) {
  const roleId = body.role_id || body.roleId || null;
  if (!roleId) {
    return { role_id: null, role: body.role || "user" };
  }
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error("Role not found");
  }
  return { role_id: role.id, role: role.name };
}

exports.create = async (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({ message: "Username and password are required!" });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const roleFields = await resolveRoleFields(req.body);

    const user = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      ...roleFields,
    };

    const data = await User.create(user);
    const full = await User.findByPk(data.id, { include: userInclude });
    res.send({ success: true, data: full });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

exports.findAll = async (req, res) => {
  const username = req.query.username;
  const role_id = req.query.role_id;
  let condition = {};

  if (username) {
    condition.username = { [Op.like]: `%${username}%` };
  }
  if (role_id) {
    condition.role_id = role_id;
  }

  try {
    const data = await User.findAll({
      where: condition,
      include: userInclude,
      order: [["id", "DESC"]],
    });

    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
};

exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id, { include: userInclude })
    .then(data => {
      if (data) {
        res.send({ success: true, data });
      } else {
        res.status(404).send({ message: `Cannot find User with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving User with id=" + id });
    });
};

exports.update = async (req, res) => {
  const id = req.params.id;

  const updateData = {
    end_date: req.body.end_date ? req.body.end_date : null,
    is_active: req.body.is_active !== undefined ? req.body.is_active : null,
  };

  try {
    if (req.body.role_id) {
      const roleFields = await resolveRoleFields(req.body);
      Object.assign(updateData, roleFields);
    }

    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with id=${id} not found.`,
      });
    }

    const [num] = await User.update(updateData, { where: { id } });

    if (num === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made.",
      });
    }

    const updatedUser = await User.findByPk(id, { include: userInclude });

    res.json({
      success: true,
      message: "User was updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error updating User with id=${id}`,
      error: err.message,
    });
  }
};

exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({ where: { id } })
    .then(num => {
      if (num == 1) {
        res.send({ message: "User was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete User with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete User with id=" + id });
    });
};

exports.deleteAll = (req, res) => {
  User.destroy({ where: {}, truncate: false })
    .then(nums => {
      res.send({ message: `${nums} User were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while removing all User." });
    });
};

exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then(data => res.send(data))
    .catch(err => {
      res.status(500).send({ message: err.message || "Some error occurred while retrieving User." });
    });
};
