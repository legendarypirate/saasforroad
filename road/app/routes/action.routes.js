module.exports = (app) => {
  const action = require("../controllers/action.controller.js");
  const router = require("express").Router();

  router.post("/", action.create);
  router.get("/", action.findAll);

  app.use("/api/action", router);
};
