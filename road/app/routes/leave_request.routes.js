module.exports = (app) => {
  const leaveRequest = require("../controllers/leave_request.controller.js");
  const router = require("express").Router();

  router.post("/", leaveRequest.create);
  router.get("/", leaveRequest.findAll);
  router.get("/user/:userId", leaveRequest.findByUser);
  router.patch("/:id/review", leaveRequest.review);

  app.use("/api/leave-request", router);
};
