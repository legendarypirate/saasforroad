module.exports = (app) => {
  const auth = require("../controllers/jobseeker_auth.controller.js");
  const profile = require("../controllers/jobseeker_profile.controller.js");
  const { verifyJobSeekerToken } = auth;
  const router = require("express").Router();

  // ---- Auth (mobile job_seeker_rcos app) ----
  router.post("/auth/register", auth.register);
  router.post("/auth/login", auth.login);
  router.get("/auth/me", verifyJobSeekerToken, auth.me);
  router.patch("/auth/password", verifyJobSeekerToken, auth.changePassword);

  // ---- Profile ----
  router.get("/me", verifyJobSeekerToken, auth.me);
  router.put("/me", verifyJobSeekerToken, profile.updateProfile);

  // ---- Graduated schools ----
  router.post("/me/schools", verifyJobSeekerToken, profile.addSchool);
  router.put("/me/schools/:id", verifyJobSeekerToken, profile.updateSchool);
  router.delete("/me/schools/:id", verifyJobSeekerToken, profile.deleteSchool);

  // ---- Family ----
  router.post("/me/family", verifyJobSeekerToken, profile.addFamily);
  router.put("/me/family/:id", verifyJobSeekerToken, profile.updateFamily);
  router.delete("/me/family/:id", verifyJobSeekerToken, profile.deleteFamily);

  // ---- Companies + applications ----
  router.get("/companies", verifyJobSeekerToken, profile.listCompanies);
  router.get("/me/applications", verifyJobSeekerToken, profile.listMyApplications);
  router.post("/me/applications", verifyJobSeekerToken, profile.apply);
  router.patch(
    "/me/applications/:id/withdraw",
    verifyJobSeekerToken,
    profile.withdrawApplication
  );

  // ---- Offers received ----
  router.get("/me/offers", verifyJobSeekerToken, profile.listMyOffers);
  router.patch(
    "/me/offers/:id/respond",
    verifyJobSeekerToken,
    profile.respondToOffer
  );

  app.use("/api/seeker", router);
};
