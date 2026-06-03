module.exports = (app) => {
  const controller = require("../controllers/schedule_exception.controller.js");
  const router = require("express").Router();

  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.delete("/:id", controller.delete);

  app.use("/api/schedule_exception", router);
};
