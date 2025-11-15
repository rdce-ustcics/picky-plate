// server/realtime/aiRecommender.js
const openai = require('../openaiClient');

/**
 * Generate a list of restaurant options based on group preferences.
 *
 * @param {Object} params
 * @param {Object} params.prefs - Free-text preferences collected from the host.
 * @param {string} params.code  - Lobby code (for context only).
 * @returns {Promise<Array<{name:string,location:string,averagePrice:number,image?:string,tags?:string[]}>>}
 */
async function generateRestaurants({ prefs = {}, code }) {
  const maxRequested = Number(prefs.maxRestaurants || prefs.maxOptions || 6);
  const maxRestaurants = Math.max(1, Math.min(maxRequested, 6));

  const systemPrompt = `
You are an AI that suggests casual restaurant options in Metro Manila (or nearby) for a small barkada.
Return between 1 and ${maxRestaurants} restaurants as JSON with this exact shape:

[
  {
    "name": "Restaurant Name",
    "location": "Mall or Area, City",
    "averagePrice": 350,
    "image": "",
    "tags": ["filipino","grill"]
  }
]

Rules:
- Only suggest restaurants, NOT individual dishes.
- Treat "location" as the branch / area (e.g. "España, Sampaloc Manila" or "BGC, Taguig").
- Prices are average cost per person in PHP.
- Respect allergens and "avoid" preferences as much as possible.
- Prefer places that are realistically available in/near the described area (or reasonably central if area is vague).
- Keep tags simple, lowercase, and descriptive (e.g. "filipino", "kbbq", "ramen", "fastfood").
`;

  const userPrompt = `
Lobby code: ${code}

Group preferences (free text, may be partial):

- Area / preferred location: ${prefs.area || 'not specified'}
- Budget per person (PHP): ${prefs.budgetPerPerson || 'not specified'}
- Cuisines they like: ${prefs.cuisinesLike || 'not specified'}
- Cuisines they dislike: ${prefs.cuisinesAvoid || 'not specified'}
- Allergens / must avoid: ${prefs.allergens || 'not specified'}
- Extra notes: ${prefs.notes || 'none'}

Return ONLY a valid JSON array as described, with no extra commentary or markdown.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const raw = (response.choices[0]?.message?.content || '').trim() || '[]';

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Try to salvage JSON if it was wrapped in text
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(raw.slice(start, end + 1));
      } catch (e2) {
        console.error('Failed to parse AI JSON (slice):', raw);
        throw new Error('AI did not return valid JSON.');
      }
    } else {
      console.error('Failed to parse AI JSON:', raw);
      throw new Error('AI did not return valid JSON.');
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI did not return a JSON array.');
  }

  // Respect the requested maximum again, just in case
  return parsed.slice(0, maxRestaurants);
}

module.exports = {
  generateRestaurants,
};
