module.exports = (app) => {
  const ctrl = require("../controllers/project_milestone.controller.js");
  const router = require("express").Router();

  router.post("/", ctrl.create);
  router.get("/", ctrl.findAll);
  router.get("/:id", ctrl.findOne);
  router.put("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  app.use("/api/project_milestone", router);
};
