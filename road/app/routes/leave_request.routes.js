module.exports = (app) => {
  const leaveRequest = require("../controllers/leave_request.controller.js");
  const mobileAuth = require("../middleware/mobileAuth.js");
  const router = require("express").Router();

  const mobileGuard = [mobileAuth.verifyMobileToken, mobileAuth.requireApprovedDevice];

  router.post("/", ...mobileGuard, leaveRequest.create);
  router.post("/preview-hours", ...mobileGuard, leaveRequest.previewHours);
  router.get("/user/:userId", ...mobileGuard, mobileAuth.requireSelfUserParam, leaveRequest.findByUser);
  router.get("/", leaveRequest.findAll);
  router.patch("/:id/review", leaveRequest.review);

  app.use("/api/leave-request", router);
};
