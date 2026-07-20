#!/usr/bin/env node
/**
 * Run personal note deadline reminders once (for external cron).
 * Example: 0 8 * * * node scripts/run-personal-note-reminders.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = require("../app/models");
const {
  runPersonalNoteDeadlineReminders,
  formatDateInTz,
} = require("../app/jobs/personalNoteDeadlineJob");

async function main() {
  await db.sequelize.authenticate();
  const result = await runPersonalNoteDeadlineReminders(formatDateInTz());
  console.log(JSON.stringify(result));
  await db.sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
