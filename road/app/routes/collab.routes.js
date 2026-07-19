module.exports = (app) => {
  const ctrl = require("../controllers/collab.controller.js");
  const { requireTenant } = require("../middleware/tenant");
  const { verifyToken } = require("../controllers/auth.controller.js");
  const router = require("express").Router();

  router.use(requireTenant, verifyToken);

  // Own ads
  router.get("/ads", ctrl.listMyAds);
  router.post("/ads", ctrl.createAd);
  router.get("/ads/:id", ctrl.getMyAd);
  router.patch("/ads/:id", ctrl.updateAd);
  router.delete("/ads/:id", ctrl.deleteAd);
  router.post("/ads/:id/publish", ctrl.publishAd);
  router.post("/ads/:id/close", ctrl.closeAd);
  router.post("/ads/:id/apply", ctrl.applyToAd);

  // Marketplace
  router.get("/marketplace", ctrl.listMarketplace);
  router.get("/marketplace/:id", ctrl.getMarketplaceAd);

  // Requests
  router.get("/requests/incoming", ctrl.listIncoming);
  router.get("/requests/outgoing", ctrl.listOutgoing);
  router.patch("/requests/:id/accept", ctrl.acceptRequest);
  router.patch("/requests/:id/reject", ctrl.rejectRequest);
  router.patch("/requests/:id/withdraw", ctrl.withdrawRequest);

  // Collaborators & profiles
  router.get("/projects/:projectId/collaborators", ctrl.listProjectCollaborators);
  router.patch("/collaborators/:id/remove", ctrl.removeCollaborator);
  router.get("/tenants/:id/profile", ctrl.getTenantProfile);

  app.use("/api/collab", router);
};
