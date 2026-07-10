module.exports = (app) => {
  const project = require("../controllers/project.controller.js");
  const router = require("express").Router();

  router.post("/", project.create);
  router.get("/with-users", project.getProjectsWithUsers);
  router.get("/total", project.total);
  router.get("/published", project.findAllPublished);
  router.get("/", project.findAll);

  router.post("/:id/archive", project.archive);
  router.post("/:id/duplicate", project.duplicate);

  router.get("/:id", project.findOne);
  router.put("/:id", project.update);
  router.delete("/:id", project.delete);
  router.delete("/", project.deleteAll);

  app.use("/api/project", router);
};
