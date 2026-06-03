module.exports = (app) => {
  const controller = require("../controllers/career_change.controller.js");
  const router = require("express").Router();

  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.delete("/:id", controller.delete);

  app.use("/api/career_change", router);
};
