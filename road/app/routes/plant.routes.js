module.exports = (app) => {
  const router = require("express").Router();
  const ctrl = require("../controllers/plant.controller");

  router.get("/dashboard", ctrl.dashboard);
  router.post("/seed-defaults", ctrl.seedDefaults);

  router.get("/sites", ctrl.listSites);
  router.post("/sites", ctrl.createSite);
  router.get("/sites/:id", ctrl.getSite);
  router.put("/sites/:id", ctrl.updateSite);
  router.delete("/sites/:id", ctrl.deleteSite);

  router.get("/products", ctrl.listProducts);
  router.post("/products", ctrl.createProduct);
  router.get("/products/:id", ctrl.getProduct);
  router.put("/products/:id", ctrl.updateProduct);
  router.delete("/products/:id", ctrl.deleteProduct);

  router.get("/materials", ctrl.listMaterials);
  router.post("/materials", ctrl.createMaterial);
  router.get("/materials/:id", ctrl.getMaterial);
  router.put("/materials/:id", ctrl.updateMaterial);
  router.delete("/materials/:id", ctrl.deleteMaterial);

  router.get("/stocks", ctrl.listStocks);

  router.get("/movements", ctrl.listMovements);
  router.post("/movements", ctrl.createMovement);
  router.delete("/movements/:id", ctrl.deleteMovement);

  router.get("/batches", ctrl.listBatches);
  router.post("/batches", ctrl.createBatch);
  router.get("/batches/:id", ctrl.getBatch);
  router.put("/batches/:id", ctrl.updateBatch);
  router.delete("/batches/:id", ctrl.deleteBatch);

  router.get("/sales", ctrl.listSales);
  router.post("/sales", ctrl.createSale);
  router.get("/sales/:id", ctrl.getSale);
  router.put("/sales/:id", ctrl.updateSale);
  router.delete("/sales/:id", ctrl.deleteSale);

  router.get("/expenses", ctrl.listExpenses);
  router.post("/expenses", ctrl.createExpense);
  router.get("/expenses/:id", ctrl.getExpense);
  router.put("/expenses/:id", ctrl.updateExpense);
  router.delete("/expenses/:id", ctrl.deleteExpense);

  router.get("/daily-reports", ctrl.listReports);
  router.post("/daily-reports", ctrl.createReport);
  router.get("/daily-reports/:id", ctrl.getReport);
  router.put("/daily-reports/:id", ctrl.updateReport);
  router.delete("/daily-reports/:id", ctrl.deleteReport);

  const rcos = require("../controllers/rcos_plant.controller");
  router.get("/rcos/map-factories", rcos.listMapFactories);
  router.post("/rcos/sync-statuses", rcos.syncRcosStatuses);
  router.post("/sites/:id/place-to-rcos", rcos.placeToRcos);

  app.use("/api/plant", router);
};
