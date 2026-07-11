module.exports = (app) => {
  const notification = require("../controllers/notification.controller.js");
  const router = require("express").Router();

  router.get("/stats", notification.stats);
  router.post("/", notification.create);
  router.get("/", notification.findAll);
  router.get("/:id", notification.findOne);
  router.put("/:id", notification.update);
  router.patch("/:id", notification.update);
  router.post("/:id/publish", notification.publish);
  router.post("/:id/archive", notification.archive);
  router.delete("/:id", notification.delete);

  app.use("/api/notification", router);
};
