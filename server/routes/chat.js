// server/routes/chat.js
const express = require("express");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const router = express.Router();
const openai = require("../openaiClient");

// Unified preferences + food history models
const UserPreferences = require("../models/UserPreferences");
const FoodHistory = require("../models/FoodHistory");
// ---------------------
// Fallback Recommender Helpers
// ---------------------
const fs = require("fs");
const path = require("path");

// Mood CSV loader (MOOD-FOOD.csv in /server/assets)
let moodCSV = [];
try {
  const csvPath = path.join(__dirname, "..", "assets", "MOOD-FOOD.csv");
  const raw = fs.readFileSync(csvPath, "utf8").split("\n").slice(1);
  moodCSV = raw
    .map((line) => line.trim())
    .filter(Boolean)
    .map((r) => {
      const [mood, food] = r.split(",");
      return { mood: mood?.trim(), food: food?.trim() };
    });
  // console.log("Loaded mood CSV rows:", moodCSV.length);
} catch (e) {
  // console.error("CSV failed to load:", e.message || e);
}

// Static fallbacks per preference type
const CUISINE_FALLBACKS = {
  filipino: [
    "Chicken Inasal",
    "Pork Binagoongan",
    "Beef Kare-Kare",
    "Laing",
    "Tortang Talong",
    "Tinolang Manok",
    "Adobong Kangkong",
  ],
  japanese: [
    "Chicken Teriyaki Don",
    "Vegetable Tempura",
    "Beef Gyudon",
    "Katsu Curry",
    "Shoyu Ramen",
    "Salmon Onigiri",
    "Yakisoba",
  ],
  italian: [
    "Creamy Pesto Pasta",
    "Four Cheese Pasta",
    "Tomato Basil Penne",
    "Chicken Alfredo",
    "Margherita Pizza",
    "Mushroom Risotto",
    "Lasagna al Forno",
  ],
  korean: [
    "Beef Bulgogi Rice Bowl",
    "Kimchi Fried Rice",
    "Chicken Bibimbap",
    "Seafood Pancake",
    "Japchae",
    "Soy Garlic Korean Fried Chicken",
  ],
  chinese: [
    "Beef Hofan",
    "Stir-Fried Vegetables with Garlic",
    "Sweet and Sour Chicken",
    "Yang Chow Fried Rice",
    "Mapo Tofu (mild)",
    "Chicken and Broccoli Stir Fry",
  ],
  american: [
    "Classic Cheeseburger",
    "BBQ Chicken Platter",
    "Grilled Salmon with Vegetables",
    "Mac & Cheese",
    "Buffalo Chicken Wrap",
    "Steak and Mashed Potatoes",
  ],
  thai: [
    "Pad Thai",
    "Green Chicken Curry",
    "Thai Basil Chicken",
    "Tom Yum (mild)",
    "Pineapple Fried Rice",
  ],
  mexican: [
    "Beef Burrito",
    "Chicken Quesadilla",
    "Vegetarian Tacos",
    "Carnitas Rice Bowl",
    "Nachos Supreme",
    "Chicken Fajitas",
  ],
  "middle-eastern": [
    "Chicken Shawarma Rice",
    "Beef Kebab Platter",
    "Falafel Bowl",
    "Hummus with Pita",
    "Lamb Over Rice",
    "Tabbouleh with Chicken",
  ],
};

