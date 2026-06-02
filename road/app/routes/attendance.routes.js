module.exports = (app) => {
  const attendance = require("../controllers/attendance.controller.js");
  const router = require("express").Router();

  router.post("/check-in", attendance.checkIn);
  router.post("/check-out", attendance.checkOut);
  router.get("/summary", attendance.summary);
  router.get("/today/:userId", attendance.getTodayForUser);
  router.get("/", attendance.findAll);

  app.use("/api/attendance", router);
};
