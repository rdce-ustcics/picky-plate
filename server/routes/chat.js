// server/routes/chat.js
const express = require("express");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const router = express.Router();
const openai = require("../openaiClient");

// Unified preferences + food history models
const UserPreferences = require("../models/UserPreferences");
const FoodHistory = require("../models/FoodHistory");

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
 * Body: { message, history?, chatId?, sessionId?, mood? }
 */
router.post("/chat", async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: "db_not_initialized" });

    const chats = db.collection("chats");
    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });
    const { owner, sessionId } = ownerInfo;

    let userMessage = (req.body?.message || "").toString().trim();
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const mood = (req.body?.mood || "").toString().trim(); // optional emoji/text

    if (!userMessage) {
      return res.status(400).json({ error: "message_required" });
    }

    // Hard safety guard for message length
    const MAX_MESSAGE_LENGTH = 200;
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      userMessage = userMessage.slice(0, MAX_MESSAGE_LENGTH);
    }

    // 🔒 Guest limit: max 5 user messages total (across all chats for this session)
    if (!owner.userId && sessionId) {
      const used = await chats
        .aggregate([
          { $match: { sessionId, archived: false } },
          { $unwind: "$messages" },
          { $match: { "messages.role": "user" } },
          { $count: "total" },
        ])
        .toArray();

      const totalUserMessages = used[0]?.total || 0;
      if (totalUserMessages >= 5) {
        return res
          .status(403)
          .json({ error: "guest_limit_reached", remaining: 0 });
      }
    }

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
        // fail-soft
      }
    }

    // 🔁 Fetch recent Food History (last 7 days, up to 10 items)
    let recentHistory = [];
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
      if (owner.userId) {
        recentHistory = await FoodHistory.find({
          userId: owner.userId,
          decidedAt: { $gte: since },
        })
          .sort({ decidedAt: -1 })
          .limit(10)
          .lean();
      } else if (sessionId) {
        recentHistory = await FoodHistory.find({
          sessionId,
          decidedAt: { $gte: since },
        })
          .sort({ decidedAt: -1 })
          .limit(10)
          .lean();
      }
    } catch (e) {
      console.error("food_history_fetch_error:", e);
      // fail-soft
    }

    // 🧠 Build system messages (core + mood + prefs + history)
    const systemMessages = [
      {
        role: "system",
        content:
          "You are Pick-A-Plate, a friendly food recommender in the Philippines. Include Filipino and non-Filipino cuisines. Be concise and track context (e.g., 'the second one'). Always prioritize safety and avoid allergens.",
      },
    ];

    if (mood) {
      systemMessages.push({
        role: "system",
        content:
          `The user selected this mood indicator for the current conversation: ${mood}. ` +
          "Tailor your tone and recommendations to match this mood while staying clear and helpful.",
      });
    } else {
      systemMessages.push({
        role: "system",
        content:
          "No explicit mood emoji was selected. Infer the user's current mood with sentiment analysis from their recent messages (happy, stressed, sad, tired, excited, hungry, etc.) and gently mirror that mood in your tone.",
      });
    }

    if (prefsForPrompt) {
      systemMessages.push({
        role: "system",
        content:
          "Here are the user's saved food preferences in JSON format. Always respect allergens and dislikes. Prefer likes and diets when suggesting meals:\n" +
          JSON.stringify(prefsForPrompt),
      });
    } else {
      systemMessages.push({
        role: "system",
        content:
          "No saved preferences are available for this user. Ask gentle follow-up questions about their likes, dislikes, allergies, and diet if needed.",
      });
    }

    if (recentHistory && recentHistory.length) {
      const simpleHistory = recentHistory.map((h) => ({
        label: h.label,
        type: h.type || "generic",
        decidedAt: h.decidedAt,
      }));

      systemMessages.push({
        role: "system",
        content:
          "Here is the user's recent food decision history in JSON (last 7 days). " +
          "Avoid recommending the exact same dishes again if they appear here and are very recent. " +
          "However, you may suggest similar or related dishes, flavors, or restaurants instead:\n" +
          JSON.stringify(simpleHistory),
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

    // ⚙️ Upsert chat
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
          closed: false,
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
 * POST /api/history
 * Body: { label, type?, chatId?, mood? }
 * - Saves a chosen recommendation into FoodHistory.
 * - Also marks the given chat as closed so it's locked even after refresh.
 */
router.post("/history", async (req, res) => {
  try {
    const ownerInfo = getOwner(req);
    if (!ownerInfo) return res.status(400).json({ error: "missing_owner" });
    const { owner, sessionId } = ownerInfo;

    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: "db_not_initialized" });
    const chats = db.collection("chats");

    const rawLabel = (req.body?.label || "").toString().trim();
    if (!rawLabel) {
      return res.status(400).json({ error: "label_required" });
    }

    const MAX_LABEL_LENGTH = 200;
    const label =
      rawLabel.length > MAX_LABEL_LENGTH
        ? rawLabel.slice(0, MAX_LABEL_LENGTH)
        : rawLabel;

    const type = (req.body?.type || "generic").toString().trim();
    const chatIdRaw = (req.body?.chatId || "").toString().trim();
    const mood = (req.body?.mood || "").toString().trim() || null;

    const doc = new FoodHistory({
      userId: owner.userId || null,
      sessionId: sessionId || owner.sessionId || null,
      label,
      type: ["recipe", "restaurant", "generic"].includes(type)
        ? type
        : "generic",
      sourceChatId: chatIdRaw || null,
      mood,
      decidedAt: new Date(),
    });

    await doc.save();

    // 🔒 Also mark the chat as closed so it's locked even after refresh
    if (chatIdRaw && ObjectId.isValid(chatIdRaw)) {
      try {
        await chats.updateOne(
          { _id: new ObjectId(chatIdRaw), ...owner },
          { $set: { closed: true, updatedAt: new Date() } }
        );
      } catch (e) {
        console.error("history_close_chat_error:", e);
      }
    }

    return res.json({ success: true, historyId: doc._id.toString() });
  } catch (e) {
    console.error("save_history_error:", e);
    return res.status(500).json({ error: "history_save_failed" });
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

/**
 * DELETE /api/chats/:id  → archive a chat you own
 */
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

    // Soft delete by archiving
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
