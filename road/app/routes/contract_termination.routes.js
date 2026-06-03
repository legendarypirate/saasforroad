module.exports = (app) => {
  const controller = require("../controllers/contract_termination.controller.js");
  const router = require("express").Router();

  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.delete("/:id", controller.delete);

  app.use("/api/contract_termination", router);
};
