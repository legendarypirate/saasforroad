module.exports = (app) => {
  const projectEquipment = require("../controllers/project_equipment.controller.js");
  const router = require("express").Router();

  router.get("/", projectEquipment.findByProject);
  router.post("/assign", projectEquipment.assign);
  router.delete("/unassign", projectEquipment.unassign);

  app.use("/api/project_equipment", router);
};
