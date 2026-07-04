module.exports = (app) => {
  const angilal = require("../controllers/angilal.controller.js");
  const router = require("express").Router();

  router.post("/", angilal.create);
  router.get("/", angilal.findAll);
  router.get("/:id", angilal.findOne);
  router.patch("/:id", angilal.update);
  router.put("/:id", angilal.update);
  router.delete("/:id", angilal.delete);

  app.use("/api/angilal", router);
};
