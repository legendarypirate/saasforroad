const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS configuration to allow only a specific origin
var corsOptions = {
  origin: "*",
};


// Enable CORS
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files (images) from the 'app/assets' folder
app.use("/assets", express.static(path.join(__dirname, "app", "assets")));

// Import models (Make sure to update the path if necessary)y
const db = require("./app/models");

const { seedPermissionsAndRoles } = require("./app/utils/seed");
const { ensureSchema } = require("./app/utils/ensureSchema");

db.sequelize.sync()
  .then(async () => {
    await ensureSchema(db.sequelize);
    console.log("Synced db.");
    await seedPermissionsAndRoles();
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});
require("./app/routes/transaction.routes")(app);

require("./app/routes/invite.routes")(app);
require("./app/routes/stock.routes")(app);
require("./app/routes/supplier.routes")(app);
require("./app/routes/milestone.routes")(app);

// Route imports
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
require("./app/routes/notification.routes")(app);
require("./app/routes/document.routes")(app);
require("./app/routes/angilal.routes")(app);
require("./app/routes/material.routes")(app);

// Route imports
require("./app/routes/banner.routes")(app);
require("./app/routes/product.routes")(app);
require("./app/routes/auth.routes")(app);
require("./app/routes/warehouse.routes")(app);

// Role-related routes
require("./app/routes/role.routes")(app);
require("./app/routes/permission.routes")(app);
require("./app/routes/role_permission.routes")(app);
require("./app/routes/attendance.routes")(app);
require("./app/routes/action.routes")(app);
require("./app/routes/feedback.routes")(app);
require("./app/routes/emergency_contact.routes")(app);
require("./app/routes/education.routes")(app);
require("./app/routes/career_change.routes")(app);
require("./app/routes/contract_termination.routes")(app);
require("./app/routes/user_award.routes")(app);

// Word-related routes
require("./app/routes/word.routes")(app);

// Category-related routesule
require("./app/routes/category.routes")(app);
require("./app/routes/privacy.routes")(app);

// User-related routes
require("./app/routes/user.routes")(app);

// Add error handling for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: "Route not found!" });
});

// set port, listen for requests
const PORT = process.env.PORT || 3201;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
