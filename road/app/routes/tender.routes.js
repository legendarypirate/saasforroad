module.exports = (app) => {
  const tender = require("../controllers/tender.controller.js");
  const router = require("express").Router();

  router.get("/doc-types", tender.getDocTypes);
  router.get("/", tender.findAllPackages);
  router.post("/", tender.createPackage);
  router.get("/:id/export-docx", tender.generateDocx);
  router.post("/:id/process-all", tender.processAllDocuments);
  router.post("/:id/documents", tender.uploadDocument);
  router.post("/:id/documents/:docId/process", tender.processDocument);
  router.delete("/:id/documents/:docId", tender.deleteDocument);
  router.get("/:id", tender.findOnePackage);
  router.put("/:id", tender.updatePackage);
  router.delete("/:id", tender.deletePackage);

  app.use("/api/tender", router);
};
