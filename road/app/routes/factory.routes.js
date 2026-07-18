module.exports = (app) => {
  const auth = require("../controllers/factory_auth.controller.js");
  const pub = require("../controllers/factory_public.controller.js");
  const router = require("express").Router();

  // Company account auth
  router.post("/auth/register", auth.register);
  router.post("/auth/login", auth.login);
  router.get("/auth/me", auth.verifyCompanyToken, auth.me);
  router.put("/me", auth.verifyCompanyToken, auth.updateMe);
  router.patch("/me", auth.verifyCompanyToken, auth.updateMe);

  // Plants under the logged-in company
  router.get("/plants", auth.verifyCompanyToken, auth.listPlants);
  router.post("/plants", auth.verifyCompanyToken, auth.createPlant);
  router.get("/plants/:id", auth.verifyCompanyToken, auth.getPlant);
  router.put("/plants/:id", auth.verifyCompanyToken, auth.updatePlant);
  router.patch("/plants/:id", auth.verifyCompanyToken, auth.updatePlant);
  router.delete("/plants/:id", auth.verifyCompanyToken, auth.deletePlant);

  router.get("/public", pub.listPublic);

  app.use("/api/factory", router);

  const publicRouter = require("express").Router();
  publicRouter.get("/", pub.listPublic);
  app.use("/api/factories", publicRouter);
};
