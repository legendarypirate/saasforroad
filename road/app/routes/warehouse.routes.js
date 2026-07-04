module.exports = (app) => {
  const warehouse = require("../controllers/warehouse.controller.js");
  const router = require("express").Router();

  router.post("/", warehouse.create);
  router.get("/", warehouse.findAll);
  router.get("/:id", warehouse.findOne);
  router.put("/:id", warehouse.update);
  router.patch("/:id", warehouse.update);
  router.delete("/:id", warehouse.delete);

  app.use("/api/warehouse", router);
};
