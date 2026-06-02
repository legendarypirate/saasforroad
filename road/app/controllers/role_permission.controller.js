const db = require("../models");

exports.findByRole = async (req, res) => {
  const roleId = req.params.roleId;
  try {
    const role = await db.roles.findByPk(roleId, {
      include: [{ model: db.permissions, as: "permissions", through: { attributes: [] } }],
    });
    if (!role) {
      return res.status(404).send({ success: false, message: "Role not found" });
    }
    res.send({ success: true, data: role.permissions || [] });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.updateForRole = async (req, res) => {
  const roleId = req.params.roleId;
  const { permissions } = req.body;

  try {
    const role = await db.roles.findByPk(roleId);
    if (!role) {
      return res.status(404).send({ success: false, message: "Role not found" });
    }

    const permissionIds = Array.isArray(permissions) ? permissions : [];
    await role.setPermissions(permissionIds);

    res.send({ success: true, message: "Permissions updated" });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
