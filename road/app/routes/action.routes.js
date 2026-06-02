module.exports = (app) => {
  const action = require("../controllers/action.controller.js");
  const router = require("express").Router();

  router.post("/", action.create);
  router.get("/", action.findAll);
  router.post("/:id/upload-document", action.uploadDocument);
  router.delete("/:id", action.delete);

  app.use("/api/action", router);
};
