module.exports = (app) => {
  const ctrl = require("../controllers/road_engineering.controller.js");
  const router = require("express").Router();

  router.get("/dashboard", ctrl.dashboard);
  router.get("/reports/:type", ctrl.reports);

  router.get("/projects", ctrl.listProjects);
  router.post("/projects", ctrl.createProject);
  router.get("/projects/:id", ctrl.getProject);
  router.put("/projects/:id", ctrl.updateProject);
  router.delete("/projects/:id", ctrl.deleteProject);
  router.post("/projects/:id/duplicate", ctrl.duplicateProject);
  router.patch("/projects/:id/archive", ctrl.archiveProject);

  router.get("/alignments", ctrl.listAlignments);
  router.post("/alignments", ctrl.createAlignment);
  router.get("/alignments/:id", ctrl.getAlignment);
  router.put("/alignments/:id", ctrl.updateAlignment);
  router.delete("/alignments/:id", ctrl.deleteAlignment);

  router.get("/survey-points", ctrl.listSurveyPoints);
  router.post("/survey-points", ctrl.createSurveyPoint);
  router.post("/survey-points/import", ctrl.importSurveyPoints);
  router.get("/survey-points/:id", ctrl.getSurveyPoint);
  router.put("/survey-points/:id", ctrl.updateSurveyPoint);
  router.delete("/survey-points/:id", ctrl.deleteSurveyPoint);

  router.get("/ground-profiles", ctrl.listGroundProfiles);
  router.post("/ground-profiles", ctrl.createGroundProfile);
  router.put("/ground-profiles/:id", ctrl.updateGroundProfile);
  router.delete("/ground-profiles/:id", ctrl.deleteGroundProfile);

  router.get("/vertical-alignments", ctrl.listVerticalAlignments);
  router.post("/vertical-alignments", ctrl.createVerticalAlignment);
  router.get("/vertical-alignments/:id", ctrl.getVerticalAlignment);
  router.put("/vertical-alignments/:id", ctrl.updateVerticalAlignment);
  router.delete("/vertical-alignments/:id", ctrl.deleteVerticalAlignment);
  router.post("/vertical-alignments/:id/recalculate", ctrl.recalculateVertical);
  router.get("/vertical-alignments/:id/profile-chart", ctrl.getProfileChart);

  router.get("/vertical-pis", ctrl.listVerticalPis);
  router.post("/vertical-pis", ctrl.createVerticalPi);
  router.put("/vertical-pis/:id", ctrl.updateVerticalPi);
  router.delete("/vertical-pis/:id", ctrl.deleteVerticalPi);

  router.get("/design-profile-points", ctrl.listDesignPoints);
  router.post("/design-profile-points", ctrl.createDesignPoint);
  router.put("/design-profile-points/:id", ctrl.updateDesignPoint);
  router.delete("/design-profile-points/:id", ctrl.deleteDesignPoint);

  router.get("/cross-sections", ctrl.listCrossSections);
  router.post("/cross-sections", ctrl.createCrossSection);
  router.post("/cross-sections/generate", ctrl.generateCrossSections);
  router.put("/cross-sections/:id", ctrl.updateCrossSection);
  router.delete("/cross-sections/:id", ctrl.deleteCrossSection);

  router.get("/earthworks", ctrl.listEarthworks);
  router.post("/earthworks", ctrl.createEarthwork);
  router.post("/earthworks/calculate", ctrl.calculateEarthwork);
  router.get("/earthworks/summary", ctrl.earthworkSummary);
  router.put("/earthworks/:id", ctrl.updateEarthwork);
  router.delete("/earthworks/:id", ctrl.deleteEarthwork);

  router.get("/typical-sections", ctrl.listTypicalSections);
  router.post("/typical-sections", ctrl.createTypicalSection);
  router.put("/typical-sections/:id", ctrl.updateTypicalSection);
  router.delete("/typical-sections/:id", ctrl.deleteTypicalSection);

  router.get("/drainages", ctrl.listDrainages);
  router.post("/drainages", ctrl.createDrainage);
  router.put("/drainages/:id", ctrl.updateDrainage);
  router.delete("/drainages/:id", ctrl.deleteDrainage);

  router.get("/structures", ctrl.listStructures);
  router.post("/structures", ctrl.createStructure);
  router.put("/structures/:id", ctrl.updateStructure);
  router.delete("/structures/:id", ctrl.deleteStructure);

  router.get("/horizontal-elements", ctrl.listHorizontalElements);
  router.post("/horizontal-elements", ctrl.createHorizontalElement);
  router.put("/horizontal-elements/:id", ctrl.updateHorizontalElement);
  router.delete("/horizontal-elements/:id", ctrl.deleteHorizontalElement);

  router.get("/pavements", ctrl.listPavements);
  router.post("/pavements", ctrl.createPavement);
  router.put("/pavements/:id", ctrl.updatePavement);
  router.delete("/pavements/:id", ctrl.deletePavement);

  router.get("/quantity-items", ctrl.listQuantityItems);
  router.post("/quantity-items", ctrl.createQuantityItem);
  router.put("/quantity-items/:id", ctrl.updateQuantityItem);
  router.delete("/quantity-items/:id", ctrl.deleteQuantityItem);

  router.get("/drawings", ctrl.listDrawings);
  router.post("/drawings", ctrl.createDrawing);
  router.put("/drawings/:id", ctrl.updateDrawing);
  router.delete("/drawings/:id", ctrl.deleteDrawing);

  router.get("/settings", ctrl.listSettings);
  router.post("/settings", ctrl.createSetting);
  router.put("/settings/:id", ctrl.updateSetting);
  router.delete("/settings/:id", ctrl.deleteSetting);

  // Budget / Төсөв
  const budget = require("../controllers/road_budget.controller.js");
  router.get("/budget/dashboard", budget.budgetDashboard);
  router.get("/budget/rates", budget.listRates);
  router.post("/budget/rates", budget.createRate);
  router.put("/budget/rates/:id", budget.updateRate);
  router.delete("/budget/rates/:id", budget.deleteRate);
  router.get("/budgets", budget.listBudgets);
  router.post("/budgets", budget.createBudget);
  router.get("/budgets/:id", budget.getBudget);
  router.put("/budgets/:id", budget.updateBudget);
  router.delete("/budgets/:id", budget.deleteBudget);
  router.post("/budgets/:id/duplicate", budget.duplicateBudget);
  router.patch("/budgets/:id/approve", budget.approveBudget);
  router.post("/budgets/:id/estimate", budget.estimateBudget);
  router.post("/budget-items", budget.createBudgetItem);
  router.put("/budget-items/:id", budget.updateBudgetItem);
  router.delete("/budget-items/:id", budget.deleteBudgetItem);

  app.use("/api/road-engineering", router);
};
