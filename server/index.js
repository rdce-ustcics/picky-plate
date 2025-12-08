// server/index.js
require('dotenv').config({ override: true });

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

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

// Socket.IO with production-ready configuration for Render.com
const io = new Server(server, {
  cors: {
    origin: allowed,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  // CRITICAL: Start with polling, then upgrade to websocket
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  // Ping/Pong settings for connection stability
  pingTimeout: 60000,      // 60 seconds before considering connection dead
  pingInterval: 25000,     // Ping every 25 seconds
  upgradeTimeout: 30000,   // Time to complete WebSocket upgrade
  // Connection state recovery for better reconnection
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Socket.IO error logging for debugging connection issues
io.engine.on("connection_error", (err) => {
  console.error("[Socket.IO] Connection error:", {
    code: err.code,
    message: err.message,
    context: err.context
  });
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
// Security & Performance Middleware
// ──────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disabled for API-only server
}));

app.use(compression());

// Rate limiting - general API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 min
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 auth attempts per 15 min
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Health check endpoints (works even before DB is up)
// Render.com recommends /health at root level
app.get('/health', (_req, res) => res.status(200).json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  socketConnections: io.engine.clientsCount,
  nodeEnv: process.env.NODE_ENV
}));
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  nodeEnv: process.env.NODE_ENV,
  socketConnections: io.engine.clientsCount
}));

try {
  const devRouter = require('./routes/dev');
  app.use('/dev', devRouter);
} catch (e) {
  // ignore if dev routes not present
}

// Optional dev utilities (SMTP test, etc.)
if (process.env.NODE_ENV !== 'production') {
  try {
    app.use('/api/dev', require('./routes/dev'));
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
    // CRITICAL: Bind to 0.0.0.0 for Render.com (not localhost)
    server.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Listening on 0.0.0.0:${port}`);
      console.log(`[Server] Socket.IO ready with transports: polling, websocket`);
    });
  })
  .catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });

// ──────────────────────────────────────────────────────────────
// Graceful shutdown for Render.com deploys
// ──────────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`[Server] ${signal} received, starting graceful shutdown...`);

  // Close Socket.IO connections first
  io.close(() => {
    console.log('[Server] Socket.IO connections closed');

    // Then close HTTP server
    server.close(() => {
      console.log('[Server] HTTP server closed');

      // Close MongoDB connection
      mongoose.connection.close(false, () => {
        console.log('[Server] MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  // Force exit after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ──────────────────────────────────────────────────────────────
// Error handler
// ──────────────────────────────────────────────────────────────
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
/* eslint-enable no-unused-vars */
