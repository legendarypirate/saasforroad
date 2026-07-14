module.exports = (app) => {
  const router = require("express").Router();
  const ctrl = require("../controllers/fuel.controller");

  router.get("/dashboard", ctrl.dashboard);
  router.get("/reports", ctrl.reports);

  router.get("/suppliers", ctrl.listSuppliers);
  router.post("/suppliers", ctrl.createSupplier);
  router.get("/suppliers/:id", ctrl.getSupplier);
  router.put("/suppliers/:id", ctrl.updateSupplier);
  router.delete("/suppliers/:id", ctrl.deleteSupplier);

  router.get("/tanks", ctrl.listTanks);
  router.post("/tanks", ctrl.createTank);
  router.get("/tanks/:id", ctrl.getTank);
  router.put("/tanks/:id", ctrl.updateTank);
  router.delete("/tanks/:id", ctrl.deleteTank);

  router.get("/purchases", ctrl.listPurchases);
  router.post("/purchases", ctrl.createPurchase);
  router.get("/purchases/:id", ctrl.getPurchase);
  router.put("/purchases/:id", ctrl.updatePurchase);
  router.delete("/purchases/:id", ctrl.deletePurchase);

  router.get("/issues", ctrl.listIssues);
  router.post("/issues", ctrl.createIssue);
  router.get("/issues/:id", ctrl.getIssue);
  router.put("/issues/:id", ctrl.updateIssue);
  router.delete("/issues/:id", ctrl.deleteIssue);

  router.get("/consumptions", ctrl.listConsumptions);
  router.post("/consumptions/recalc", ctrl.recalcConsumptions);

  app.use("/api/fuel", router);
};
