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

async function extractAndSavePreferences({ owner, conversation }) {
  // Only for logged-in users
  if (!owner.userId) return;

  // Turn convo into a plain text transcript
  const transcript = conversation
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const extractionInput = [
    {
      role: "system",
      content:
        "You are an information extraction assistant for a food chatbot. " +
        "From the conversation, detect explicit, stable user food preferences. " +
        "Only capture statements where the user clearly says they like/dislike something, " +
        "have an allergy, follow or stop following a diet, or call something a favorite, " +
        "or mentions they want kiddie meals. " +
        "If the user clearly says they NO LONGER like/dislike/follow something (e.g. 'I'm not vegetarian anymore'), " +
        "put that item into the appropriate *_remove list. " +
        "Return ONLY valid JSON, no explanation.",
    },
    {
      role: "user",
      content:
        "Conversation:\n" +
        transcript +
        "\n\nExtract NEW changes in this exact JSON shape:\n" +
        `{
  "likes_add": ["string"],
  "likes_remove": ["string"],
  "dislikes_add": ["string"],
  "dislikes_remove": ["string"],
  "diets_add": ["string"],
  "diets_remove": ["string"],
  "allergens_add": ["string"],
  "allergens_remove": ["string"],
  "favorites_add": ["string"],
  "favorites_remove": ["string"],
  "kiddieMeal": true | false | null
}\n\n` +
        "If you are not sure about a field, use an empty array for the lists and null for kiddieMeal.",
    },
  ];

  let extractionReply;
  try {
    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input: extractionInput,
      max_output_tokens: 200,
    });
    extractionReply = (r?.output_text || "").trim();
  } catch (e) {
    console.error("pref_extraction_openai_error:", e);
    return;
  }

  let extracted;
  try {
    extracted = JSON.parse(extractionReply || "{}");
  } catch (e) {
    console.error("pref_extraction_parse_error:", e, extractionReply);
    return;
  }

  const normalizeArray = (arr) =>
    Array.isArray(arr)
      ? Array.from(
          new Set(
            arr
              .map((v) => String(v || "").trim())
              .filter(Boolean)
          )
        )
      : [];

  // Backwards-compatible: if the model still returns old keys, treat them as *_add
  const likesAdd = normalizeArray(extracted.likes_add || extracted.likes);
  const likesRemove = normalizeArray(extracted.likes_remove);

  const dislikesAdd = normalizeArray(extracted.dislikes_add || extracted.dislikes);
  const dislikesRemove = normalizeArray(extracted.dislikes_remove);

  const dietsAdd = normalizeArray(extracted.diets_add || extracted.diets);
  const dietsRemove = normalizeArray(extracted.diets_remove);

  const allergensAdd = normalizeArray(extracted.allergens_add || extracted.allergens);
  const allergensRemove = normalizeArray(extracted.allergens_remove);

  const favoritesAdd = normalizeArray(extracted.favorites_add || extracted.favorites);
  const favoritesRemove = normalizeArray(extracted.favorites_remove);

  const newKiddieMeal =
    typeof extracted.kiddieMeal === "boolean" ? extracted.kiddieMeal : null;

  if (
    !likesAdd.length &&
    !likesRemove.length &&
    !dislikesAdd.length &&
    !dislikesRemove.length &&
    !dietsAdd.length &&
    !dietsRemove.length &&
    !allergensAdd.length &&
    !allergensRemove.length &&
    !favoritesAdd.length &&
    !favoritesRemove.length &&
    newKiddieMeal === null
  ) {
    // Nothing to update
    return;
  }

  try {
    let prefs = await UserPreferences.findOne({ userId: owner.userId });
    if (!prefs) {
      prefs = new UserPreferences({ userId: owner.userId });
    }

    const mergeFieldAdd = (fieldName, additions) => {
      if (!additions.length) return;
      const existing = prefs[fieldName] || [];
      const existingLower = new Set(
        existing.map((v) => v.toLowerCase().trim())
      );
      additions.forEach((item) => {
        const key = item.toLowerCase().trim();
        if (!existingLower.has(key)) {
          existing.push(item);
          existingLower.add(key);
        }
      });
      prefs[fieldName] = existing;
    };

    const mergeFieldRemove = (fieldName, removals) => {
      if (!removals.length) return;
      const removeSet = new Set(
        removals.map((v) => v.toLowerCase().trim())
      );
      const existing = prefs[fieldName] || [];
      prefs[fieldName] = existing.filter(
        (v) => !removeSet.has(v.toLowerCase().trim())
      );
    };

    mergeFieldAdd("likes", likesAdd);
    mergeFieldRemove("likes", likesRemove);

    mergeFieldAdd("dislikes", dislikesAdd);
    mergeFieldRemove("dislikes", dislikesRemove);

    mergeFieldAdd("diets", dietsAdd);
    mergeFieldRemove("diets", dietsRemove);

    mergeFieldAdd("allergens", allergensAdd);
    mergeFieldRemove("allergens", allergensRemove);

    mergeFieldAdd("favorites", favoritesAdd);
    mergeFieldRemove("favorites", favoritesRemove);

    if (newKiddieMeal !== null) {
      prefs.kiddieMeal = newKiddieMeal;
    }

    await prefs.save();
  } catch (e) {
    console.error("pref_extraction_save_error:", e);
  }
}