const DISLIKE_REPLACEMENTS = {
  seafood: [
    "Garlic butter chicken",
    "Beef stir-fry with vegetables",
    "Crispy fried chicken",
    "Grilled pork chops",
    "Creamy mushroom pasta",
  ],
  spicy: [
    "Sweet soy chicken",
    "Garlic parmesan chicken",
    "Creamy carbonara",
    "Beef teriyaki",
    "Chicken alfredo pasta",
  ],
  vegetables: [
    "Chicken katsu curry",
    "Beef tapa with garlic rice",
    "Chicken teriyaki",
    "Pork adobo flakes",
    "Chicken karaage",
  ],
  meat: [
    "Mushroom risotto",
    "Vegetable yakisoba",
    "Four cheese pizza",
    "Pesto pasta",
    "Tofu stir-fry bowl",
  ],
  dairy: [
    "Soy garlic chicken",
    "Beef bulgogi",
    "Garlic rice with grilled chicken",
    "Teriyaki tofu bowl",
    "Vegetable fried rice",
  ],
  gluten: [
    "Steamed rice with grilled chicken",
    "Garlic shrimp (no breading)",
    "Meat and vegetable keto bowl",
    "Beef with mushrooms",
    "Tofu veggie bowl",
  ],
  nuts: [
    "Beef kare-kare (no peanuts)",
    "Chicken teriyaki",
    "Fried chicken",
    "Pork sinigang",
    "Garlic butter chicken",
  ],
  eggs: [
    "Beef stir fry",
    "Chicken katsu (no mayo)",
    "Soy garlic chicken",
    "Tomato basil pasta",
    "Garlic rice with grilled meat",
  ],
};

const ALLERGEN_SAFE = {
  peanuts: [
    "Grilled chicken with rice",
    "Tomato basil pasta",
    "Cheese pizza",
    "Beef tapa",
  ],
  "tree-nuts": [
    "Garlic rice with fried chicken",
    "Chicken shawarma",
    "Hamburger steak",
    "Sinigang",
  ],
  eggs: [
    "Chicken teriyaki",
    "Beef rice bowl",
    "Vegetable stir fry",
    "Sushi (no mayo, no tamago)",
  ],
  dairy: [
    "Beef bulgogi",
    "Teriyaki chicken bowl",
    "Pork adobo",
    "Ramen without cheese/milk",
  ],
  gluten: [
    "Grilled chicken with rice",
    "Stir fried tofu and vegetables",
    "Chicken skewers",
    "Salmon with garlic",
  ],
  soy: [
    "Herb grilled chicken",
    "Garlic shrimp rice",
    "Pork sinigang",
    "Roast beef",
  ],
  fish: [
    "Garlic butter chicken",
    "Korean beef rice bowl",
    "Tomato pasta",
    "Fried chicken chop",
  ],
  shellfish: [
    "Beef curry",
    "Chicken karaage",
    "Bulgogi",
    "Cheese quesadilla",
  ],
  sesame: [
    "Grilled chicken salad (simple dressing)",
    "Beef stew",
    "Herb roasted chicken",
    "Sinigang",
  ],
  corn: [
    "Beef adobo",
    "Chicken barbecue",
    "Pork chops",
    "Garlic rice meals",
  ],
  sulfites: [
    "Grilled chicken",
    "Simple seasoned beef tapa",
    "Mushroom pasta",
    "Vegetable fried rice",
  ],
  mustard: [
    "Soy-garlic chicken",
    "Classic adobo",
    "Plain ramen (no toppings)",
    "Chicken fried rice",
  ],
};

const DIET_FALLBACKS = {
  omnivore: [
    "Beef tapa",
    "Chicken inasal",
    "Garlic butter shrimp",
    "Chicken teriyaki",
  ],
  vegetarian: [
    "Vegetable kare-kare",
    "Mushroom pasta",
    "Vegetable fried rice",
    "Tofu stir-fry",
  ],
  vegan: [
    "Vegan tofu sisig",
    "Vegan stir fry noodles",
    "Vegetable curry",
    "Tomato basil pasta (no cheese)",
  ],
  pescetarian: [
    "Garlic butter salmon",
    "Tuna poke bowl",
    "Shrimp garlic rice",
    "Fish teriyaki",
  ],
  keto: [
    "Grilled chicken with broccoli",
    "Beef tapa without rice",
    "Creamy garlic salmon",
    "Egg and vegetable stir fry",
  ],
  "low-carb": [
    "Chicken salad bowl",
    "Beef bowl without rice",
    "Boiled eggs with vegetables",
    "Roasted chicken plate",
  ],
  halal: [
    "Chicken shawarma bowl",
    "Beef kebab plate",
    "Hummus with grilled chicken",
    "Chicken biryani",
  ],
  kosher: [
    "Grilled salmon plate",
    "Shakshuka",
    "Vegetable couscous",
    "Chicken schnitzel (no cheese)",
  ],
  "gluten-free": [
    "Rice meals",
    "Stir fried vegetables",
    "Grilled chicken plate",
    "Garlic shrimp with rice",
  ],
};

