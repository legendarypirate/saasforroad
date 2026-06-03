module.exports = (app) => {
  const projectPhase = require("../controllers/project_phase.controller.js");
  const router = require("express").Router();

  router.post("/", projectPhase.create);
  router.get("/", projectPhase.findAll);
  router.get("/:id", projectPhase.findOne);
  router.put("/:id", projectPhase.update);
  router.delete("/:id", projectPhase.delete);

  app.use("/api/project_phase", router);
};
