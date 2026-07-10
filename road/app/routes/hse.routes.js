module.exports = (app) => {
  const ctrl = require("../controllers/hse.controller.js");
  const mobileAuth = require("../middleware/mobileAuth.js");
  const router = require("express").Router();
  const mobileGuard = [mobileAuth.verifyMobileToken, mobileAuth.requireApprovedDevice];

  // Dashboard & reports
  router.get("/dashboard", ctrl.dashboard);
  router.get("/reports/:type", ctrl.reports);

  // Daily Safety Instruction
  router.get("/daily-instructions/today", ctrl.getTodayInstruction);
  router.get("/daily-instructions/completion", ctrl.instructionCompletionStatus);
  router.get("/daily-instructions/acks", ctrl.listAcknowledgments);
  router.post("/daily-instructions/acknowledge", ctrl.acknowledgeInstruction);
  router.get("/daily-instructions", ctrl.listInstructions);
  router.post("/daily-instructions", ctrl.createInstruction);
  router.put("/daily-instructions/:id", ctrl.updateInstruction);
  router.delete("/daily-instructions/:id", ctrl.deleteInstruction);

  // Mobile endpoints
  router.get("/mobile/daily-instruction/today", ...mobileGuard, ctrl.getTodayInstruction);
  router.post("/mobile/daily-instruction/acknowledge", ...mobileGuard, ctrl.acknowledgeInstruction);
  router.post("/mobile/observations", ...mobileGuard, ctrl.createObservationMobile);
  router.post("/mobile/near-misses", ...mobileGuard, ctrl.createNearMissMobile);
  router.post("/mobile/incidents", ...mobileGuard, ctrl.createIncidentMobile);

  // Toolbox
  router.get("/toolbox-meetings", ctrl.listToolboxMeetings);
  router.post("/toolbox-meetings", ctrl.createToolboxMeeting);
  router.put("/toolbox-meetings/:id", ctrl.updateToolboxMeeting);
  router.delete("/toolbox-meetings/:id", ctrl.deleteToolboxMeeting);

  // Observations
  router.get("/observations", ctrl.listObservations);
  router.post("/observations", ctrl.createObservation);
  router.get("/observations/:id", ctrl.getObservation);
  router.put("/observations/:id", ctrl.updateObservation);
  router.patch("/observations/:id/transition", ctrl.transitionObservation);
  router.delete("/observations/:id", ctrl.deleteObservation);

  // Near miss
  router.get("/near-misses", ctrl.listNearMisses);
  router.post("/near-misses", ctrl.createNearMiss);
  router.get("/near-misses/:id", ctrl.getNearMiss);
  router.put("/near-misses/:id", ctrl.updateNearMiss);
  router.delete("/near-misses/:id", ctrl.deleteNearMiss);

  // Incidents
  router.get("/incidents", ctrl.listIncidents);
  router.post("/incidents", ctrl.createIncident);
  router.get("/incidents/:id", ctrl.getIncident);
  router.put("/incidents/:id", ctrl.updateIncident);
  router.patch("/incidents/:id/approve", ctrl.approveIncident);
  router.delete("/incidents/:id", ctrl.deleteIncident);

  // Risk assessment
  router.get("/risk-assessments", ctrl.listRiskAssessments);
  router.post("/risk-assessments", ctrl.createRiskAssessment);
  router.get("/risk-assessments/:id", ctrl.getRiskAssessment);
  router.put("/risk-assessments/:id", ctrl.updateRiskAssessment);
  router.patch("/risk-assessments/:id/approve", ctrl.approveRiskAssessment);
  router.delete("/risk-assessments/:id", ctrl.deleteRiskAssessment);

  // Permits
  router.get("/permits", ctrl.listPermits);
  router.post("/permits", ctrl.createPermit);
  router.put("/permits/:id", ctrl.updatePermit);
  router.patch("/permits/:id/approve", ctrl.approvePermit);
  router.delete("/permits/:id", ctrl.deletePermit);

  // Inspections
  router.get("/inspection-templates", ctrl.listInspectionTemplates);
  router.post("/inspection-templates", ctrl.createInspectionTemplate);
  router.get("/inspection-templates/:id", ctrl.getInspectionTemplate);
  router.put("/inspection-templates/:id", ctrl.updateInspectionTemplate);
  router.delete("/inspection-templates/:id", ctrl.deleteInspectionTemplate);
  router.get("/inspections", ctrl.listInspections);
  router.post("/inspections", ctrl.createInspection);
  router.get("/inspections/:id", ctrl.getInspection);
  router.delete("/inspections/:id", ctrl.deleteInspection);

  // PPE
  router.get("/ppe-items", ctrl.listPpeItems);
  router.post("/ppe-items", ctrl.createPpeItem);
  router.get("/ppe-items/:id", ctrl.getPpeItem);
  router.put("/ppe-items/:id", ctrl.updatePpeItem);
  router.delete("/ppe-items/:id", ctrl.deletePpeItem);
  router.get("/ppe-assignments", ctrl.listPpeAssignments);
  router.post("/ppe-assignments", ctrl.createPpeAssignment);
  router.get("/ppe-assignments/:id", ctrl.getPpeAssignment);
  router.put("/ppe-assignments/:id", ctrl.updatePpeAssignment);
  router.delete("/ppe-assignments/:id", ctrl.deletePpeAssignment);

  // Training
  router.get("/trainings", ctrl.listTrainings);
  router.post("/trainings", ctrl.createTraining);
  router.get("/trainings/:id", ctrl.getTraining);
  router.put("/trainings/:id", ctrl.updateTraining);
  router.delete("/trainings/:id", ctrl.deleteTraining);
  router.get("/training-records", ctrl.listTrainingRecords);
  router.post("/training-records", ctrl.createTrainingRecord);
  router.get("/training-records/:id", ctrl.getTrainingRecord);
  router.put("/training-records/:id", ctrl.updateTrainingRecord);
  router.delete("/training-records/:id", ctrl.deleteTrainingRecord);

  // Equipment safety
  router.get("/equipment-inspections", ctrl.listEquipmentInspections);
  router.post("/equipment-inspections", ctrl.createEquipmentInspection);
  router.get("/equipment-inspections/:id", ctrl.getEquipmentInspection);
  router.put("/equipment-inspections/:id", ctrl.updateEquipmentInspection);
  router.delete("/equipment-inspections/:id", ctrl.deleteEquipmentInspection);

  // Environmental
  router.get("/environmental", ctrl.listEnvironmentalRecords);
  router.post("/environmental", ctrl.createEnvironmentalRecord);
  router.get("/environmental/:id", ctrl.getEnvironmentalRecord);
  router.put("/environmental/:id", ctrl.updateEnvironmentalRecord);
  router.delete("/environmental/:id", ctrl.deleteEnvironmentalRecord);

  // CAPA
  router.get("/capa", ctrl.listCapas);
  router.post("/capa", ctrl.createCapa);
  router.get("/capa/:id", ctrl.getCapa);
  router.put("/capa/:id", ctrl.updateCapa);
  router.patch("/capa/:id/verify", ctrl.verifyCapa);
  router.delete("/capa/:id", ctrl.deleteCapa);

  // Documents
  router.get("/documents", ctrl.listDocuments);
  router.post("/documents", ctrl.createDocument);
  router.post("/documents/upload", ctrl.uploadDocument);
  router.get("/documents/:id", ctrl.getDocument);
  router.put("/documents/:id", ctrl.updateDocument);
  router.delete("/documents/:id", ctrl.deleteDocument);

  app.use("/api/hse", router);
};
