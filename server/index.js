const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./db/mongo');
const mongoose = require("mongoose");
const recipesRoutes = require("./routes/recipes");

// Load environment variables
dotenv.config();

const app = express();

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(express.json({ limit: '25mb' }));                 // ⬅️ increase limits
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Connect to MongoDB
// ✅ Connect Mongo and expose it to routes
connectDB().then(async() => {
  // ✅ This line makes your DB accessible in all routes
  app.locals.db = mongoose.connection.db;

  // Ensure chats index exists
  await app.locals.db.collection("chats")
    .createIndex({ userId: 1, sessionId: 1, updatedAt: -1 })
    .catch(() => {});

  // ✅ Register routes after DB is ready
  app.use("/api", require("./routes/chat"));
  app.use("/api/auth", require("./routes/auth"));

  // ✅ ADDED: Places API (New) proxy routes (search/details)
  app.use("/api/places", require("./routes/places"));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/recipes", recipesRoutes);

  app.use("/api/mealplans", require("./routes/mealPlans"));

  app.use("/api/ai", require("./routes/ai"));

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`));
}).catch((err) => {
  console.error("❌ Failed to connect MongoDB:", err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


const PORT = process.env.PORT || 4000;
