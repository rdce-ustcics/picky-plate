// server/routes/chat.js
const express = require("express");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const router = express.Router();
const openai = require("../openaiClient");

// ⬇️ NEW: unified preferences model
const UserPreferences = require("../models/UserPreferences");

/**
 * Soft authentication middleware
 * - Attaches req.user if a valid Bearer token is present.
 */
function softAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) {
    const token = h.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) req.user = { id: String(decoded.id) };
    } catch (_) {
      // ignore invalid tokens → anonymous session continues
    }
  }
  next();
}

/**
 * Owner resolution helper
 * - Logged-in user → { userId }
 * - Anonymous with sessionId → { sessionId }
 */
function getOwner(req) {
  if (req.user?.id) {
    return { owner: { userId: String(req.user.id) }, sessionId: null };
  }
  const sessionId =
    (req.body?.sessionId || req.query?.sessionId || "").toString().trim();
  if (!sessionId) return null;
  return { owner: { sessionId }, sessionId };
}

router.use(softAuth);

/**
 * POST /api/chat
 * Body: { message, history?, chatId?, sessionId? }
 */
router.post("/chat", async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: "db_not_initialized" });

    const chats = db.collection("chats");
    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });
    const { owner } = ownerInfo;

    const userMessage = (req.body?.message || "").toString().trim();
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!userMessage)
      return res.status(400).json({ error: "message_required" });

    // Clean conversation history
    const cleanHistory = rawHistory
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .map((m) => ({ role: m.role, content: m.content.trim() }))
      .slice(-8);

    // 🔍 Fetch user preferences (if logged in)
    let prefsForPrompt = null;
    if (owner.userId) {
      try {
        const prefs = await UserPreferences.findOne({ userId: owner.userId }).lean();
        if (prefs) {
          prefsForPrompt = {
            likes: prefs.likes || [],
            dislikes: prefs.dislikes || [],
            diets: prefs.diets || [],
            allergens: prefs.allergens || [],
            favorites: prefs.favorites || [],
            kiddieMeal: !!prefs.kiddieMeal,
          };
        }
      } catch (e) {
        console.error("chat_preferences_fetch_error:", e);
        // fail-soft: just don't send prefs, but still answer
      }
    }

    // 🧠 Build system messages, including preferences context if available
    const systemMessages = [
      {
        role: "system",
        content:
          "You are Pick-A-Plate, a friendly food recommender in the Philippines. Include Filipino and non-Filipino cuisines. Be concise and track context (e.g., 'the second one'). Always prioritize safety and avoid allergens.",
      },
    ];

    if (prefsForPrompt) {
      systemMessages.push({
        role: "system",
        content:
          "Here are the user's saved food preferences in JSON format. " +
          "Always respect allergens and dislikes. Prefer likes and diets when suggesting meals:\n" +
          JSON.stringify(prefsForPrompt),
      });
    } else {
      systemMessages.push({
        role: "system",
        content:
          "No saved preferences are available for this user. Ask gentle follow-up questions about their likes, dislikes, allergies, and diet if needed.",
      });
    }

    const input = [
      ...systemMessages,
      ...cleanHistory,
      { role: "user", content: userMessage },
    ];

    // Call OpenAI
    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input,
      max_output_tokens: 300,
    });

    const reply = (r?.output_text || "").trim();

    // Create or reuse chatId
    const chatId =
      req.body?.chatId && ObjectId.isValid(req.body.chatId)
        ? new ObjectId(req.body.chatId)
        : new ObjectId();

    // ⚙️ Upsert chat — remove messages from $setOnInsert to avoid conflicts
    await chats.updateOne(
      { _id: chatId, ...owner },
      {
        $setOnInsert: {
          _id: chatId,
          userId: owner.userId || null,
          sessionId: owner.sessionId || null,
          title:
            cleanHistory[0]?.content?.slice(0, 60) ||
            userMessage.slice(0, 100) ||
            "New Chat",
          archived: false,
          createdAt: new Date(),
        },
        $push: {
          messages: {
            $each: [
              { role: "user", content: userMessage, ts: new Date() },
              { role: "assistant", content: reply, ts: new Date() },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    return res.json({ reply, chatId: chatId.toString() });
  } catch (err) {
    console.error("chat_error:", err?.message || err);
    if (String(err?.message || "").includes("429")) {
      return res.status(429).json({ error: "quota_or_rate_limit" });
    }
    return res.status(500).json({ error: "chat_failed" });
  }
});

/**
 * GET /api/chats → list chats for user or session
 */
router.get("/chats", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const chats = db.collection("chats");

    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });

    const list = await chats
      .find({ ...ownerInfo.owner, archived: false })
      .project({ messages: 0 })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json(list);
  } catch (e) {
    console.error("list_chats_error:", e);
    res.status(500).json({ error: "list_failed" });
  }
});

/**
 * GET /api/chats/:id → single chat with messages
 */
router.get("/chats/:id", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const chats = db.collection("chats");

    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });

    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid_id" });

    const chat = await chats.findOne({
      _id: new ObjectId(id),
      ...ownerInfo.owner,
    });

    if (!chat) return res.status(404).json({ error: "not_found" });
    res.json(chat);
  } catch (e) {
    console.error("get_chat_error:", e);
    res.status(500).json({ error: "get_failed" });
  }
});

// DELETE /api/chats/:id  → archive a chat you own
router.delete("/chats/:id", async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: "db_not_initialized" });
    const chats = db.collection("chats");

    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });

    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "invalid_id" });

    // Soft delete by archiving (so lists that filter archived:false won't return it)
    const r = await chats.updateOne(
      { _id: new ObjectId(id), ...ownerInfo.owner },
      { $set: { archived: true, updatedAt: new Date() } }
    );

    if (r.matchedCount === 0) {
      return res.status(404).json({ error: "not_found_or_not_owner" });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("delete_chat_error:", e);
    res.status(500).json({ error: "delete_failed" });
  }
});

module.exports = router;
