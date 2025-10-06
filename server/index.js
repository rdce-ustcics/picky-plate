require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cookieParser());

// when using CRA proxy, this can be relaxed; keep explicit origin if you call directly from 3000:
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // e.g., http://localhost:3000
    credentials: true,
  })
);

// --- Mongo: connect once, reuse
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, usersCol, itemsCol, dishesCol;

async function init() {
  await client.connect();
  db = client.db(process.env.DB_NAME || 'pappy_demo');
  usersCol = db.collection('users');
  itemsCol = db.collection('items');
  dishesCol = db.collection('dishes');

  // indexes
  await usersCol.createIndex({ email: 1 }, { unique: true });
  await itemsCol.createIndex({ createdAt: -1 });
  await dishesCol.createIndex({ name: 1 }, { unique: true }).catch(() => {});
  await dishesCol.createIndex({ region: 1 }).catch(() => {});

  console.log('✅ MongoDB connected');
}

// ---------- Auth helpers ----------
const TOKEN_COOKIE = 'pap_token';

function signToken(user) {
  // keep token small but sufficient
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}
function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true in production behind https
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}
function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
}

// parse cookie if present (optional)
function authOptional(req, _res, next) {
  const token = req.cookies[TOKEN_COOKIE];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      /* ignore */
    }
  }
  next();
}
function requireAuth(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

app.use(authOptional);

// ---------- Health ----------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- Auth routes ----------
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ message: 'Missing fields' });
  const exists = await usersCol.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already used' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = { email, name, passwordHash, role: 'user', createdAt: new Date(), favorites: [] };
  const { insertedId } = await usersCol.insertOne(user);
  const doc = { _id: insertedId, ...user };
  const token = signToken(doc);
  setAuthCookie(res, token);
  res.json({ user: { id: insertedId, email, name, role: 'user' } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await usersCol.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const _id = ObjectId.isValid(req.user.id) ? new ObjectId(req.user.id) : null;
  if (!_id) return res.status(401).json({ message: 'Not authenticated' });
  const u = await usersCol.findOne(
    { _id },
    { projection: { passwordHash: 0 } }
  );
  if (!u) return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user: { id: u._id, email: u.email, name: u.name, role: u.role } });
});

// ---------- Example role-protected APIs ----------
app.get('/api/user/secret', requireAuth, requireRole('user', 'admin'), (req, res) => {
  res.json({ message: `Hello ${req.user.name}, user content.` });
});
app.get('/api/admin/secret', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: `Hello ${req.user.name}, admin content.` });
});

// ---------- Items CRUD (public read; write requires login) ----------
app.get('/api/items', async (_req, res) => {
  const items = await itemsCol.find().sort({ createdAt: -1 }).toArray();
  res.json(items);
});
app.post('/api/items', requireAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });
  const ownerId = ObjectId.isValid(req.user.id) ? new ObjectId(req.user.id) : null;
  if (!ownerId) return res.status(401).json({ message: 'Not authenticated' });
  const doc = { text: text.trim(), createdAt: new Date(), ownerId };
  const { insertedId } = await itemsCol.insertOne(doc);
  res.status(201).json({ _id: insertedId, ...doc });
});
app.delete('/api/items/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'invalid id' });
  const q = { _id: new ObjectId(id) };
  const item = await itemsCol.findOne(q);
  if (!item) return res.json({ ok: false });
  const isOwner = item.ownerId?.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
  const result = await itemsCol.deleteOne(q);
  res.json({ ok: result.deletedCount === 1 });
});

// ========== Dishes (for Explorer) ==========
// GET /api/dishes?region=Visayas
app.get('/api/dishes', async (req, res) => {
  const { region } = req.query || {};
  const q = {};
  if (region && typeof region === 'string' && region !== 'All') {
    q.region = region;
  }
  const docs = await dishesCol
    .find(q)
    .project({ name: 1, region: 1, img: 1, desc: 1 }) // recipe not needed for grid
    .sort({ name: 1 })
    .toArray();

  const out = docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    region: d.region,
    img: d.img,
    desc: d.desc,
  }));
  res.json(out);
});

// ========== Favorites (Mongo, cookie-JWT auth) ==========

// GET /api/favorites/populated  -> full dish docs for user's favorites
app.get('/api/favorites/populated', requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.user.id)) return res.status(401).json({ error: 'Invalid user' });
    const _id = new ObjectId(req.user.id);
    const user = await usersCol.findOne(
      { _id },
      { projection: { favorites: 1 } }
    );

    const favIds = (user?.favorites || []).filter((v) => ObjectId.isValid(v)).map((v) => new ObjectId(v));
    if (favIds.length === 0) return res.json([]);

    const docs = await dishesCol
      .find({ _id: { $in: favIds } })
      .project({ name: 1, region: 1, img: 1, desc: 1, recipe: 1 })
      .toArray();

    const result = docs.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      region: d.region,
      img: d.img,
      desc: d.desc,
      recipe: Array.isArray(d.recipe) ? d.recipe : [],
    }));
    res.json(result);
  } catch (e) {
    console.error('favorites/populated error:', e);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

// POST /api/favorites { dishId } -> add to favorites
app.post('/api/favorites', requireAuth, async (req, res) => {
  try {
    const { dishId } = req.body || {};
    if (!dishId || !ObjectId.isValid(dishId)) {
      return res.status(400).json({ error: 'dishId required/invalid' });
    }
    const dishObjId = new ObjectId(dishId);

    // ensure dish exists
    const exists = await dishesCol.findOne({ _id: dishObjId }, { projection: { _id: 1 } });
    if (!exists) return res.status(404).json({ error: 'Dish not found' });

    const userObjId = new ObjectId(req.user.id);
    await usersCol.updateOne(
      { _id: userObjId },
      { $addToSet: { favorites: dishObjId } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('favorites add error:', e);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/favorites/:dishId -> remove from favorites
app.delete('/api/favorites/:dishId', requireAuth, async (req, res) => {
  try {
    const { dishId } = req.params || {};
    if (!dishId || !ObjectId.isValid(dishId)) {
      return res.status(400).json({ error: 'dishId required/invalid' });
    }
    const userObjId = new ObjectId(req.user.id);
    await usersCol.updateOne(
      { _id: userObjId },
      { $pull: { favorites: new ObjectId(dishId) } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('favorites remove error:', e);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// ---------- boot ----------
const port = process.env.PORT || 4000;
init()
  .then(() => app.listen(port, () => console.log(`🚀 API http://localhost:${port}`)))
  .catch((e) => {
    console.error('Mongo init error:', e);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  try {
    await client.close();
  } finally {
    process.exit(0);
  }
});

// GET /api/dishes/:id  -> full dish, including recipe (used by Explorer modal)
app.get('/api/dishes/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'invalid id' });
  const d = await dishesCol.findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, region: 1, img: 1, desc: 1, recipe: 1 } }
  );
  if (!d) return res.status(404).json({ message: 'Not found' });
  res.json({
    id: d._id.toString(),
    name: d.name,
    region: d.region,
    img: d.img,
    desc: d.desc,
    recipe: Array.isArray(d.recipe) ? d.recipe : []
  });
});
