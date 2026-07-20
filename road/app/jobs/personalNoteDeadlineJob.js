const db = require("../models");
const Note = db.personal_notes;
const Reminder = db.personal_note_reminders;
const Notification = db.notifications;
const Op = db.Sequelize.Op;

const TZ = "Asia/Ulaanbaatar";

function formatDateInTz(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntil(deadlineStr, todayStr) {
  const a = new Date(`${todayStr}T12:00:00`);
  const b = new Date(`${deadlineStr}T12:00:00`);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

function reminderMeta(daysLeft) {
  if (daysLeft === 2) {
    return {
      type: "day_minus_2",
      title: "Тэмдэглэлийн хугацаа дуусахад 2 хоног үлдлээ",
    };
  }
  if (daysLeft === 1) {
    return {
      type: "day_minus_1",
      title: "Тэмдэглэлийн хугацаа маргааш дуусна",
    };
  }
  if (daysLeft === 0) {
    return {
      type: "deadline_day",
      title: "Тэмдэглэлийн хугацаа өнөөдөр дуусна",
    };
  }
  return null;
}

function buildDescription(note, deadlineStr, daysLeft) {
  const title = note.title || "Гарчиггүй";
  if (daysLeft === 2) {
    return `"${title}" тэмдэглэлийн хугацаа ${deadlineStr} өдөр дуусах тул 2 хоногийн өмнө анхааруулж байна.`;
  }
  if (daysLeft === 1) {
    return `"${title}" тэмдэглэлийн хугацаа маргааш (${deadlineStr}) дуусна.`;
  }
  return `"${title}" тэмдэглэлийн хугацаа өнөөдөр (${deadlineStr}) дуусна.`;
}

async function sendReminder(note, meta, deadlineStr, daysLeft) {
  const existing = await Reminder.findOne({
    where: {
      personal_note_id: note.id,
      reminder_type: meta.type,
      deadline_date: deadlineStr,
    },
    skipTenantScope: true,
  });
  if (existing) return { skipped: true };

  await Reminder.create(
    {
      personal_note_id: note.id,
      user_id: note.user_id,
      tenant_id: note.tenant_id,
      reminder_type: meta.type,
      deadline_date: deadlineStr,
    },
    { skipTenantScope: true }
  );

  await Notification.create(
    {
      user_id: note.user_id,
      tenant_id: note.tenant_id,
      title: meta.title,
      description: buildDescription(note, deadlineStr, daysLeft),
      status: "published",
      audience: "mobile",
      priority: daysLeft === 0 ? "urgent" : "high",
      published_at: new Date(),
    },
    { skipTenantScope: true }
  );

  return { sent: true };
}

/**
 * Daily job: for notes with deadline_date, notify creator on D-2, D-1, and deadline day.
 * Scoped per note.user_id + note.tenant_id.
 */
async function runPersonalNoteDeadlineReminders(todayStr = formatDateInTz()) {
  const notes = await Note.findAll({
    where: {
      deadline_date: { [Op.not]: null },
    },
    attributes: ["id", "user_id", "tenant_id", "title", "deadline_date"],
    skipTenantScope: true,
  });

  let sent = 0;
  let skipped = 0;

  for (const note of notes) {
    const deadlineStr = String(note.deadline_date).slice(0, 10);
    const left = daysUntil(deadlineStr, todayStr);
    if (![0, 1, 2].includes(left)) continue;

    const meta = reminderMeta(left);
    if (!meta) continue;

    const result = await sendReminder(note, meta, deadlineStr, left);
    if (result.sent) sent += 1;
    else skipped += 1;
  }

  return { today: todayStr, checked: notes.length, sent, skipped };
}

function schedulePersonalNoteDeadlineJob() {
  const run = async () => {
    try {
      const result = await runPersonalNoteDeadlineReminders();
      if (result.sent > 0) {
        console.log(
          `[personal-note-reminders] ${result.today}: sent=${result.sent}, skipped=${result.skipped}`
        );
      }
    } catch (err) {
      console.error("[personal-note-reminders] job failed:", err.message);
    }
  };

  const msUntilNextUtcMidnight = () => {
    const now = new Date();
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
    );
    return Math.max(next - now, 60_000);
  };

  const delay = msUntilNextUtcMidnight();
  setTimeout(() => {
    void run();
    setInterval(run, 24 * 60 * 60 * 1000);
  }, delay);

  console.log(
    `[personal-note-reminders] scheduled daily at 08:00 ${TZ} (next in ${Math.round(delay / 60000)} min)`
  );
}

module.exports = {
  runPersonalNoteDeadlineReminders,
  schedulePersonalNoteDeadlineJob,
  formatDateInTz,
};
