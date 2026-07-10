const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const dbConfig = require("./app/config/db.config");
const { seedPermissionsAndRoles } = require("./app/utils/seed");
const { ensureSchema } = require("./app/utils/ensureSchema");

function registerRoutes() {
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to the application." });
  });
  require("./app/routes/transaction.routes")(app);
  require("./app/routes/inventory.routes")(app);
  require("./app/routes/invite.routes")(app);
  require("./app/routes/stock.routes")(app);
  require("./app/routes/supplier.routes")(app);
  require("./app/routes/milestone.routes")(app);
  require("./app/routes/project_phase.routes")(app);
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
  require("./app/routes/notification.routes")(app);
  require("./app/routes/document.routes")(app);
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
    await ensureSchema(db.sequelize, db.users);
    const { migrateLegacyEquipment } = require("./app/utils/migrateEquipment");
    await migrateLegacyEquipment(db.sequelize, db);
    await seedPermissionsAndRoles();
    console.log("Synced db.");

    registerRoutes();

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
