/**
 * Manually re-seed permissions & roles (and link admin users).
 * Usage (from road/):
 *   node scripts/seed-permissions.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = require("../app/models");
const { seedPermissionsAndRoles } = require("../app/utils/seed");

async function main() {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected.");
    await seedPermissionsAndRoles();
    console.log("Done. Restart is not required for DB changes; users must log out/in.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

main();
