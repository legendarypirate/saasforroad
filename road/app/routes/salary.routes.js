module.exports = (app) => {
  const salary = require("../controllers/salary.controller.js");
  const router = require("express").Router();

  router.get("/calculation", salary.getCalculation);
  router.put("/adjustment", salary.upsertAdjustment);
  router.put("/adjustments/bulk", salary.bulkUpsertAdjustments);
  router.post("/send-bulk", salary.sendBulk);

  app.use("/api/salary", router);
};
