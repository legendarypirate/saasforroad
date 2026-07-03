module.exports = (app) => {
  const homepage = require("../controllers/homepage.controller.js");
  const router = require("express").Router();

  router.get("/public", homepage.getPublic);
  router.get("/", homepage.getAdmin);
  router.put("/", homepage.update);
  router.post("/upload", homepage.uploadImage);

  app.use("/api/homepage", router);
};
