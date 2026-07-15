module.exports = (app) => {
  const platform = require("../controllers/platform.controller");
  const platformLanding = require("../controllers/platformLanding.controller");
  const platformData = require("../controllers/platformData.controller");
  const { verifyPlatformToken, requireTenant } = require("../middleware/tenant");
  const router = require("express").Router();

  router.post("/auth/login", platform.login);
  router.get("/auth/me", verifyPlatformToken, platform.me);

  // Public platform marketing page (rcos.mn)
  router.get("/landing", platformLanding.getPublic);
  router.get("/landing/admin", verifyPlatformToken, platformLanding.getAdmin);
  router.put("/landing", verifyPlatformToken, platformLanding.update);
  router.post(
    "/landing/upload",
    verifyPlatformToken,
    platformLanding.uploadImage
  );

  // Platform-owned Дата catalog (CRUD)
  router.get("/data", verifyPlatformToken, platformData.list);
  router.get("/data/:id", verifyPlatformToken, platformData.getOne);
  router.post("/data", verifyPlatformToken, platformData.create);
  router.put("/data/:id", verifyPlatformToken, platformData.update);
  router.delete("/data/:id", verifyPlatformToken, platformData.remove);

  // Real brigades marketplace (registered via brigad app)
  const platformBrigades = require("../controllers/platformBrigades.controller");
  router.get("/brigades", verifyPlatformToken, platformBrigades.list);
  router.get("/brigades/:id", verifyPlatformToken, platformBrigades.getOne);
  router.patch(
    "/brigades/:id/status",
    verifyPlatformToken,
    platformBrigades.setStatus
  );

  router.get("/modules", verifyPlatformToken, platform.listModules);
  router.get("/permissions", verifyPlatformToken, platform.listPermissions);

  router.get("/tenants", verifyPlatformToken, platform.listTenants);
  router.post("/tenants", verifyPlatformToken, platform.createTenant);
  router.get("/tenants/:id", verifyPlatformToken, platform.getTenant);
  router.put("/tenants/:id", verifyPlatformToken, platform.updateTenant);
  router.patch("/tenants/:id/modules", verifyPlatformToken, platform.updateTenantModules);
  router.put("/tenants/:id/modules", verifyPlatformToken, platform.updateTenantModules);
  router.post("/tenants/:id/superadmin", verifyPlatformToken, platform.setSuperadmin);
  router.get("/tenants/:id/roles", verifyPlatformToken, platform.listTenantRoles);
  router.put(
    "/tenants/:id/roles/:roleId/permissions",
    verifyPlatformToken,
    platform.updateTenantRolePermissions
  );
  router.get("/tenants/:id/users", verifyPlatformToken, platform.listTenantUsers);

  app.use("/api/platform", router);

  // Public tenant resolution for zam (by domain)
  const publicRouter = require("express").Router();
  publicRouter.get("/current", platform.getCurrentTenantPublic);
  publicRouter.get("/ssl-allowed", platform.sslAllowed);
  app.use("/api/tenant", publicRouter);

  // Tenant read-only Дата catalog
  const catalogRouter = require("express").Router();
  catalogRouter.get("/", platformData.listPublic);
  app.use("/api/data-catalog", catalogRouter);
};
