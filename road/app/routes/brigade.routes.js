module.exports = (app) => {
  const brigade = require("../controllers/brigade.controller.js");
  const brigadaAuth = require("../controllers/brigada.auth.controller.js");
  const router = require("express").Router();

  // Brigade-only auth (never touches company users)
  router.post("/auth/register", brigadaAuth.register);
  router.post("/auth/login", brigadaAuth.login);
  router.get("/auth/me", brigadaAuth.me);
  router.patch("/:id/password", brigadaAuth.changePassword);

  // Global hire + notifications (before :id)
  router.get("/hire-requests", brigade.listHireRequests);
  router.get("/hire-requests/:hireId", brigade.getHireRequest);
  router.post("/hire-requests", brigade.createHireRequest);
  router.patch("/hire-requests/:hireId/status", brigade.updateHireStatus);

  router.get("/reviews", brigade.listReviews);
  router.post("/reviews", brigade.createReview);

  router.get("/notifications", brigade.listNotifications);
  router.patch("/notifications/:notifId/read", brigade.markNotificationRead);
  router.post("/notifications/read-all", brigade.markAllNotificationsRead);

  router.get("/leader/:userId/dashboard", brigade.leaderDashboard);
  router.get("/:id/dashboard", brigade.brigadeDashboard);

  router.get("/stats", brigade.stats);
  router.get("/", brigade.findAll);
  router.post("/", brigade.create);
  router.get("/:id", brigade.findOne);
  router.put("/:id", brigade.update);
  router.patch("/:id", brigade.update);
  router.patch("/:id/status", brigade.setStatus);
  router.post("/:id/logo", brigade.uploadLogo);
  router.post("/:id/refresh-stats", brigade.refreshStats);
  router.delete("/:id", brigade.delete);

  // Members
  router.get("/:id/members", brigade.listMembers);
  router.post("/:id/members", brigade.addMember);
  router.patch("/:id/members/:memberId", brigade.updateMember);
  router.delete("/:id/members/:memberId", brigade.removeMember);

  // Equipment
  router.post("/:id/equipment", brigade.addEquipment);
  router.delete("/:id/equipment/:linkId", brigade.removeEquipment);

  // Hire scoped to brigade
  router.get("/:id/hire-requests", brigade.listHireRequests);
  router.post("/:id/hire-requests", brigade.createHireRequest);

  // Reviews / docs / progress
  router.get("/:id/reviews", brigade.listReviews);
  router.post("/:id/reviews", brigade.createReview);
  router.get("/:id/documents", brigade.listDocuments);
  router.post("/:id/documents", brigade.addDocument);
  router.delete("/:id/documents/:docId", brigade.removeDocument);
  router.get("/:id/progress", brigade.listProgress);
  router.post("/:id/progress", brigade.createProgress);

  app.use("/api/brigada", router);
  app.use("/api/brigade", router);
};
