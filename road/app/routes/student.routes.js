module.exports = (app) => {
  const student = require("../controllers/student.controller.js");
  const router = require("express").Router();

  router.get("/stats", student.stats);
  router.get("/", student.findAll);
  router.post("/", student.create);
  router.get("/:id", student.findOne);
  router.put("/:id", student.update);
  router.patch("/:id", student.update);
  router.delete("/:id", student.delete);

  app.use("/api/student", router);
};
