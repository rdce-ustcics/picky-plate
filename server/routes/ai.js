// server/routes/ai.js
const express = require("express");
const router = express.Router();
const openai = require("../openaiClient");
const { protect } = require("../middleware/auth");

/**
 * POST /api/ai/suggest-week
 * body: { startDate?: "YYYY-MM-DD" }
 * returns: { success: true, plan: [{ dateKey, dishes:[{slot,name,cost,source:"ai"}] }] }
 */
router.post("/suggest-week", protect, async (req, res) => {
  try {
    const iso = (req.body?.startDate || new Date().toISOString().slice(0, 10));
    const start = new Date(iso + "T00:00:00");

    const systemPrompt = `You are a meal planning assistant. Output STRICT JSON only.
Return exactly 7 consecutive days starting from the provided date (inclusive).
For each day:
- dateKey: "YYYY-M-D" (no leading zeros)
- dishes: array of 3 items (breakfast, lunch, dinner), each:
  { "slot":"breakfast|lunch|dinner", "name": string, "cost": number, "source":"ai" }
Costs are realistic Philippine pesos (numeric only). No markdown, no explanations.`;

    const userPrompt = `Start date: ${iso}
Keep ideas simple, budget-conscious, Filipino-friendly but can mix cuisines.`;

    // ✅ Use Responses API WITHOUT text.format (it caused 400).
    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_output_tokens: 800,
      temperature: 0.7,
    });

    const raw = (r?.output_text || "").trim();

    // --- Safe JSON parsing helper ---
    function safeParseJSON(s) {
      if (!s) return null;
      const cleaned = s
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "");
      try {
        return JSON.parse(cleaned);
      } catch {
        // Try to salvage top-level array/object via a loose match
        try {
          const m = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
          return m ? JSON.parse(m[1]) : null;
        } catch {
          return null;
        }
      }
    }

    let obj = safeParseJSON(raw) || {};
    let plan = Array.isArray(obj)
      ? obj
      : Array.isArray(obj.plan)
      ? obj.plan
      : Array.isArray(obj.days)
      ? obj.days
      : [];

    // Normalize & clamp to 7 days aligned to start date
    plan = plan.slice(0, 7).map((day, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const fallbackKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const dateKey = String(day?.dateKey || fallbackKey);
      const dishes = Array.isArray(day?.dishes) ? day.dishes : [];
      return {
        dateKey,
        dishes: dishes.map((x) => ({
          slot: x?.slot || "other",
          name: String(x?.name || "").trim(),
          cost: Number(x?.cost) || 0,
          source: "ai",
        })),
      };
    });

    // Hard fallback if model returned nothing
    if (!plan.length) {
      const fallback = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        fallback.push({
          dateKey: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
          dishes: [
            { slot: "breakfast", name: "Garlic Rice & Egg", cost: 75, source: "ai" },
            { slot: "lunch", name: "Chicken Adobo", cost: 180, source: "ai" },
            { slot: "dinner", name: "Sinigang", cost: 220, source: "ai" },
          ],
        });
      }
      plan = fallback;
    }

    return res.json({ success: true, plan });
  } catch (e) {
    console.error("ai_suggest_week_error:", e?.response?.data || e);
    res.status(500).json({ success: false, error: "ai_failed" });
  }
});

module.exports = router;
