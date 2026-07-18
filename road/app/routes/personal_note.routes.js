module.exports = (app) => {
  const notes = require("../controllers/personal_note.controller.js");
  const { verifyToken } = require("../controllers/auth.controller.js");
  const router = require("express").Router();

  router.use(verifyToken);

  router.get("/", notes.list);
  router.post("/", notes.create);
  router.get("/:id", notes.findOne);
  router.put("/:id", notes.update);
  router.patch("/:id", notes.update);
  router.delete("/:id", notes.delete);

  app.use("/api/personal-notes", router);
};
