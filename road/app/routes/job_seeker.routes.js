module.exports = (app) => {
  const ctrl = require("../controllers/job_seeker.controller.js");
  const router = require("express").Router();

  router.get("/hire-requests", ctrl.listHireRequests);
  router.get("/", ctrl.list);
  router.get("/:id", ctrl.findOne);
  router.post("/:id/hire-request", ctrl.createHireRequest);

  app.use("/api/job-seeker", router);
};
