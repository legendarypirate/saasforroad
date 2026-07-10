module.exports = (app) => {
  const router = require("express").Router();
  const ctrl = require("../controllers/uniform.controller");

  router.get("/dashboard", ctrl.dashboard);
  router.get("/reports", ctrl.reports);

  router.get("/items", ctrl.listItems);
  router.post("/items", ctrl.createItem);
  router.get("/items/:id", ctrl.getItem);
  router.put("/items/:id", ctrl.updateItem);
  router.delete("/items/:id", ctrl.deleteItem);

  router.get("/movements", ctrl.listMovements);
  router.post("/movements", ctrl.createMovement);

  router.get("/issues", ctrl.listIssues);
  router.post("/issues", ctrl.createIssue);
  router.get("/issues/:id", ctrl.getIssue);
  router.delete("/issues/:id", ctrl.deleteIssue);

  router.get("/open-issue-lines", ctrl.listOpenIssueLines);

  router.get("/returns", ctrl.listReturns);
  router.post("/returns", ctrl.createReturn);
  router.delete("/returns/:id", ctrl.deleteReturn);

  router.get("/requests", ctrl.listRequests);
  router.post("/requests", ctrl.createRequest);
  router.get("/requests/:id", ctrl.getRequest);
  router.put("/requests/:id", ctrl.updateRequest);
  router.delete("/requests/:id", ctrl.deleteRequest);
  router.post("/requests/:id/approve", ctrl.approveRequest);

  app.use("/api/uniform", router);
};