/**
 * POST /api/chat
 * Body: { message, history?, chatId?, sessionId?, mood? }
 */
router.post("/chat", async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) return res.status(500).json({ error: "db_not_initialized" });

    const now = new Date(); // 👈 use one shared timestamp
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

    systemMessages.push({
      role: "system",
      content:
        "IMPORTANT — When recommending food, ALWAYS return them in a clear numbered list. Use this exact structure:\n" +
        "1. Dish Name: Short description.\n" +
        "2. Dish Name: Short description.\n" +
        "3. Dish Name: Short description.\n\n" +
        "Never hide food suggestions inside paragraphs. Always use a numbered list so the client can reliably extract each dish option. Include the full description for every dish.",
    });


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
              { role: "assistant", content: reply, ts:now, choiceLocked:false },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // ✅ Lock ALL previous assistant messages (so their "I'm choosing this!" never reactivates)
    await chats.updateMany(
      { _id: chatId, ...owner },
      {
        $set: { "messages.$[m].choiceLocked": true },
      },
      {
        arrayFilters: [
          {
            "m.role": "assistant",
            // lock anything older than this turn
            "m.ts": { $lt: now },
            "m.choiceLocked": { $ne: true },
          },
        ],
      }
    );


        // add here: extract preferences from this turn and save to UserPreferences
    let learnedSomething = false;

    try {
      const before = await UserPreferences.findOne({ userId: owner.userId }).lean();

      await extractAndSavePreferences({
        owner,
        conversation: [
          ...cleanHistory,
          { role: "user", content: userMessage },
          { role: "assistant", content: reply },
        ],
      });

      const after = await UserPreferences.findOne({ userId: owner.userId }).lean();

      // detect if anything changed
      if (before && after) {
        if (
          JSON.stringify(before.likes) !== JSON.stringify(after.likes) ||
          JSON.stringify(before.dislikes) !== JSON.stringify(after.dislikes) ||
          JSON.stringify(before.diets) !== JSON.stringify(after.diets) ||
          JSON.stringify(before.allergens) !== JSON.stringify(after.allergens) ||
          JSON.stringify(before.favorites) !== JSON.stringify(after.favorites) ||
          before.kiddieMeal !== after.kiddieMeal
        ) {
          learnedSomething = true;
        }
      }
    } catch (e) {
      console.error("pref_extraction_wrapper_error:", e);
    }


    return res.json({
      reply,
      chatId: chatId.toString(),
      learned: learnedSomething,  // 👈 tell the client, don't change the text
    });
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
 * - Also appends a follow-up assistant message to the chat
 *   and marks the chat as having a final choice.
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

    // 🔁 Also update the related chat:
    // - Mark that it has a final choice
    // - Append the follow-up assistant message
    if (chatIdRaw && ObjectId.isValid(chatIdRaw)) {
      try {
        const followup =
          `Yum, great choice! Since you picked "${label}", ` +
          "do you want me to suggest side dishes, drinks, or desserts that go well with it? " +
          "You can also use the buttons below if you’d like a recipe or restaurants for this.";

        await chats.updateOne(
          { _id: new ObjectId(chatIdRaw), ...owner },
          {
            $set: { hasFinalChoice: true, updatedAt: new Date() },
            $push: {
              messages: {
                role: "assistant",
                content: followup,
                ts: new Date(),
              },
            },
          }
        );
      } catch (err) {
        console.error("history_chat_update_error:", err);
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
