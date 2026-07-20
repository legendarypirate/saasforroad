const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();

// Browsers reject Access-Control-Allow-Origin: * when fetch uses credentials: 'include'.
// Reflect the request Origin so tenant domains (e.g. masterboy.mn) work with cookies/auth headers.
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Tenant-Domain",
    "X-Device-Id",
    "X-Doc-Scope",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Local DMS / upload files (Cloudinary fallback + primary for documents)
const uploadsDir = path.join(__dirname, "uploads");
try {
  require("fs").mkdirSync(uploadsDir, { recursive: true });
} catch {
  // ignore
}
app.use("/assets", express.static(uploadsDir, { fallthrough: true, maxAge: "7d" }));

const db = require("./app/models");
const dbConfig = require("./app/config/db.config");
const { seedPermissionsAndRoles, seedDocumentFolders, seedEquipmentCategories } = require("./app/utils/seed");
const { ensureSchema } = require("./app/utils/ensureSchema");
const { resolveTenant } = require("./app/middleware/tenant");
const { bindTenantContext, registerTenantHooks } = require("./app/middleware/tenantScope");
const {
  ensureDefaultTenant,
  ensurePlatformAdmin,
} = require("./app/utils/tenantBootstrap");
const {
  ensureTenantColumns,
  listTenantScopedModels,
} = require("./app/utils/tenantColumns");

app.use(resolveTenant);
app.use(bindTenantContext);

function registerRoutes() {
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to the application." });
  });
  require("./app/routes/platform.routes")(app);
  require("./app/routes/transaction.routes")(app);
  require("./app/routes/inventory.routes")(app);
  require("./app/routes/invite.routes")(app);
  require("./app/routes/stock.routes")(app);
  require("./app/routes/supplier.routes")(app);
  require("./app/routes/milestone.routes")(app);
  require("./app/routes/project_phase.routes")(app);
  require("./app/routes/project_milestone.routes")(app);
  require("./app/routes/project_risk.routes")(app);
  require("./app/routes/equipment.routes")(app);
  require("./app/routes/project_equipment.routes")(app);
  require("./app/routes/age.routes")(app);
  require("./app/routes/doctor.routes")(app);
  require("./app/routes/info.routes")(app);
  require("./app/routes/question.routes")(app);
  require("./app/routes/qpay.routes")(app);
  require("./app/routes/project.routes")(app);
  require("./app/routes/task.routes")(app);
  require("./app/routes/order.routes")(app);
  require("./app/routes/item.routes")(app);
  require("./app/routes/accident.routes")(app);
  require("./app/routes/daily_report.routes")(app);
  require("./app/routes/hse.routes")(app);
  require("./app/routes/road_engineering.routes")(app);
  require("./app/routes/finance.routes")(app);
  require("./app/routes/plant.routes")(app);
  require("./app/routes/uniform.routes")(app);
  require("./app/routes/fuel.routes")(app);
  require("./app/routes/notification.routes")(app);
  require("./app/routes/document.routes")(app);
  require("./app/routes/personal_note.routes")(app);
  require("./app/routes/factory.routes")(app);
  require("./app/routes/student.routes")(app);
  require("./app/routes/job_seeker.routes")(app);
  require("./app/routes/jobseeker_app.routes")(app);
  require("./app/routes/jobseeker_tenant.routes")(app);
  require("./app/routes/collab.routes")(app);
  require("./app/routes/brigade.routes")(app);
  require("./app/routes/angilal.routes")(app);
  require("./app/routes/material.routes")(app);
  require("./app/routes/banner.routes")(app);
  require("./app/routes/product.routes")(app);
  require("./app/routes/auth.routes")(app);
  require("./app/routes/warehouse.routes")(app);
  require("./app/routes/role.routes")(app);
  require("./app/routes/permission.routes")(app);
  require("./app/routes/role_permission.routes")(app);
  require("./app/routes/attendance.routes")(app);
  require("./app/routes/action.routes")(app);
  require("./app/routes/feedback.routes")(app);
  require("./app/routes/emergency_contact.routes")(app);
  require("./app/routes/family_member.routes")(app);
  require("./app/routes/education.routes")(app);
  require("./app/routes/career_change.routes")(app);
  require("./app/routes/contract_termination.routes")(app);
  require("./app/routes/user_award.routes")(app);
  require("./app/routes/schedule_exception.routes")(app);
  require("./app/routes/word.routes")(app);
  require("./app/routes/category.routes")(app);
  require("./app/routes/privacy.routes")(app);
  require("./app/routes/user.routes")(app);
  require("./app/routes/homepage.routes")(app);
  require("./app/routes/tender.routes")(app);
  require("./app/routes/equipment_rental.routes")(app);
  require("./app/routes/office_location.routes")(app);
  require("./app/routes/org_structure.routes")(app);
  require("./app/routes/salary.routes")(app);
  require("./app/routes/leave_request.routes")(app);
  require("./app/routes/device.routes")(app);

  app.all("*", (req, res) => {
    res.status(404).json({ message: "Route not found!" });
  });
}

