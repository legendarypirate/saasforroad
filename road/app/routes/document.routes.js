module.exports = (app) => {
  const document = require("../controllers/document.controller.js");
  const router = require("express").Router();

  // Folders
  router.get("/folders", document.listFolders);
  router.post("/folders", document.createFolder);
  router.patch("/folders/:id", document.updateFolder);
  router.delete("/folders/:id", document.deleteFolder);

  // Stats
  router.get("/stats", document.stats);

  // Files
  router.post("/", document.create);
  router.get("/", document.findAll);
  router.get("/:id", document.findOne);
  router.put("/:id", document.update);
  router.post("/:id/replace", document.replaceFile);
  router.delete("/:id", document.delete);
  router.delete("/", document.deleteAll);

  app.use("/api/document", router);
};
