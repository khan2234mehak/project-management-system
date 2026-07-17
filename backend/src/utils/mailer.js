const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console.
 * This keeps registration/password-reset flows fully functional in local
 * development without requiring real email credentials.
 */
async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();

  if (!t) {
    console.log('\n📧 [DEV EMAIL — SMTP not configured, logging instead]');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text}\n`);
    return { simulated: true };
  }

  return t.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@pms.local',
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
