module.exports = (app) => {
  const transaction = require("../controllers/transaction.controller.js");
  const router = require("express").Router();

  router.post("/", transaction.create);
  router.get("/", transaction.findAll);
  router.get("/:id", transaction.findOne);
  router.patch("/:id", transaction.update);
  router.delete("/:id", transaction.delete);

  app.use("/api/transaction", router);
};
