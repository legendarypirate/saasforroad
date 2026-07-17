module.exports = (app) => {
  const ctrl = require("../controllers/jobseeker_tenant.controller.js");
  const { requireTenant } = require("../middleware/tenant");
  const { verifyToken } = require("../controllers/auth.controller.js");
  const router = require("express").Router();

  // Tenant-facing job-seeker marketplace (consumed by zam admin).
  // resolveTenant runs globally; requireTenant + verifyToken gate every route.
  router.use(requireTenant, verifyToken);

  router.get("/", ctrl.listSeekers);
  router.get("/offers", ctrl.listOffers);
  router.get("/applications", ctrl.listApplications);
  router.get("/:id", ctrl.getSeeker);

  router.post("/:id/offers", ctrl.createOffer);
  router.patch("/offers/:offerId", ctrl.updateOffer);
  router.patch("/applications/:appId", ctrl.respondToApplication);

  app.use("/api/job-seekers", router);
};
