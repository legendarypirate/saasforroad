module.exports = (app) => {
  const smartcar = require("../controllers/smartcar.controller.js");
  const router = require("express").Router();

  router.post("/vehicle-info", smartcar.getVehicleInfo);
  router.get("/vehicle-info", smartcar.getVehicleInfo);

  router.post("/inspection-info", smartcar.getVehicleInspectionInfo);
  router.get("/inspection-info", smartcar.getVehicleInspectionInfo);

  app.use("/api/smartcar", router);
};
