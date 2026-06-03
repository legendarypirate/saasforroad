module.exports = (app) => {
  const attendance = require("../controllers/attendance.controller.js");
  const router = require("express").Router();

  router.post("/check-in", attendance.checkIn);
  router.post("/check-out", attendance.checkOut);
  router.get("/summary", attendance.summary);
  router.get("/calendar", attendance.calendarReport);
  router.get("/payroll-summary", attendance.payrollSummary);
  router.patch("/schedule/:userId", attendance.updateSchedule);
  router.get("/today/:userId", attendance.getTodayForUser);
  router.get("/", attendance.findAll);

  app.use("/api/attendance", router);
};
