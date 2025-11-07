// server/routes/ai.js
const express = require("express");
const router = express.Router();
const openai = require("../openaiClient"); // your { OpenAI } client
const { protect } = require("../middleware/auth");
const MealPlan = require("../models/MealPlan");

/* ───────────── utils ───────────── */
function pad2(n){ return String(n).padStart(2,"0"); }
function ymdPad(y,m1,d){ return `${y}-${pad2(m1)}-${pad2(d)}`; }
function ymdFromDate(dt){ return ymdPad(dt.getFullYear(), dt.getMonth()+1, dt.getDate()); }
function sundayOf(d){ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-x.getDay()); return x; }
function saturdayOf(d){ const s=sundayOf(d); const e=new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }

const SLOT_ORDER = { breakfast:0, lunch:1, dinner:2, other:3 };
function uniqueByName(arr){
  const seen = new Set();
  return (arr||[]).filter(x=>{
    const k = String(x?.name||"").toLowerCase().trim();
    if(!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function titleCase(s=""){
  return s
    .toLowerCase()
    .split(/([\s-]+)/)                 // keep separators
    .map(part => /[\s-]+/.test(part) ? part : (part.charAt(0).toUpperCase()+part.slice(1)))
    .join("");
}

/* ───────────── RANDOM fallback (only when explicitly requested) ───────────── */
const POOL = {
  breakfast: [
    "Greek Yogurt Parfait","Avocado Toast","Tapsilog","Japanese Tamago Sando",
    "French Omelette","Arepa con Queso","Masala Upma","Congee with Scallions",
    "Bagel & Cream Cheese","Oatmeal with Banana","Huevos Rancheros","Smoked Salmon Bagel",
    "Ube Pancakes","Shakshuka","Chia Pudding"
  ],
  lunch: [
    "Chicken Adobo with Rice","Bibimbap Bowl","Falafel Wrap","Tuna Sandwich",
    "Margherita Pizza Slice","Pork Menudo with Rice","Thai Basil Chicken with Rice",
    "Mediterranean Grain Bowl","Vegetable Katsu Curry","Chicken Caesar Salad",
    "Burrito Bowl","Hummus & Pita Plate","Beef Gyro","Sushi Bento","Tom Yum Noodle Soup"
  ],
  dinner: [
    "Penne Arrabbiata","Beef Nilaga with Rice","Teriyaki Salmon with Rice",
    "Vegetable Stir-fry with Tofu","Butter Chicken with Naan","Shrimp Pad Thai",
    "Ratatouille with Couscous","Beef Tacos","Chicken Tinola with Rice","Soba Noodles & Vegetables",
    "Mushroom Risotto","Lamb Kofta with Rice","Pesto Chicken Pasta","Bibimbap (Dinner)",
    "Moroccan Chickpea Stew"
  ]
};
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pickUnique(pool, seen){
  const list = pool.filter(x => !seen.has(x.toLowerCase()));
  if (!list.length) return null;
  const pick = list[rand(0, list.length-1)];
  seen.add(pick.toLowerCase());
  return pick;
}
function randomPlan({ start, end, monthSeenSet }){
  const out = [];
  const rangeSeen = new Set();
  let d = new Date(start);
  while (d <= end) {
    const dateKey = ymdFromDate(d);
    const daySeen = new Set(); // avoid same-name same-day (paranoia)

    const b = pickUnique(POOL.breakfast, new Set([...monthSeenSet, ...rangeSeen, ...daySeen]));
    daySeen.add((b||"").toLowerCase());
    const l = pickUnique(POOL.lunch, new Set([...monthSeenSet, ...rangeSeen, ...daySeen]));
    daySeen.add((l||"").toLowerCase());
    const din = pickUnique(POOL.dinner, new Set([...monthSeenSet, ...rangeSeen, ...daySeen]));

    const dishes = [];
    if (b) dishes.push({ slot:"breakfast", name:titleCase(b), cost: rand(60,140), source:"ai" });
    if (l) dishes.push({ slot:"lunch",     name:titleCase(l), cost: rand(120,200), source:"ai" });
    if (din) dishes.push({ slot:"dinner",  name:titleCase(din), cost: rand(130,220), source:"ai" });

    // mark into month/range sets so rest of week stays unique
    dishes.forEach(dd => { monthSeenSet.add(dd.name.toLowerCase()); rangeSeen.add(dd.name.toLowerCase()); });

    out.push({ dateKey, dishes });
    d.setDate(d.getDate()+1);
  }
  return out;
}

/* ───────────── quick health check (optional) ───────────── */
router.get("/_ping", protect, async (req, res) => {
  try {
    const t0 = Date.now();
    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "Return only JSON: {\"ok\":true}" },
        { role: "user", content: "JSON only." }
      ],
      max_output_tokens: 20,
      temperature: 0,
    });
    const raw = (r?.output_text || "").trim();
    return res.json({ success:true, ms: Date.now()-t0, raw });
  } catch (e) {
    console.error("AI _ping error:", e?.status || "", e?.message || "", e?.response?.data || e);
    return res.status(500).json({ success:false, error:"cannot_contact_openai" });
  }
});

