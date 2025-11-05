// server/routes/dev.js
const express = require("express");
const { verifySmtp, sendOtpEmail } = require("../utils/mailer");
const router = express.Router();

router.get("/smtp-check", async (_req, res) => {
  try { res.json({ success: true, info: await verifySmtp() }); }
  catch (e) { res.status(500).json({ success: false, error: e?.message }); }
});

router.get("/send-test", async (req, res) => {
  try {
    const to = String(req.query.to || "");
    if (!to) return res.status(400).json({ success: false, message: "Missing ?to=email" });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOtpEmail({ to, code, purpose: "verify" });
    res.json({ success: true, message: `Sent test OTP to ${to}` });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message });
  }
});

module.exports = router;
