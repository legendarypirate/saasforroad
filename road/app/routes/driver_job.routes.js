module.exports = (app) => {
  const ctrl = require("../controllers/driver_job.controller.js");
  const { requireTenant } = require("../middleware/tenant");
  const { verifyToken } = require("../controllers/auth.controller.js");
  const router = require("express").Router();

  router.use(requireTenant, verifyToken);

  router.get("/openings", ctrl.tenantList);
  router.post("/openings", ctrl.tenantCreate);
  router.get("/openings/:id", ctrl.tenantGet);
  router.patch("/openings/:id", ctrl.tenantUpdate);
  router.post("/openings/:id/submit", ctrl.tenantSubmit);
  router.post("/openings/:id/close", ctrl.tenantClose);
  router.delete("/openings/:id", ctrl.tenantDelete);

  router.get("/applications", ctrl.tenantListApplications);
  router.patch("/applications/:id", ctrl.tenantRespondApplication);

  app.use("/api/driver-jobs", router);
};
