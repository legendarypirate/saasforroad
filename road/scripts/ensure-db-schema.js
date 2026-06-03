#!/usr/bin/env node
/**
 * Run manually: node scripts/ensure-db-schema.js
 * Adds missing users columns (profile + work schedule) without restarting the app.
 */
const db = require("../app/models");
const { ensureSchema } = require("../app/utils/ensureSchema");

db.sequelize
  .sync()
  .then(() => ensureSchema(db.sequelize, db.users))
  .then(() => {
    console.log("Database schema ensured successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Schema ensure failed:", err.message);
    process.exit(1);
  });
