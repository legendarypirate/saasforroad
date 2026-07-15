module.exports = (app) => {
  const platform = require("../controllers/platform.controller");
  const platformLanding = require("../controllers/platformLanding.controller");
  const { verifyPlatformToken } = require("../middleware/tenant");
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
};