const FAVORITE_EXPANDED = {
  steak: [
    "Garlic ribeye with rice",
    "Beef steak bowl",
    "Mushroom steak plate",
  ],
  sushi: [
    "California maki",
    "Salmon sushi",
    "Tuna poke bowl",
  ],
  pizza: [
    "Margherita pizza",
    "Pepperoni pizza",
    "Truffle mushroom pizza",
  ],
  burger: [
    "Classic cheeseburger",
    "Double cheeseburger",
    "Mushroom Swiss burger",
  ],
  pasta: [
    "Creamy carbonara",
    "Tomato basil pasta",
    "Chicken alfredo",
  ],
  ramen: [
    "Shoyu ramen",
    "Miso ramen",
    "Tonkotsu ramen",
  ],
  tacos: [
    "Beef soft tacos",
    "Chicken quesadilla",
    "Pork carnitas bowl",
  ],
  desserts: [
    "Matcha cheesecake",
    "Chocolate lava cake",
    "Mango sticky rice",
  ],
  "milk tea": [
    "Pearl milk tea",
    "Wintermelon milk tea",
    "Matcha latte",
  ],
  coffee: [
    "Iced americano",
    "Spanish latte",
    "Vanilla sweet cream cold brew",
  ],
  fries: [
    "Garlic parmesan fries",
    "Truffle fries",
    "Cheese fries",
  ],
  chicken: [
    "Soy garlic chicken",
    "Crispy fried chicken",
    "Chicken teriyaki",
  ],
  salad: [
    "Caesar salad",
    "Garden salad",
    "Chicken salad",
  ],
  soup: [
    "Tomato soup",
    "Chicken noodle soup",
    "Clam chowder",
  ],
  donut: [
    "Glazed donut",
    "Chocolate donut",
    "Boston cream donut",
  ],
  brunch: [
    "Avocado toast",
    "Chicken and waffles",
    "Pancakes with syrup",
  ],
};

