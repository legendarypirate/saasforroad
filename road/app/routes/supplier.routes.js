module.exports = (app) => {
  const supplier = require("../controllers/supplier.controller.js");
  const router = require("express").Router();

  router.post("/", supplier.create);
  router.get("/", supplier.findAll);
  router.get("/:id", supplier.findOne);
  router.patch("/:id", supplier.update);
  router.put("/:id", supplier.update);
  router.delete("/:id", supplier.delete);

  app.use("/api/supplier", router);
};
