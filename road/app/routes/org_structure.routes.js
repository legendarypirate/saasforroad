module.exports = (app) => {
  const org = require("../controllers/org_structure.controller.js");
  const router = require("express").Router();

  router.get("/tree", org.getTree);
  router.post("/department", org.createDepartment);
  router.post("/assign", org.assignUser);
  router.put("/move", org.move);
  router.delete("/user-node/:id", org.unassignUser);
  router.patch("/:id", org.update);
  router.delete("/:id", org.remove);

  app.use("/api/org_structure", router);
};
