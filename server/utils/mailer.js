const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendOtpEmail({ to, code, subject = 'Your PickAPlate verification code' }) {
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background-color:#ffffff;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#F59E0B;font-size:32px;margin:0;">🍽️ PickAPlate</h1>
      </div>
      <div style="background-color:#FEF3C7;border-radius:12px;padding:30px;text-align:center;margin-bottom:30px;">
        <h2 style="color:#92400E;font-size:24px;margin:0 0 20px 0;">Your Verification Code</h2>
        <div style="background-color:#ffffff;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#92400E;font-size:16px;margin:0 0 15px 0;">Use this one-time code:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#F59E0B;font-family:monospace;">${code}</div>
        </div>
        <p style="color:#92400E;font-size:14px;margin:20px 0 0 0;">This code expires in ${process.env.OTP_CODE_TTL_MIN || 10} minutes.</p>
      </div>
      <div style="text-align:center;color:#6B7280;font-size:12px;">
        <p style="margin:10px 0;">If you didn't request this code, you can safely ignore this email.</p>
        <p style="margin:10px 0;">© ${new Date().getFullYear()} PickAPlate. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.MAIL_FROM || 'PickAPlate <noreply.pickaplate@gmail.com>',
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    // console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    // console.error('❌ Email error:', error.message);
    throw new Error('Failed to send email');
  }
}

const sendResetOtpEmail = ({ to, code }) =>
  sendOtpEmail({ to, code, subject: 'Reset your PickAPlate password' });

module.exports = { sendOtpEmail, sendResetOtpEmail };