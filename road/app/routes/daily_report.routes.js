module.exports = (app) => {
  const ctrl = require("../controllers/daily_report.controller.js");
  const router = require("express").Router();

  router.get("/summary", ctrl.summary);
  router.post("/", ctrl.create);
  router.get("/", ctrl.findAll);
  router.get("/:id", ctrl.findOne);
  router.put("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  app.use("/api/daily-report", router);
};
