// routes/chat.js
const express = require("express");
const { OpenAI } = require("openai");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/chat  -> body: { message: "hello" }
router.post("/chat", async (req, res) => {
  try {
    const userMessage = (req.body?.message || "").toString().trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!userMessage) return res.status(400).json({ error: "message_required" });

    const r = await openai.responses.create({
      model: "gpt-4o-mini",                // cheap + fast
      input: [
        { role: "system", 
          content: "You are pick-a-plate, a food recommender specializing in food available in the Philippines (not necessarily filipino food suggest other cuisines too). You are aware of context so if you say something and the user replies, then you should know what they're referring to. Keep responses concise and to the point" },
      ...history.map(m => ({ role: m.role, content: m.content })), // ✅ use history       
       { role: "user", content: userMessage }
      ],
      max_output_tokens: 300               // keeps responses short, saves cost
    });

    return res.json({ reply: r.output_text || "" });
  } catch (err) {
    console.error("openai_error:", err?.message || err);
    // handle common errors nicely
    if (String(err?.message || "").includes("429")) {
      return res.status(429).json({ error: "quota_or_rate_limit" });
    }
    return res.status(500).json({ error: "chat_failed" });
  }
});

module.exports = router;
