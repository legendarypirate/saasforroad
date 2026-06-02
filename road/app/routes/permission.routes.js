module.exports = (app) => {
  const permission = require("../controllers/permission.controller.js");
  const router = require("express").Router();
  router.get("/", permission.findAll);
  app.use("/api/permission", router);
};
