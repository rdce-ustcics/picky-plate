// server/utils/spamDetection.js
// Lightweight anti-spam heuristics for recipe text validation

/**
 * Analyze recipe text for spam signals
 * Returns { isSpam: boolean, score: number, reasons: string[] }
 */
function analyzeRecipeText(recipe) {
  const reasons = [];
  let score = 0;

  const title = (recipe.title || '').trim();
  const description = (recipe.description || '').trim();
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const notes = (recipe.notes || '').trim();

  // Combine all text for analysis
  const allText = [title, description, ...ingredients, ...instructions, notes].join(' ');
  const cleanIngredients = ingredients.map(i => i.trim()).filter(Boolean);
  const cleanInstructions = instructions.map(i => i.trim()).filter(Boolean);

  // 1. Minimum content check
  if (title.length < 3) {
    score += 30;
    reasons.push('Title too short');
  }

  if (cleanIngredients.length < 1) {
    score += 25;
    reasons.push('No ingredients provided');
  }

  if (cleanInstructions.length < 1) {
    score += 25;
    reasons.push('No instructions provided');
  }

  // 2. Excessive link detection (more than 2 links is suspicious)
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
  const linkCount = (allText.match(urlPattern) || []).length;
  if (linkCount > 2) {
    score += 20 + (linkCount - 2) * 10;
    reasons.push(`Excessive links (${linkCount})`);
  }

  // 3. Repetition detection
  const words = allText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordFreq = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

  const totalWords = words.length;
  const highRepetitionWords = Object.entries(wordFreq)
    .filter(([word, count]) => count > 5 && count / totalWords > 0.15)
    .map(([word]) => word);

  if (highRepetitionWords.length > 0 && totalWords > 10) {
    score += 15;
    reasons.push('Excessive word repetition');
  }

  // 4. Character diversity / gibberish detection
  const alphaChars = (allText.match(/[a-zA-Z]/g) || []).length;
  const totalChars = allText.replace(/\s/g, '').length;

  if (totalChars > 20) {
    const alphaRatio = alphaChars / totalChars;
    if (alphaRatio < 0.5) {
      score += 20;
      reasons.push('Low alphabetic character ratio (possible gibberish)');
    }
  }

  // 5. Recipe keyword presence (ingredients/cooking terms)
  const recipeKeywords = [
    'cup', 'tbsp', 'tsp', 'tablespoon', 'teaspoon', 'oz', 'pound', 'lb', 'gram', 'kg',
    'mix', 'stir', 'cook', 'bake', 'fry', 'boil', 'simmer', 'heat', 'add', 'combine',
    'chop', 'dice', 'slice', 'cut', 'preheat', 'oven', 'pan', 'pot', 'bowl',
    'minute', 'hour', 'salt', 'pepper', 'oil', 'butter', 'water', 'sauce'
  ];

  const lowerText = allText.toLowerCase();
  const keywordMatches = recipeKeywords.filter(kw => lowerText.includes(kw)).length;

  // If very few recipe-related keywords, it's suspicious
  if (totalWords > 20 && keywordMatches < 2) {
    score += 15;
    reasons.push('Missing typical recipe terminology');
  }

  // 6. All caps detection (spam signal)
  const capsWords = allText.split(/\s+/).filter(w => w.length > 3 && w === w.toUpperCase());
  if (capsWords.length > 3) {
    score += 10;
    reasons.push('Excessive capitalization');
  }

  // 7. Suspicious patterns (phone numbers, emails in content)
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  if ((allText.match(phonePattern) || []).length > 0) {
    score += 15;
    reasons.push('Contains phone number');
  }

  if ((allText.match(emailPattern) || []).length > 0) {
    score += 15;
    reasons.push('Contains email address');
  }

  // 8. Very short total content
  if (allText.length < 50) {
    score += 20;
    reasons.push('Content too short overall');
  }

  // Determine spam status (threshold: 40)
  const isSpam = score >= 40;
  const shouldFlag = score >= 25; // Flag for review if borderline

  return {
    isSpam,
    shouldFlag,
    score,
    reasons,
    details: {
      titleLength: title.length,
      ingredientCount: cleanIngredients.length,
      instructionCount: cleanInstructions.length,
      totalWords,
      linkCount,
      keywordMatches
    }
  };
}

/**
 * Quick validation - returns error message if hard fail, null if OK
 */
function quickSpamCheck(recipe) {
  const title = (recipe.title || '').trim();
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(i => i.trim()) : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions.filter(i => i.trim()) : [];

  if (title.length < 2) {
    return 'Recipe title is too short';
  }

  if (ingredients.length === 0) {
    return 'At least one ingredient is required';
  }

  if (instructions.length === 0) {
    return 'At least one instruction is required';
  }

  // Check for obvious spam (all same character)
  if (/^(.)\1+$/.test(title.replace(/\s/g, ''))) {
    return 'Invalid recipe title';
  }

  return null; // Passed quick check
}

module.exports = {
  analyzeRecipeText,
  quickSpamCheck
};
