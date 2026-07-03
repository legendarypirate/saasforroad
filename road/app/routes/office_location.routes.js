module.exports = (app) => {
  const office = require("../controllers/office_location.controller.js");
  const router = require("express").Router();

  router.get("/", office.findAll);
  router.post("/", office.create);
  router.get("/:id", office.findOne);
  router.put("/:id", office.update);
  router.delete("/:id", office.delete);

  app.use("/api/office_location", router);
};
