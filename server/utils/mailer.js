// server/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendOtpEmail({ to, code, subject = 'Your PickAPlate verification code' }) {
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto">
      <h2>PickAPlate</h2>
      <p>Use this one-time code:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
      <p>This code expires soon. If you didn’t request it, you can ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'PickAPlate <noreply@pickaplate.local>',
    to,
    subject,
    html,
  });
}

const sendResetOtpEmail = ({ to, code }) =>
  sendOtpEmail({ to, code, subject: 'Reset your PickAPlate password' });

module.exports = { sendOtpEmail, sendResetOtpEmail };
