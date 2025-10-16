require("dotenv").config();
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: "Say hello from OpenAI!",
    });
    console.log("✅ Reply:", res.output_text);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