/* ───────────── main: suggest-week ───────────── */
/**
 * POST /api/ai/suggest-week
 * body: { startDate?: "YYYY-MM-DD", mode?: "remainder" | "week", fallback?: "random" }
 *
 * Behavior:
 * - Normal: call OpenAI and return its plan (no repeats this month).
 * - If OpenAI fails OR returns nothing:
 *      -> if fallback==="random": return a random unique plan
 *      -> else: { success:false, error:"ai_down", message:"Our AI seems to be down right now... We can still generate completely random recipes if you want?" }
 */
router.post("/suggest-week", protect, async (req, res) => {
  const wantRandomFallback = req.body?.fallback === "random";
  try {
    /* range */
    const today = new Date(); today.setHours(0,0,0,0);
    const startIso = req.body?.startDate || ymdFromDate(today);
    const mode = (req.body?.mode || "remainder").toLowerCase();

    let start = new Date(`${startIso}T00:00:00`);
    if (isNaN(start.getTime())) start = new Date(today);
    if (start < today) start = new Date(today);

    let end;
    if (mode === "week") {
      const sun = sundayOf(start);
      const sat = saturdayOf(start);
      const curSun = sundayOf(today), curSat = saturdayOf(today);
      if (sun.getTime() === curSun.getTime() && sat.getTime() === curSat.getTime()) {
        start = new Date(today); end = saturdayOf(today);
      } else {
        start = sun; end = sat;
      }
    } else {
      end = saturdayOf(start);
    }

    /* DB month seen (avoid repeats) */
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd   = new Date(start.getFullYear(), start.getMonth()+1, 0);
    const monthStartIso = ymdFromDate(monthStart);
    const monthEndIso   = ymdFromDate(monthEnd);

    const existing = await MealPlan.find({
      user: req.user.id,
      date: { $gte: monthStartIso, $lte: monthEndIso },
    }).select("date dishes").lean();

    const monthSeen = new Set();
    for (const doc of existing) {
      for (const d of (doc.dishes || [])) {
        const k = String(d.name||"").toLowerCase().trim();
        if (k) monthSeen.add(k);
      }
    }
    const avoidList = Array.from(monthSeen).slice(0, 800).join(", ");

    /* Call OpenAI */
    const systemPrompt = `You are a meal planning assistant. Output STRICT JSON only.
Return exactly 7 consecutive days starting from the provided date (inclusive).

For each day:
- "dateKey": "YYYY-M-D" (no leading zeros)
- "dishes": array of EXACTLY 3 objects IN THIS ORDER: breakfast, lunch, dinner.
  Each object must be: {"slot":"breakfast|lunch|dinner", "name": string, "cost": number, "source":"ai"}

Rules:
- Mixed global cuisines (not limited to any single country).
- Do NOT repeat a dish name within the 7-day window.
- Costs must be realistic, numeric Philippine pesos (no currency symbol).
- Output JSON ONLY with either an array of 7 days, or {"plan":[...7 days...]}.`;

    const userPrompt = `Start date: ${ymdFromDate(start)}
Avoid these dish names for this month: ${avoidList || "(none)"}`;

    let plan;
    try {
      const traceId = Math.random().toString(36).slice(2,8);
      console.log(`[AI ${traceId}] calling OpenAI… ${ymdFromDate(start)}..${ymdFromDate(end)} user=${req.user.id}`);
      const t0 = Date.now();
      const r = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        max_output_tokens: 900,
        temperature: 0.9,
      });
      const raw = (r?.output_text || "").trim();
      console.log(`[AI ${traceId}] done in ${Date.now()-t0}ms model=${r?.model} bytes=${Buffer.byteLength(raw,"utf8")} usage=${JSON.stringify(r?.usage||null)}`);

      if (!raw) plan = [];
      else {
        const cleaned = raw.replace(/^\s*```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"");
        let obj;
        try {
          obj = JSON.parse(cleaned);
        } catch {
          const m = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
          obj = m ? JSON.parse(m[1]) : null;
        }
        plan = Array.isArray(obj) ? obj
             : Array.isArray(obj?.plan) ? obj.plan
             : Array.isArray(obj?.days) ? obj.days
             : [];
      }
    } catch (err) {
      console.error("OpenAI error:", err?.status || "", err?.message || "", err?.response?.data || err);
      plan = []; // AI down (or failed)
    }

    /* If AI down/unusable -> either random (explicit) or friendly message */
    if (!plan.length) {
      if (wantRandomFallback) {
        const random = randomPlan({ start, end, monthSeenSet: monthSeen });
        return res.json({ success:true, plan: random, fallback:"random" });
      }
      return res.status(503).json({
        success:false,
        error:"ai_down",
        message:"Our AI seems to be down right now... We can still generate completely random recipes if you want?"
      });
    }

    /* Normalize, title-case, enforce month uniqueness & slot order */
    const normalized = plan.slice(0,7).map((day, i) => {
      const d = new Date(start); d.setDate(start.getDate()+i); d.setHours(0,0,0,0);
      const parts = String(day?.dateKey || `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`).split("-").map(Number);
      const y = parts[0] || d.getFullYear();
      const m1 = parts[1] || (d.getMonth()+1);
      const dd = parts[2] || d.getDate();
      const dateKey = ymdPad(y,m1,dd);

      const dishes = uniqueByName((Array.isArray(day?.dishes) ? day.dishes : []).map(x => ({
        slot: x?.slot || "other",
        name: titleCase(String(x?.name || "").trim()),
        cost: Number(x?.cost) || 0,
        source: "ai",
      })))
      .filter(d => !monthSeen.has(d.name.toLowerCase()))
      .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));

      // mark into monthSeen so later days avoid repeats
      for (const it of dishes) monthSeen.add(it.name.toLowerCase());

      return { dateKey, jsDate: new Date(`${dateKey}T00:00:00`), dishes };
    }).filter(p => p.jsDate >= start && p.jsDate <= end);

    if (!normalized.length) {
      // AI returned but filtered to empty -> offer random or friendly msg
      if (wantRandomFallback) {
        const random = randomPlan({ start, end, monthSeenSet: monthSeen });
        return res.json({ success:true, plan: random, fallback:"random" });
      }
      return res.status(503).json({
        success:false,
        error:"ai_down",
        message:"Our AI seems to be down right now... We can still generate completely random recipes if you want?"
      });
    }

    return res.json({ success:true, plan: normalized });

  } catch (e) {
    console.error("ai_suggest_week_error:", e?.status || "", e?.message || "", e?.response?.data || e);
    return res.status(500).json({
      success:false,
      error:"ai_down",
      message:"Our AI seems to be down right now... We can still generate completely random recipes if you want?"
    });
  }
});

module.exports = router;
