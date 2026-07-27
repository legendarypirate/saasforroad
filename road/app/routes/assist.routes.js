module.exports = (app) => {
  const driverAuth = require("../controllers/assist_driver_auth.controller");
  const manAuth = require("../controllers/assist_service_man_auth.controller");
  const assist = require("../controllers/assist.controller");
  const router = require("express").Router();

  // Catalog (public mobile)
  router.get("/catalog/categories", assist.listCategories);
  router.get("/catalog/services", assist.listServices);

  // Admin catalog CRUD
  router.get("/admin/categories", assist.adminListAll);
  router.post("/admin/upload", assist.uploadImage);
  router.post("/admin/categories", assist.adminCreateCategory);
  router.patch("/admin/categories/:id", assist.adminUpdateCategory);
  router.delete("/admin/categories/:id", assist.adminDeleteCategory);
  router.post("/admin/services", assist.adminCreateService);
  router.patch("/admin/services/:id", assist.adminUpdateService);
  router.delete("/admin/services/:id", assist.adminDeleteService);

  // Driver auth + profile
  router.post("/driver/auth/register", driverAuth.register);
  router.post("/driver/auth/login", driverAuth.login);
  router.get("/driver/auth/me", driverAuth.verifyDriverToken, driverAuth.me);
  router.put("/driver/me", driverAuth.verifyDriverToken, driverAuth.updateMe);
  router.get(
    "/driver/calls",
    driverAuth.verifyDriverToken,
    assist.driverHistory
  );
  router.get(
    "/driver/nearby-service-men",
    driverAuth.verifyDriverToken,
    assist.driverNearbyServiceMen
  );
  router.get(
    "/driver/equipment-by-plate",
    driverAuth.verifyDriverToken,
    assist.driverLookupEquipmentByPlate
  );
  router.post(
    "/driver/calls",
    driverAuth.verifyDriverToken,
    assist.driverCreateCall
  );
  router.post(
    "/driver/calls/:id/cancel",
    driverAuth.verifyDriverToken,
    assist.driverCancelCall
  );
  router.post(
    "/driver/calls/:id/review",
    driverAuth.verifyDriverToken,
    assist.driverSubmitReview
  );
  router.get(
    "/driver/calls/:id",
    driverAuth.verifyDriverToken,
    assist.getCall
  );

  const driverJobs = require("../controllers/driver_job.controller");
  router.get(
    "/driver/job-openings",
    driverAuth.verifyDriverToken,
    driverJobs.driverListOpenings
  );
  router.get(
    "/driver/job-openings/:id",
    driverAuth.verifyDriverToken,
    driverJobs.driverGetOpening
  );
  router.post(
    "/driver/job-openings/:id/apply",
    driverAuth.verifyDriverToken,
    driverJobs.driverApply
  );
  router.get(
    "/driver/job-applications",
    driverAuth.verifyDriverToken,
    driverJobs.driverMyApplications
  );
  router.post(
    "/driver/job-applications/:id/withdraw",
    driverAuth.verifyDriverToken,
    driverJobs.driverWithdrawApplication
  );

  // Service man auth + profile
  router.post("/service-man/auth/register", manAuth.register);
  router.post("/service-man/auth/login", manAuth.login);
  router.get(
    "/service-man/auth/me",
    manAuth.verifyServiceManToken,
    manAuth.me
  );
  router.put(
    "/service-man/me",
    manAuth.verifyServiceManToken,
    manAuth.updateMe
  );
  router.put(
    "/service-man/me/services",
    manAuth.verifyServiceManToken,
    manAuth.setServices
  );
  router.get(
    "/service-man/calls",
    manAuth.verifyServiceManToken,
    assist.serviceManHistory
  );
  router.post(
    "/service-man/calls/:id/accept",
    manAuth.verifyServiceManToken,
    assist.serviceManAccept
  );
  router.post(
    "/service-man/calls/:id/decline",
    manAuth.verifyServiceManToken,
    assist.serviceManDecline
  );
  router.post(
    "/service-man/calls/:id/start",
    manAuth.verifyServiceManToken,
    assist.serviceManStartWork
  );
  router.post(
    "/service-man/calls/:id/finish",
    manAuth.verifyServiceManToken,
    assist.serviceManFinishWork
  );
  router.get(
    "/service-man/calls/:id",
    manAuth.verifyServiceManToken,
    assist.getCall
  );

  // Tenant admin invoices (scoped by X-Tenant-Domain)
  router.get("/admin/invoices", assist.listInvoices);
  router.post("/admin/invoices/:id/mark-paid", assist.markInvoicePaid);

  // Tenant mobile driver (Road app) — same call pipeline as freelancer,
  // gated by assist.call:create permission on the tenant user role.
  const mobileAuth = require("../middleware/mobileAuth");
  const {
    requireTenantAssistDriver,
  } = require("../middleware/assistTenantDriver");
  const tenantDriverGuard = [
    mobileAuth.verifyMobileToken,
    mobileAuth.requireApprovedDevice,
    requireTenantAssistDriver,
  ];

  router.get("/tenant/session", ...tenantDriverGuard, assist.tenantAssistSession);
  router.get(
    "/tenant/nearby-service-men",
    ...tenantDriverGuard,
    assist.driverNearbyServiceMen
  );
  router.get(
    "/tenant/equipment-by-plate",
    ...tenantDriverGuard,
    assist.tenantLookupEquipmentByPlate
  );
  router.get("/tenant/calls", ...tenantDriverGuard, assist.driverHistory);
  router.post("/tenant/calls", ...tenantDriverGuard, assist.driverCreateCall);
  router.post(
    "/tenant/calls/:id/cancel",
    ...tenantDriverGuard,
    assist.driverCancelCall
  );
  router.post(
    "/tenant/calls/:id/review",
    ...tenantDriverGuard,
    assist.driverSubmitReview
  );
  router.get("/tenant/calls/:id", ...tenantDriverGuard, assist.getCall);

  app.use("/api/assist", router);
};
