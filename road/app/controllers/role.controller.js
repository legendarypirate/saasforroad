const db = require("../models");
const Role = db.roles;
const Op = db.Sequelize.Op;

// Create and Save a new Role
exports.create = async (req, res) => {
  // Validate request
  const name = String(req.body.name || "").trim();
  if (!name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  const tenantId = req.tenant?.id || req.body.tenant_id || null;

  try {
    // Prevent duplicate role names within the same tenant (case-insensitive).
    const existing = await Role.findOne({
      where: {
        name: { [Op.iLike]: name },
        ...(tenantId ? { tenant_id: tenantId } : {}),
      },
    });
    if (existing) {
      return res.status(409).send({
        success: false,
        message: `"${existing.name}" нэртэй эрх аль хэдийн бүртгэлтэй байна.`,
        data: existing,
      });
    }

    const data = await Role.create({
      name,
      description: req.body.description || null,
      mobile_access: req.body.mobile_access === true,
      tenant_id: tenantId,
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Role.",
    });
  }
};

// Retrieve all Role from the database.
exports.findAll = async (req, res) => {
  const name = req.query.name;
  var condition = {};
  if (name) condition.name = { [Op.like]: `%${name}%` };
  if (req.tenant?.id) condition.tenant_id = req.tenant.id;

  try {
    const data = await Role.findAll({ where: condition });

    res.send({
      success: true,
      data: data
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving Role."
    });
  }
};



// Find a single Role with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Role.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Role with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Role with id=" + id
      });
    });
};

// Update a Role by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Role.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Role was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Role with id=${id}. Maybe Role was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Role with id=" + id
      });
    });
};

// Delete a Role with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).send({ success: false, message: `Role with id=${id} not found.` });
    }

    // Tenant isolation: never let one tenant delete another tenant's role.
    if (req.tenant?.id && role.tenant_id && role.tenant_id !== req.tenant.id) {
      return res.status(403).send({ success: false, message: "Role belongs to another tenant" });
    }

    // Block deletion if any users still reference this role.
    const inUse = await db.users.count({ where: { role_id: id } });
    if (inUse > 0) {
      return res.status(409).send({
        success: false,
        message: `Энэ эрхийг ${inUse} хэрэглэгч ашиглаж байгаа тул устгах боломжгүй. Эхлээд хэрэглэгчдийн эрхийг өөрчилнө үү.`,
      });
    }

    // Clean up role_permissions join rows, then delete the role.
    if (typeof role.setPermissions === "function") {
      await role.setPermissions([]);
    }
    await role.destroy();

    res.send({ success: true, message: "Role was deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Could not delete Role with id=" + id,
    });
  }
};

// Delete all Role from the database.
exports.deleteAll = (req, res) => {
  Role.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Role were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Role."
      });
    });
};

// find all published Role
exports.findAllPublished = (req, res) => {
  Role.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Role."
      });
    });
};
