// server/index.js
require('dotenv').config({ override: true });

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./db/mongo');
const recipesRoutes = require('./routes/recipes');

const app = express();
const server = http.createServer(app); // <-- use http server so socket.io can attach

// ──────────────────────────────────────────────────────────────
// CORS — allow multiple origins + requested headers/methods
// ──────────────────────────────────────────────────────────────
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim());

// Socket.IO CORS needs a plain array (matches your manual CORS above)
const io = new Server(server, {
  cors: { origin: allowed, credentials: true },
});

// Mount Barkada Vote realtime handlers
require('./realtime/barkada')(io);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Vary', 'Origin');

    // Echo back the headers/methods the browser asked for in the preflight:
    const reqHeaders = req.headers['access-control-request-headers'];
    const reqMethod  = req.headers['access-control-request-method'];

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers',
      reqHeaders || 'Content-Type,Authorization,X-User-Id'
    );
    res.header('Access-Control-Allow-Methods',
      reqMethod  || 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );

    if (req.method === 'OPTIONS') return res.sendStatus(204); // preflight OK
    return next();
  }
  return next(new Error('Not allowed by CORS'));
});

// ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Health (works even before DB is up)
app.get('/api/health', (_req, res) => res.json({ ok: true, nodeEnv: process.env.NODE_ENV }));

try {
  const devRouter = require('./routes/dev');
  app.use('/dev', devRouter);
  console.log('[dev] routes mounted at /dev (forced)');
} catch (e) {
  console.warn('[dev] routes not mounted:', e?.message);
}

// Optional dev utilities (SMTP test, etc.)
if (process.env.NODE_ENV !== 'production') {
  try {
    app.use('/api/dev', require('./routes/dev'));
    console.log('[dev] routes mounted at /dev');
  } catch { /* ignore if not present */ }
}

// ──────────────────────────────────────────────────────────────
// Connect DB, then mount routes that need it
// ──────────────────────────────────────────────────────────────
connectDB()
  .then(async () => {
    app.locals.db = mongoose.connection.db;

    // Ensure chats index exists (does nothing if already present)
    try {
      await app.locals.db
        .collection('chats')
        .createIndex({ userId: 1, sessionId: 1, updatedAt: -1 });
    } catch (_) {}

    // Routes (keep parity with your old working file)
    app.use('/api',          require('./routes/chat'));        // /api/chat, /api/chats
    app.use('/api/auth',     require('./routes/auth'));        // /api/auth/login, /signup, OTP, etc.
    app.use('/api/places',   require('./routes/places'));      // Google Places proxy
    app.use('/api/recipes',  recipesRoutes);
    app.use('/api/mealplans',require('./routes/mealPlans'));
    app.use('/api/ai',       require('./routes/ai'));
    app.use('/api/preferences', require('./routes/preferences'));
    app.use('/api/cultural-recipes', require('./routes/culturalRecipes')); // Filipino cultural recipes
    app.use('/api/surprise', require('./routes/surprise'));    // Surprise Me feature


    // 🔑 admin
    app.use('/api/admin', require('./routes/admin'));

    const port = process.env.PORT || 4000;
    server.listen(port, () =>
  console.log(`🚀 API + Socket.IO running on http://localhost:${port}`) 
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
