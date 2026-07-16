module.exports = (app) => {
  const equipment = require("../controllers/equipment.controller.js");
  const router = require("express").Router();

  // Categories (before /:id)
  router.get("/categories", equipment.listCategories);
  router.post("/categories", equipment.createCategory);
  router.put("/categories/:id", equipment.updateCategory);
  router.patch("/categories/:id", equipment.updateCategory);
  router.delete("/categories/:id", equipment.deleteCategory);

  router.get("/", equipment.findAll);
  router.post("/", equipment.create);

  router.get("/:id/oil_change", equipment.listOilChanges);
  router.post("/:id/oil_change", equipment.createOilChange);
  router.delete("/:id/oil_change/:oilId", equipment.deleteOilChange);

  router.get("/:id/service_logs", equipment.listServiceLogs);
  router.post("/:id/service_logs", equipment.createServiceLog);
  router.delete("/:id/service_logs/:logId", equipment.deleteServiceLog);

  router.get("/:id/documents", equipment.listDocuments);
  router.post("/:id/documents", equipment.createDocument);
  router.put("/:id/documents/:docId", equipment.updateDocument);
  router.delete("/:id/documents/:docId", equipment.deleteDocument);

  router.get("/:id/finances", equipment.listFinances);
  router.post("/:id/finances", equipment.upsertFinance);
  router.delete("/:id/finances/:finId", equipment.deleteFinance);

  router.get("/:id/images", equipment.listImages);
  router.post("/:id/images", equipment.uploadGalleryImages);
  router.delete("/:id/images/:imageId", equipment.deleteImage);

  router.get("/:id", equipment.findOne);
  router.put("/:id", equipment.update);
  router.delete("/:id", equipment.delete);

  app.use("/api/equipment", router);
};
