module.exports = (app) => {
  const docs = require("../controllers/inventory_document.controller.js");
  const router = require("express").Router();

  router.get("/dashboard", docs.dashboard);
  router.get("/movements", docs.movements);
  router.get("/documents", docs.findAll);
  router.post("/documents", docs.create);
  router.get("/documents/:id", docs.findOne);
  router.post("/documents/:id/post", docs.post);
  router.post("/documents/:id/cancel", docs.cancel);

  app.use("/api/inventory", router);
};
