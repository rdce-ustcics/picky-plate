// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDB = require('./db/mongo');
const recipesRoutes = require('./routes/recipes');

// ──────────────────────────────────────────────────────────────
// App setup
// ──────────────────────────────────────────────────────────────
const app = express();

// CORS (allow localhost:3000 & 127.0.0.1:3000 by default)
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (mobile apps, curl) or listed origins
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsers (single, with limits)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Health (works even before DB is up)
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ──────────────────────────────────────────────────────────────
// Connect DB, then mount routes that need it
// ──────────────────────────────────────────────────────────────
connectDB()
  .then(async () => {
    // Expose native db if you need raw collections
    app.locals.db = mongoose.connection.db;

    // Example index creation
    try {
      await app.locals.db
        .collection('chats')
        .createIndex({ userId: 1, sessionId: 1, updatedAt: -1 });
    } catch (_) {}

    // Your existing routes
    app.use('/api', require('./routes/chat'));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/places', require('./routes/places'));
    app.use('/api/recipes', recipesRoutes);
    app.use('/api/mealplans', require('./routes/mealPlans'));
    app.use('/api/ai', require('./routes/ai'));

    // ✅ Preferences (aggregates 4 collections: likes, dislikes, diets, allergens)
    //   - GET  /api/preferences/me   (?userId=... or header x-user-id)
    //   - PUT  /api/preferences/me   { likes, dislikes, diets, allergens }
    app.use('/api/preferences', require('./routes/preferences'));

    const port = process.env.PORT || 4000;
    app.listen(port, () =>
      console.log(`🚀 API running on http://localhost:${port}`)
    );
  })
  .catch((err) => {
    console.error('❌ Failed to connect MongoDB:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────────────────────
// Error handler
// ──────────────────────────────────────────────────────────────
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
/* eslint-enable no-unused-vars */