async function start() {
  try {
    const dbLabel = dbConfig.useUrl
      ? "postgres (DATABASE_URL)"
      : `postgres://${dbConfig.USER}@${dbConfig.HOST}/${dbConfig.DB}`;
    console.log(`Connecting to ${dbLabel}`);

    await db.sequelize.authenticate();
    await db.sequelize.sync();
    const tenantCols = await ensureTenantColumns(db.sequelize, db);
    if (tenantCols > 0) {
      console.log(`Added tenant_id column to ${tenantCols} table(s)`);
    }
    registerTenantHooks(db);
    const scoped = listTenantScopedModels(db);
    console.log(`Tenant scope active on ${scoped.length} models`);
    await ensureSchema(db.sequelize, db.users);
    const { migrateBrigadeSeparation } = require("./app/utils/migrateBrigadeSeparation");
    await migrateBrigadeSeparation(db);
    const { migrateProjectFidic } = require("./app/utils/migrateProjectFidic");
    await migrateProjectFidic(db);
    const { migrateLegacyEquipment } = require("./app/utils/migrateEquipment");
    await migrateLegacyEquipment(db.sequelize, db);
    await ensureDefaultTenant();
    await seedPermissionsAndRoles();
    await ensurePlatformAdmin();
    await seedDocumentFolders();
    await seedEquipmentCategories();
    const { seedRoadEngineering } = require("./app/utils/seedRoadEngineering");
    const roadSeed = await seedRoadEngineering();
    if (roadSeed?.skipped) {
      console.log(`Road engineering seed skipped (${roadSeed.count} projects).`);
    } else {
      console.log("Road engineering seed completed.");
    }
    const { seedRoadBudget } = require("./app/utils/seedRoadBudget");
    const budgetSeed = await seedRoadBudget(db);
    console.log(
      `Road budget seed: rates+${budgetSeed.createdRates}, budget=${budgetSeed.skipped ? "exists" : "created"}, estimate=${budgetSeed.estimateOk ?? "n/a"}`,
    );
    // Backfill FIDIC stage-gate phases for projects missing them
    try {
      const { seedProjectPhases } = require("./app/utils/projectPhaseTemplate");
      const allProjects = await db.projects.findAll({ attributes: ["id", "planned_start", "baseline_start"] });
      let phasesBackfilled = 0;
      for (const p of allProjects) {
        phasesBackfilled += await seedProjectPhases(db, p);
      }
      if (phasesBackfilled) console.log(`Project stage-gates seeded: ${phasesBackfilled} phases.`);
    } catch (e) {
      console.warn("Project phase seed skipped:", e.message);
    }
    console.log("Synced db.");

    registerRoutes();

    const { schedulePersonalNoteDeadlineJob } = require("./app/jobs/personalNoteDeadlineJob");
    schedulePersonalNoteDeadlineJob();

    const PORT = process.env.PORT || 3201;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

start();
