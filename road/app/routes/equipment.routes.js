module.exports = (app) => {
  const equipment = require("../controllers/equipment.controller.js");
  const router = require("express").Router();

  router.get("/", equipment.findAll);
  router.post("/", equipment.create);
  router.get("/:id/oil_change", equipment.listOilChanges);
  router.post("/:id/oil_change", equipment.createOilChange);
  router.delete("/:id/oil_change/:oilId", equipment.deleteOilChange);
  router.get("/:id", equipment.findOne);
  router.put("/:id", equipment.update);
  router.delete("/:id", equipment.delete);

  app.use("/api/equipment", router);
};
