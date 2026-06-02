module.exports = (app) => {
  const feedback = require("../controllers/feedback.controller.js");
  const router = require("express").Router();

  router.post("/public", feedback.createPublic);
  router.get("/", feedback.findAll);

  app.use("/api/feedback", router);
};
