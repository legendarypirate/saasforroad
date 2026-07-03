module.exports = (app) => {
  const rental = require("../controllers/equipment_rental.controller.js");
  const router = require("express").Router();

  router.get("/stats", rental.stats);
  router.get("/", rental.findAll);
  router.post("/", rental.create);
  router.get("/:id", rental.findOne);
  router.put("/:id", rental.update);
  router.delete("/:id", rental.delete);
  router.patch("/:id/complete", rental.completeRental);
  router.patch("/:id/payments/:paymentId", rental.recordPayment);

  app.use("/api/equipment_rental", router);
};
