module.exports = (app) => {
  const rolePermission = require("../controllers/role_permission.controller.js");
  const router = require("express").Router();
  router.get("/:roleId", rolePermission.findByRole);
  router.post("/:roleId", rolePermission.updateForRole);
  app.use("/api/role_permission", router);
};