// Fisher-Yates shuffle (in-place)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Build a single fallback response text
function buildFallbackRecommendation({ prefs, kidPrefs, history, mood }) {
  const likes = Array.isArray(prefs?.likes) ? prefs.likes : [];
  const diets = Array.isArray(prefs?.diets) ? prefs.diets : [];
  const favorites = Array.isArray(prefs?.favorites) ? prefs.favorites : [];
  const dislikes = Array.isArray(prefs?.dislikes)
    ? prefs.dislikes.map((x) => x.toLowerCase().trim())
    : [];
  const allergens = Array.isArray(prefs?.allergens)
    ? prefs.allergens.map((x) => x.toLowerCase().trim())
    : [];
  const recent = Array.isArray(history) ? history : [];

  const avoidNames = new Set(
    recent
      .map((h) => (h.label || "").toLowerCase().trim())
      .filter(Boolean)
  );

  const isSafeName = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    if (avoidNames.has(lower)) return false;
    if (dislikes.some((d) => lower.includes(d))) return false;
    if (allergens.some((a) => lower.includes(a))) return false;
    return true;
  };

  const candidates = [];

  const addCandidate = (name, reason, sourceLabel) => {
    if (!isSafeName(name)) return;
    const key = name.toLowerCase();
    // avoid duplicates
    if (candidates.some((c) => c.key === key)) return;
    candidates.push({ key, name, reason, sourceLabel });
  };

  // 1) Mood-based from CSV
  if (mood && moodCSV.length) {
    const moodLabel = String(mood).trim();
    const moodFoods = moodCSV
      .filter(
        (m) =>
          m.mood &&
          m.food &&
          m.mood.toLowerCase() === moodLabel.toLowerCase()
      )
      .map((m) => m.food);
    moodFoods.slice(0, 8).forEach((food) => {
      addCandidate(
        food,
        "Picked from mood-based suggestions similar to how you feel.",
        "Based on your mood"
      );
    });
  }

  // 2) Cuisine-based from likes if they match known cuisine keys
  likes.forEach((likeRaw) => {
    const like = String(likeRaw || "").toLowerCase().trim();
    if (CUISINE_FALLBACKS[like]) {
      CUISINE_FALLBACKS[like].forEach((dish) => {
        addCandidate(
          dish,
          `Because you enjoy ${like} cuisine.`,
          "Based on your favorite cuisines"
        );
      });
    }
  });

  // 3) Dislike-based: replacement dishes for dislikes (suggesting alternatives)
  dislikes.forEach((d) => {
    if (DISLIKE_REPLACEMENTS[d]) {
      DISLIKE_REPLACEMENTS[d].forEach((dish) => {
        addCandidate(
          dish,
          `Avoids your dislike for ${d}, but keeps the meal satisfying.`,
          "Safe picks avoiding dislikes"
        );
      });
    }
  });

  // 4) Allergen-safe sets
  allergens.forEach((a) => {
    if (ALLERGEN_SAFE[a]) {
      ALLERGEN_SAFE[a].forEach((dish) => {
        addCandidate(
          dish,
          `Chosen to stay away from your ${a} allergy.`,
          "Allergen-safe ideas"
        );
      });
    }
  });

  // 5) Diet-based
  diets.forEach((dietRaw) => {
    const key = String(dietRaw || "").toLowerCase().trim();
    if (DIET_FALLBACKS[key]) {
      DIET_FALLBACKS[key].forEach((dish) => {
        addCandidate(
          dish,
          `Matches your ${dietRaw} diet preference.`,
          "Based on your diet"
        );
      });
    }
  });

  // 6) Favorites boosted
  favorites.forEach((favRaw) => {
    const key = String(favRaw || "").toLowerCase().trim();
    if (FAVORITE_EXPANDED[key]) {
      FAVORITE_EXPANDED[key].forEach((dish) => {
        addCandidate(
          dish,
          `Because you often enjoy ${favRaw}.`,
          "Inspired by your favorites"
        );
      });
    }
  });

  // If still too few, lightly use some cuisine defaults as generic variety
  if (candidates.length < 5) {
    Object.keys(CUISINE_FALLBACKS).forEach((cui) => {
      CUISINE_FALLBACKS[cui].forEach((dish) => {
        addCandidate(
          dish,
          `A popular ${cui} dish many people enjoy.`,
          "Comfort picks"
        );
      });
    });
  }

  if (!candidates.length) {
    return (
      "Our chatbot seems to be down right now, so I’m using some safe defaults instead.\n\n" +
      "1. Chicken Inasal: Simple, flavorful grilled chicken with rice.\n" +
      "2. Beef Tapa: Savory beef with garlic rice.\n" +
      "3. Vegetable Fried Rice: Light and flexible.\n" +
      "4. Chicken Teriyaki Bowl: Sweet-savory and filling.\n" +
      "5. Tomato Basil Pasta: Comforting and easy to enjoy."
    );
  }

  // Shuffle and pick up to 10 (5 + another random 5)
  shuffleArray(candidates);
  const picked = candidates.slice(0, 10);
  const first5 = picked.slice(0, 5);
  const next5 = picked.slice(5, 10);

  let text =
    "Our chatbot seems to be down right now, here are suggestions based on your saved preferences, dislikes, allergies, mood, and previous choices:\n\n";

  let idx = 1;

  if (first5.length) {
    text += "Top ideas for now:\n";
    first5.forEach((c) => {
      text += `${idx}. ${c.name}: ${c.reason}\n`;
      idx += 1;
    });
    text += "\n";
  }

  if (next5.length) {
    text += "More ideas you might also like:\n";
    next5.forEach((c) => {
      text += `${idx}. ${c.name}: ${c.reason}\n`;
      idx += 1;
    });
  }

  return text.trim();
}
// ---------------------

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
        "From the conversation, detect explicit, stable user food preferences. Never treat dish selections (e.g., 'I'm choosing this') as likes. Only treat explicit statements of preference like 'I like ____'. " +
        "Never use the I'm Choosing This button to add to preferences" +
        "Do not assume, infer , or guess. When a user says Recommend me ____ it does not mean they automatically like it. It's just a mood" +
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
    // console.error("pref_extraction_openai_error:", e);
    return;
  }

  let extracted;
  try {
    extracted = JSON.parse(extractionReply || "{}");
  } catch (e) {
    // console.error("pref_extraction_parse_error:", e, extractionReply);
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
    // console.error("pref_extraction_save_error:", e);
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

    const KidPreferences = require("../models/KidPreferences");

    let kidPrefsForPrompt = [];
    if (owner.userId) {
      try {
        kidPrefsForPrompt = await KidPreferences.find({ userId: owner.userId }).lean();
      } catch (e) {
        // console.error("kid_prefs_fetch_error:", e);
      }
    }

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
        // console.error("chat_preferences_fetch_error:", e);
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
      // console.error("food_history_fetch_error:", e);
      // fail-soft
    }

    // 🕒 Time-of-day detection
  const rawClientHour = req.body?.localHour;

  const hour =
    typeof rawClientHour === "number" &&
    Number.isFinite(rawClientHour) &&
    rawClientHour >= 0 &&
    rawClientHour < 24
      ? rawClientHour
      : new Date().getHours();
    let mealContext = "any meal";

    if (hour >= 5 && hour < 11) mealContext = "breakfast";
    else if (hour >= 11 && hour < 15) mealContext = "lunch";
    else if (hour >= 17 && hour < 22) mealContext = "dinner";
    else mealContext = "late-night snack";



    // 🧠 Build system messages (core + mood + prefs + history)
    const systemMessages = [
      {
        role: "system",
        content:
          "You are Pick-A-Plate, a STRICTLY friendly food-only recommender in the Philippines. Include Filipino and non-Filipino cuisines. Be concise and track context (e.g., 'the second one'). Always prioritize safety and avoid allergens. Ignore or Decline non-food related requests.",
      },
    ];

  systemMessages.push({
    role: "system",
    content: `The current time suggests the user is likely preparing for ${mealContext}. Prioritize foods appropriate for ${mealContext}.`
  });


    systemMessages.push({
      role: "system",
      content:
        "IMPORTANT — When recommending food, ALWAYS return them in a clear numbered list. Use this exact structure:\n" +
        "1. Dish Name: Short description.\n" +
        "2. Dish Name: Short description.\n" +
        "3. Dish Name: Short description.\n\n" +
        "Never hide food suggestions inside paragraphs. Always use a numbered list so the client can reliably extract each dish option. Include the full description for every dish.",
    });


        systemMessages.push({
      role: "system",
      content:
        'When recommending RESTAURANTS (not dishes), ALWAYS clearly include one of these words in the restaurant description: "restaurant", "diner", "cafe", "bistro", or "spot".\n' +
        "This helps the user easily identify that it is a place to eat at, not just a dish name." +
        "Make sure that all of the restaurants are located in the Philippines.",
    });

    // Note: Restaurant Locator buttons are shown ONLY when user clicks "I'm choosing this!" on a restaurant
    // The button is added automatically in /api/history endpoint, not by the AI

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

        if (kidPrefsForPrompt.length > 0) {
      // Build grammatically correct question based on number of kids
      let kidsQuestion;
      if (kidPrefsForPrompt.length === 1) {
        const kidName = kidPrefsForPrompt[0].name || 'your child';
        kidsQuestion = `Is ${kidName} eating with you?`;
      } else {
        const kidNames = kidPrefsForPrompt.map(k => k.name).filter(Boolean);
        if (kidNames.length > 0) {
          kidsQuestion = `Are any of your kids (${kidNames.join(', ')}) eating with you? Which ones?`;
        } else {
          kidsQuestion = `Are any of your kids eating with you? Which ones?`;
        }
      }

      systemMessages.push({
        role: "system",
        content:
          "The user has kids with the following preferences: " +
          JSON.stringify(kidPrefsForPrompt) +
          `. Before giving recommendations, always ask: '${kidsQuestion}' ` +
          "If kids are included, adjust food suggestions to respect their likes/dislikes/allergies."
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

    // 🧠 OpenAI Call with Fallback
    let reply = "";
    let openaiFailed = false;

    try {
      const r = await openai.responses.create({
        model: "gpt-4o-mini",
        input,
        max_output_tokens: 300,
      });
      reply = (r?.output_text || "").trim();
    } catch (err) {
      // console.error("OpenAI DOWN → using fallback mode", err);
      openaiFailed = true;
    }

        if (openaiFailed) {
      reply = buildFallbackRecommendation({
        prefs: prefsForPrompt,
        kidPrefs: kidPrefsForPrompt,
        history: recentHistory,
        mood: mood || null
      });
    }


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
      // console.error("pref_extraction_wrapper_error:", e);
    }


    return res.json({
      reply,
      chatId: chatId.toString(),
      learned: learnedSomething,  // 👈 tell the client, don't change the text
    });
  } catch (err) {
    // console.error("chat_error:", err?.message || err);
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
        // Detect if the chosen item is a restaurant (not a dish)
        const labelLower = label.toLowerCase();
        const restaurantKeywords = [
          // Generic terms that indicate a restaurant/establishment
          'restaurant', 'resto', 'cafe', 'diner', 'bistro', 'spot', 'grill',
          'dampa', 'eatery', 'kitchen', 'bar', 'pub', 'tavern', 'house',
          'seaside', 'marketplace', 'food park', 'food court', 'company',
          'group', 'place', 'joint', 'shack', 'hut', 'stop', 'station',
          'alley', 'corner', 'express', 'central', 'hub', 'lounge',
          // Fast food chains
          'jollibee', 'mcdonalds', "mcdonald's", 'kfc', 'chowking', 'mang inasal',
          'greenwich', 'shakey', 'pizza hut', 'burger king', 'wendy', 'subway',
          'sbarro', 'yellow cab', 'army navy', 'max', 'bonchon', 'potato corner',
          'wingstop', 'buffalo wild', 'popeyes', 'domino', 'papa john',
          // Coffee & bakery
          'starbucks', 'tim hortons', 'dunkin', 'krispy kreme', 'j.co',
          'goldilocks', 'red ribbon', 'tous les jours', 'mary grace', 'cravings',
          // Japanese restaurants
          'yabu', 'ramen nagi', 'marugame', 'tokyo tokyo', 'teriyaki boy',
          'ippudo', 'mendokoro', 'botejyu', 'genki sushi', 'sushi nori',
          // Korean restaurants
          'samgyupsalamat', 'kbbq', 'korean bbq', 'sibyullee', 'soban', 'romantic baboy',
          // Buffets
          'vikings', 'sambo kojin', 'yakimix', 'heat', 'buffet', 'unlimited', 'buffet 101',
          // Other popular chains
          'texas roadhouse', 'italianni', 'tgi friday', "chili's", 'outback',
          'kenny rogers', 'kuya j', 'gerry', 'mesa', 'manam', 'locavore',
          'conti', 'pancake house', 'ihop', 'denny', 'mango tree', 'bacolod'
        ];

        const isRestaurant = restaurantKeywords.some(keyword => labelLower.includes(keyword)) ||
                            type === 'restaurant';

        // Debug logging
        console.log('[HISTORY] Label:', label, '| LabelLower:', labelLower, '| Type:', type, '| IsRestaurant:', isRestaurant);

        let followup;
        if (isRestaurant) {
          // Restaurant-specific follow-up with locator marker
          followup =
            `Great choice! To find the nearest ${label}, you can use our Restaurant Locator feature! ` +
            `Just click the 'Find Near Me' button below and I'll help you locate ${label} branches in your area. ` +
            `[RESTAURANT_LOCATOR:${label}]`;
        } else {
          // Regular dish follow-up
          followup =
            `Yum, great choice! Since you picked "${label}", ` +
            "do you want me to suggest side dishes, drinks, or desserts that go well with it? " +
            "You can also use the buttons below if you'd like a recipe or restaurants for this.";
        }

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
        // console.error("history_chat_update_error:", err);
      }
    }

    return res.json({ success: true, historyId: doc._id.toString() });
  } catch (e) {
    // console.error("save_history_error:", e);
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
    // console.error("list_chats_error:", e);
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
    // console.error("get_chat_error:", e);
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
    // console.error("delete_chat_error:", e);
    res.status(500).json({ error: "delete_failed" });
  }
});

module.exports = router;
