module.exports = (app) => {
  const attendance = require("../controllers/attendance.controller.js");
  const mobileAuth = require("../middleware/mobileAuth.js");
  const router = require("express").Router();

  const mobileGuard = [mobileAuth.verifyMobileToken, mobileAuth.requireApprovedDevice];

  router.post("/check-in", ...mobileGuard, attendance.checkIn);
  router.post("/check-out", ...mobileGuard, attendance.checkOut);
  router.get(
    "/today/:userId",
    mobileAuth.verifyMobileToken,
    mobileAuth.requireSelfUserParam,
    attendance.getTodayForUser
  );

  router.get("/summary", attendance.summary);
  router.get("/calendar", attendance.calendarReport);
  router.get("/payroll-summary", attendance.payrollSummary);
  router.patch("/schedule/:userId", attendance.updateSchedule);
  router.get("/", attendance.findAll);

  app.use("/api/attendance", router);
};
