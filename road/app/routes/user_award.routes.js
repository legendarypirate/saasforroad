module.exports = (app) => {
  const controller = require("../controllers/user_award.controller.js");
  const router = require("express").Router();

  router.post("/", controller.create);
  router.get("/", controller.findAll);
  router.delete("/:id", controller.delete);

  app.use("/api/user_award", router);
};
