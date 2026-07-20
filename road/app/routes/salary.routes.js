module.exports = (app) => {
  const salary = require("../controllers/salary.controller.js");
  const { requireTenant } = require("../middleware/tenant");
  const router = require("express").Router();

  router.use(requireTenant);

  router.get("/calculation", salary.getCalculation);
  router.put("/month-setting", salary.updateMonthSetting);
  router.put("/adjustment", salary.upsertAdjustment);
  router.put("/adjustments/bulk", salary.bulkUpsertAdjustments);
  router.post("/send-bulk", salary.sendBulk);

  app.use("/api/salary", router);
};
