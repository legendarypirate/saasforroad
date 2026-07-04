module.exports = (app) => {
  const stock = require("../controllers/stock.controller.js");
  const router = require("express").Router();

  router.post("/", stock.create);
  router.get("/", stock.findAll);
  router.get("/:id", stock.findOne);
  router.put("/:id", stock.update);
  router.patch("/:id", stock.update);
  router.delete("/:id", stock.delete);

  app.use("/api/stock", router);
};
