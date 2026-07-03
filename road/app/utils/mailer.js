const { Resend } = require("resend");

let resendClient = null;

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getClient() {
  if (!isConfigured()) {
    throw new Error("Resend тохиргоо хийгдээгүй байна (RESEND_API_KEY)");
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("RESEND_FROM тохиргоо хийгдээгүй байна (жишээ: HR <noreply@yourdomain.com>)");
  }

  const client = getClient();
  const { data, error } = await client.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Имэйл илгээхэд алдаа гарлаа");
  }

  return data;
}

module.exports = { sendMail, isConfigured };
