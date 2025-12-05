const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const aiRecommender = require('./aiRecommender');
const UserPreferences = require('../models/UserPreferences');

module.exports = function mountBarkada(io) {
  /**
   * sessions: Map<code, {
   *   code, passwordHash,
   *   host: { userId, name, isRegistered },
   *   participants: Map<token, {
   *     name, isRegistered, hasSubmitted, socketId,
   *     restrictions?, submittedOptionsCount?: number
   *   }>,
   *   baseOptions: Array<{id,name,price,image,restaurant,tags:Set<string>}>,
   *   options:     Array<{id,name,price,image,restaurant,tags:Set<string>}>,
   *   isVotingOpen: boolean,
   *   ratings: Map<token, { [optionId]: { taste:number, mood:number, value:number } }>,
   *   createdAt: Date,
   *   lastActivityAt: Date,
   *   expiresAt: Date,
   *   votingEndsAt?: Date,
   *   timers: { expire?: NodeJS.Timeout, voting?: NodeJS.Timeout },
   *   settings: {
   *     engine: 'manual'|'ai',
   *     mode: 'host_only'|'per_user',
   *     perUserLimit: 1|2|3|0,
   *     maxParticipants: number,
   *     weights: { taste:number, mood:number, value:number }, // % totals 100
   *     votingSeconds: number,
   *     inactivityMinutes: number
   *   }
   * }>
   */
  const sessions = new Map();

  const generateCode = () => {
    let code;
    do code = String(Math.floor(10000 + Math.random() * 90000));
    while (sessions.has(code));
    return code;
  };

  const clampHalf = (n) => {
    // snap to nearest 0.5 within 0..5
    const v = Math.round(Math.max(0, Math.min(5, Number(n))) * 2) / 2;
    return v;
  };

  const computeGroupPreferences = (participantsMap) => {
  const groupAvoid = new Set();
  const groupDiet = new Set();

  participantsMap.forEach((p) => {
    const r = p.restrictions;
    if (!r) return;

    if (r.avoidTags) {
      r.avoidTags.forEach((tag) => groupAvoid.add(tag));
    }

    if (r.diet) {
      r.diet
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
        .forEach((d) => groupDiet.add(d));
    }
  });

  return {
    groupAvoid: Array.from(groupAvoid),
    groupDiet: Array.from(groupDiet),
  };
};


const sanitizeSessionForClient = (s, requestingToken = null) => {
  const participants = Array.from(s.participants.entries()).map(
    ([token, p]) => ({
      token: token === requestingToken ? token : undefined, // reveal only your own
      name: p.name,
      isRegistered: p.isRegistered,
      hasSubmitted: p.hasSubmitted,
      profileImage: p.profileImage || '',
    })
  );

  // 👇 Compute group-level prefs from all participants
  const { groupAvoid, groupDiet } = computeGroupPreferences(s.participants);

  return {
    code: s.code,
    isVotingOpen: s.isVotingOpen,
    host: { name: s.host.name, isRegistered: s.host.isRegistered },
    participants,
    options: s.options.map((o) => ({
      id: o.id,
      name: o.name,
      price: o.price,
      image: o.image,
      restaurant: o.restaurant,
      tags: Array.from(o.tags || []),   // 👈 important for classification/images
    })),
    settings: s.settings,
    createdAt: s.createdAt,
    lastActivityAt: s.lastActivityAt,
    expiresAt: s.expiresAt,
    votingEndsAt: s.votingEndsAt || null,

    // ✅ now these are defined
    groupAvoid,
    groupDiet,
  };
};

  const broadcastState = (code) => {
    const s = sessions.get(code);
    if (!s) return;
    io.to(code).emit('session:state', sanitizeSessionForClient(s));
  };

  const computeResults = (s) => {
    const W = s.settings?.weights || { taste: 40, mood: 40, value: 20 };
    const wt = Number(W.taste) / 100;
    const wm = Number(W.mood) / 100;
    const wv = Number(W.value) / 100;

    const perOption = s.options.map((opt) => {
      let voters = 0;
      let tasteSum = 0;
      let moodSum = 0;
      let valueSum = 0;
      s.ratings.forEach((byOption) => {
        const r = byOption[opt.id];
        if (r) {
          voters++;
          tasteSum += r.taste;
          moodSum += r.mood;
          valueSum += r.value;
        }
      });
      const tasteAvg = voters ? tasteSum / voters : 0;
      const moodAvg = voters ? moodSum / voters : 0;
      const valueAvg = voters ? valueSum / voters : 0;
      const score = tasteAvg * wt + moodAvg * wm + valueAvg * wv;
      return {
        ...opt,
        tags: Array.from(opt.tags || []),   // 👈 FIX missing classification
        voters,
        tasteAvg,
        moodAvg,
        valueAvg,
        score: Number(score.toFixed(3)),
      };
    });

    // Tie-breakers: score desc, voters desc, price asc, name asc
    perOption.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.voters !== a.voters) return b.voters - a.voters;
      if (a.price !== b.price) return a.price - b.price;
      return a.name.localeCompare(b.name);
    });

    return perOption;
  };

  const filterOptionsByNonNegotiables = (options, participants) => {
    const avoid = new Set();
    participants.forEach((p) => {
      if (p.restrictions?.avoidTags) {
        p.restrictions.avoidTags.forEach((t) => avoid.add(t));
      }
    });
    if (avoid.size === 0) return options;
    return options.filter((o) => {
      for (const t of o.tags || []) if (avoid.has(t)) return false;
      return true;
    });
  };

  const rescheduleExpire = (s) => {
    if (s.timers?.expire) clearTimeout(s.timers.expire);
    const now = Date.now();
    const ms = Math.max(0, s.expiresAt.getTime() - now);
    s.timers.expire = setTimeout(() => {
      // Only expire if voting hasn't started
      if (!s.isVotingOpen) {
        io.to(s.code).emit('session:expired');
        sessions.delete(s.code);
      }
    }, ms);
  };

  const scheduleVotingEnd = (s) => {
    if (s.timers?.voting) clearTimeout(s.timers.voting);
    const now = Date.now();
    const ms = Math.max(0, (s.votingEndsAt?.getTime?.() || now) - now);
    s.timers.voting = setTimeout(() => {
      // Auto-end, same as host-triggered end but without token check
      if (!sessions.has(s.code)) return;
      s.isVotingOpen = false;
      const leaderboard = computeResults(s);
      const winner = leaderboard[0] || null;
      io.to(s.code).emit('session:results', { leaderboard, winner });
    }, ms);
  };

  io.on('connection', (socket) => {
    // ──────────────────────────────────────────────────────────────
    // Create lobby (options optional; host can add later)
    // ──────────────────────────────────────────────────────────────
    socket.on(
      'session:create',
      async ({ name, password, userId = null, isRegistered = !!userId, options = [], profileImage = '' }, cb) => {
        try {
          if (!name || !password) return cb({ ok: false, error: 'Missing fields' });

          // Validate initial (optional) options 0..6
          const cleaned = Array.isArray(options)
            ? options
                .map((o) => ({
                  id: undefined,
                  name: String(o.name || '').trim(),
                  restaurant: String(o.restaurant || '').trim(),
                  price: Number(o.price),
                  image: String(o.image || '').trim(),
                  tags: new Set(),
                }))
                .filter((o) => o.name && o.restaurant && o.price > 0)
            : [];
          if (cleaned.length > 6) return cb({ ok: false, error: 'Max 6 options' });
          cleaned.forEach((o, i) => (o.id = i + 1));

          const code = generateCode();
          const passwordHash = await bcrypt.hash(String(password), 8);

          const now = new Date();
          const settings = {
            engine: 'manual', // 'manual' | 'ai'
            mode: 'host_only',
            perUserLimit: 2,
            maxParticipants: 10,
            weights: { taste: 40, mood: 40, value: 20 },
            votingSeconds: 90,
            inactivityMinutes: 5,
          };

          const s = {
            code,
            passwordHash,
            host: { userId, name, isRegistered: !!userId },
            participants: new Map(),
            baseOptions: cleaned,
            options: cleaned.slice(),
            isVotingOpen: false,
            ratings: new Map(),
            createdAt: now,
            lastActivityAt: now,
            expiresAt: new Date(now.getTime() + settings.inactivityMinutes * 60 * 1000),
            votingEndsAt: null,
            timers: {},
            settings,
          };

          const hostToken = nanoid();
          s.participants.set(hostToken, {
            name,
            isRegistered: !!userId,
            hasSubmitted: false,
            socketId: socket.id,
            submittedOptionsCount: 0,
            profileImage: profileImage || '',
          });

          sessions.set(code, s);
          socket.join(code);
          rescheduleExpire(s);

          cb({
            ok: true,
            code,
            participantToken: hostToken,
            state: sanitizeSessionForClient(s, hostToken),
          });
          broadcastState(code);
        } catch (e) {
          // console.error('Error creating session', e);
          cb({ ok: false, error: 'Failed to create session' });
        }
      }
    );

    // ──────────────────────────────────────────────────────────────
    // Update settings (host-only, before voting)
    // ──────────────────────────────────────────────────────────────
    socket.on('session:updateSettings', ({ code, token, settings }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (s.isVotingOpen) return cb({ ok: false, error: 'Voting already started' });

      const p = s.participants.get(token);
      if (!p || p.name !== s.host.name) return cb({ ok: false, error: 'Only host can update settings' });

      const next = { ...s.settings, ...(settings || {}) };

      // Engine
      if (next.engine !== 'ai') next.engine = 'manual';

      // Manual-only stuff
      if (next.engine === 'manual') {
        if (!['host_only', 'per_user'].includes(next.mode)) next.mode = 'host_only';

        if (next.mode === 'per_user') {
          const lim = Number(next.perUserLimit);
          if (![1, 2, 3].includes(lim)) return cb({ ok: false, error: 'Per-user limit must be 1, 2, or 3' });
          next.perUserLimit = lim;
        } else {
          next.perUserLimit = 2;
        }
      } else {
        // AI mode ignores per-user submissions
        next.mode = 'host_only';
        next.perUserLimit = 0;
      }

      // Weights
      const w = next.weights || { taste: 0, mood: 0, value: 0 };
      const sum = Number(w.taste) + Number(w.mood) + Number(w.value);
      if (sum !== 100) return cb({ ok: false, error: 'Weights must total 100%' });

      // Voting seconds
      const vs = Number(next.votingSeconds);
      if (!(vs >= 30 && vs <= 300)) return cb({ ok: false, error: 'Voting duration must be 30–300 seconds' });
      next.votingSeconds = vs;

      // Inactivity
      const im = Number(next.inactivityMinutes);
      if (!(im >= 1 && im <= 60)) return cb({ ok: false, error: 'Inactivity timeout must be 1–60 minutes' });
      next.inactivityMinutes = im;

      // Max participants
      const mp = Number(next.maxParticipants || 10);
      if (!(mp >= 2 && mp <= 20)) return cb({ ok: false, error: 'Max participants must be 2–20' });
      next.maxParticipants = mp;

      s.settings = next;

      // Slide expiration based on new inactivity window (only before voting)
      const now = new Date();
      s.lastActivityAt = now;
      s.expiresAt = new Date(now.getTime() + s.settings.inactivityMinutes * 60 * 1000);
      rescheduleExpire(s);

      cb({ ok: true, state: sanitizeSessionForClient(s, token) });
      broadcastState(code);
    });

    // ──────────────────────────────────────────────────────────────
    // Host updates the whole menu (before voting)
    // ──────────────────────────────────────────────────────────────
    socket.on('session:updateOptions', ({ code, token, options }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (s.isVotingOpen) return cb({ ok: false, error: 'Voting already started' });

      const p = s.participants.get(token);
      if (!p || p.name !== s.host.name) return cb({ ok: false, error: 'Only host can update options' });

      // raw rows from client (name, tag, price)
      const raw = Array.isArray(options) ? options : [];

      // did the host type *anything* in any row?
      const hasAnyRow = raw.some((o) => {
        const name  = String(o.name || '').trim();
        const tag   = String(o.tag  || '').trim();
        const price = Number(o.price);
        return name || tag || price > 0;
      });

      const cleaned = raw
        .map((o) => {
          const name  = String(o.name || '').trim();
          const tag   = String(o.tag  || '').trim().toLowerCase();
          const price = Number(o.price);
          const restaurant = String(o.restaurant || '').trim(); // optional now
          const image = String(o.image || '').trim();
          const tags  = new Set(tag ? [tag] : []);

          return {
            id: undefined,
            name,
            restaurant,
            price,
            image,
            tags,
          };
        })
        // ✅ require name + classification(tag) + price>0
        .filter((o) => o.name && o.price > 0 && o.tags.size > 0);

      if (!hasAnyRow) {
        return cb({ ok: false, error: 'Add at least one restaurant.' });
      }

      if (hasAnyRow && cleaned.length === 0) {
        return cb({
          ok: false,
          error:
            'Please complete name, classification, and price (₱) for at least one restaurant.',
        });
      }

      if (cleaned.length > 6) {
        return cb({ ok: false, error: 'Max 6 options' });
      }

      cleaned.forEach((o, i) => (o.id = i + 1));

      s.baseOptions = cleaned;
      s.options = filterOptionsByNonNegotiables(s.baseOptions, Array.from(s.participants.values()));
      s.ratings.clear();
      s.participants.forEach((part) => (part.hasSubmitted = false));

      // activity bumps expiry
      const now = new Date();
      s.lastActivityAt = now;
      s.expiresAt = new Date(now.getTime() + s.settings.inactivityMinutes * 60 * 1000);
      rescheduleExpire(s);

      cb({ ok: true, state: sanitizeSessionForClient(s, token) });
      broadcastState(code);
    });

    // ──────────────────────────────────────────────────────────────
    // Join lobby
    // ──────────────────────────────────────────────────────────────
socket.on(
  'session:join',
  async (
    {
      code,
      password,
      name,
      isRegistered = false,
      userId = null,
      existingToken = null,
      restrictions = null,  // can be used for guests
      profileImage = '',
    },
    cb
  ) => {
    const s = sessions.get(code);
    if (!s) return cb({ ok: false, error: 'Invalid code' });

    if (s.settings?.maxParticipants && s.participants.size >= s.settings.maxParticipants) {
      return cb({
        ok: false,
        error: `Lobby is full (max ${s.settings.maxParticipants} participants)`,
      });
    }

    const ok = await bcrypt.compare(String(password || ''), s.passwordHash);
    if (!ok) return cb({ ok: false, error: 'Wrong password' });

    // 🔹 Start with whatever the client passed (guest modal)
    let finalRestrictions = restrictions || null;

    // 🔹 If logged in, load preferences from DB (overrides guest for that user)
    if (isRegistered && userId) {
      try {
        const prefs = await UserPreferences.findOne({ userId }).lean();
        if (prefs) {
          const diets = prefs.diets || [];
          const dislikes = prefs.dislikes || [];
          const allergens = prefs.allergens || [];

          finalRestrictions = {
            // tags we want to AVOID at restaurant level
            avoidTags: [...new Set([...dislikes, ...diets])],
            // free-text notes for AI / UI
            allergens: allergens.join(', '),
            diet: diets.join(', '),
          };
        }
      } catch (err) {
        // console.error('Failed to load UserPreferences:', err);
      }
    }

    let token =
      existingToken && s.participants.has(existingToken)
        ? existingToken
        : nanoid();

    s.participants.set(token, {
      name,
      userId: userId || null,
      isRegistered,
      hasSubmitted: s.participants.get(token)?.hasSubmitted || false,
      socketId: socket.id,
      restrictions: finalRestrictions
        ? {
            avoidTags: finalRestrictions.avoidTags?.length
              ? new Set(finalRestrictions.avoidTags)
              : undefined,
            allergens: finalRestrictions.allergens || '',
            diet: finalRestrictions.diet || '',
          }
        : undefined,
      submittedOptionsCount:
        s.participants.get(token)?.submittedOptionsCount || 0,
      profileImage: profileImage || '',
    });

    // Refilter options based on everyone’s non-negotiables
    s.options = filterOptionsByNonNegotiables(
      s.baseOptions,
      Array.from(s.participants.values())
    );

    const now = new Date();
    s.lastActivityAt = now;
    s.expiresAt = new Date(
      now.getTime() + s.settings.inactivityMinutes * 60 * 1000
    );
    rescheduleExpire(s);

    socket.join(code);
    cb({
      ok: true,
      participantToken: token,
      state: sanitizeSessionForClient(s, token),
    });
    broadcastState(code);
  }
);

    // Session fetch
    socket.on('session:get', ({ code, token }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (!s.participants.has(token)) return cb({ ok: false, error: 'Not in session' });
      cb({ ok: true, state: sanitizeSessionForClient(s, token) });
    });

    // ──────────────────────────────────────────────────────────────
    // Each user submits their own options (per_user mode)
    // ──────────────────────────────────────────────────────────────
    socket.on('session:addUserOptions', ({ code, token, options }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (s.isVotingOpen) return cb({ ok: false, error: 'Voting already started' });

      if (s.settings.mode !== 'per_user') return cb({ ok: false, error: 'Per-user adding is disabled' });
      const p = s.participants.get(token);
      if (!p) return cb({ ok: false, error: 'Not in session' });

      const limit = s.settings.perUserLimit || 2;
      const cleaned = Array.isArray(options)
        ? options
            .map((o) => ({
              id: undefined,
              name: String(o.name || '').trim(),
              restaurant: String(o.restaurant || '').trim(),
              price: Number(o.price),
              image: String(o.image || '').trim(),
              tags: new Set(),
            }))
            .filter((o) => o.name && o.restaurant && o.price > 0)
        : [];

      const toAccept = Math.min(limit - (p.submittedOptionsCount || 0), cleaned.length);
      if (toAccept <= 0) return cb({ ok: false, error: `Limit reached (${limit})` });

      // Global cap of 6 options total
      const remainingSlots = Math.max(0, 6 - s.baseOptions.length);
      const acceptCount = Math.min(toAccept, remainingSlots);
      if (acceptCount <= 0) return cb({ ok: false, error: 'Menu is full (max 6)' });

      // Assign incremental ids continuing from current baseOptions length
      const startIdx = s.baseOptions.length;
      for (let i = 0; i < acceptCount; i++) {
        const item = cleaned[i];
        item.id = startIdx + 1 + i;
        s.baseOptions.push(item);
      }

      p.submittedOptionsCount = (p.submittedOptionsCount || 0) + acceptCount;

      // Refilter + reset ratings since the set changed
      s.options = filterOptionsByNonNegotiables(s.baseOptions, Array.from(s.participants.values()));
      s.ratings.clear();
      s.participants.forEach((pp) => (pp.hasSubmitted = false));

      // bump inactivity window
      const now = new Date();
      s.lastActivityAt = now;
      s.expiresAt = new Date(now.getTime() + s.settings.inactivityMinutes * 60 * 1000);
      rescheduleExpire(s);

      cb({ ok: true, accepted: acceptCount, state: sanitizeSessionForClient(s, token) });
      broadcastState(code);
    });

    // ──────────────────────────────────────────────────────────────
    // Start voting (host-only). Requires ≥2 participants and ≥1 option.
    // ──────────────────────────────────────────────────────────────
    socket.on('session:start', ({ code, token, votingSeconds, weights }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });

      const requester = s.participants.get(token);
      if (!requester || requester.name !== s.host.name)
        return cb({ ok: false, error: 'Only host can start' });

      if (s.participants.size < 2) return cb({ ok: false, error: 'Need at least 2 participants' });
      if (!s.options || s.options.length === 0) return cb({ ok: false, error: 'No options to vote on' });

      // Optional overrides from client (already validated there as well)
      if (weights) {
        const sum = Number(weights.taste) + Number(weights.mood) + Number(weights.value);
        if (sum === 100) s.settings.weights = { ...weights };
      }
      if (votingSeconds) {
        const vs = Number(votingSeconds);
        if (vs >= 30 && vs <= 300) s.settings.votingSeconds = vs;
      }

      s.isVotingOpen = true;
      const now = new Date();
      s.votingEndsAt = new Date(now.getTime() + s.settings.votingSeconds * 1000);

      // Once voting starts, inactivity expiry no longer applies
      if (s.timers.expire) {
        clearTimeout(s.timers.expire);
        s.timers.expire = undefined;
      }
      scheduleVotingEnd(s);

      cb({ ok: true, votingEndsAt: s.votingEndsAt });
      broadcastState(code);
    });

    // ──────────────────────────────────────────────────────────────
    // Submit ratings (one per token). Accept 0.5 increments 0..5.
    // ──────────────────────────────────────────────────────────────
    socket.on('session:submitRatings', ({ code, token, ratings }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });

      const p = s.participants.get(token);
      if (!p) return cb({ ok: false, error: 'Not in session' });
      if (!s.isVotingOpen) return cb({ ok: false, error: 'Voting closed' });
      if (p.hasSubmitted) return cb({ ok: false, error: 'Already submitted' });

      const cleaned = {};
      for (const opt of s.options) {
        const r = ratings?.[opt.id];
        if (!r) continue;
        const taste = clampHalf(r.taste);
        const mood = clampHalf(r.mood);
        const value = clampHalf(r.value);
        if (taste > 0 || mood > 0 || value > 0) {
          cleaned[opt.id] = { taste, mood, value };
        }
      }
      if (Object.keys(cleaned).length === 0)
        return cb({ ok: false, error: 'No ratings provided' });

      s.ratings.set(token, cleaned);
      p.hasSubmitted = true;

      cb({ ok: true });
      broadcastState(code);
    });

    // ──────────────────────────────────────────────────────────────
    // End voting (host-only). Auto-timer also uses this path (no token check).
    // ──────────────────────────────────────────────────────────────
    socket.on('session:end', ({ code, token }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });

      // allow if host OR no token (auto)
      if (token) {
        const requester = s.participants.get(token);
        if (!requester || requester.name !== s.host.name)
          return cb({ ok: false, error: 'Only host can end' });
      }

      s.isVotingOpen = false;
      if (s.timers.voting) {
        clearTimeout(s.timers.voting);
        s.timers.voting = undefined;
      }

      const leaderboard = computeResults(s);
      const winner = leaderboard[0] || null;

      io.to(code).emit('session:results', { leaderboard, winner });
      cb?.({ ok: true, leaderboard, winner });
    });

    // ──────────────────────────────────────────────────────────────
    // Client-side detected expiry ping
    // ──────────────────────────────────────────────────────────────
    socket.on('session:expire', ({ code }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb?.({ ok: false, error: 'Invalid code' });
      if (s.isVotingOpen) return cb?.({ ok: false, error: 'Voting already started' });
      if (Date.now() < s.expiresAt.getTime()) return cb?.({ ok: false, error: 'Not expired yet' });

      io.to(s.code).emit('session:expired');
      sessions.delete(s.code);
      cb?.({ ok: true });
    });

    // ──────────────────────────────────────────────────────────────
    // AI: Generate restaurant options (host-only, engine === "ai")
    // ──────────────────────────────────────────────────────────────
    socket.on('session:aiGenerate', async ({ code, token, prefs }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (s.isVotingOpen) return cb({ ok: false, error: 'Voting already started' });

      if (s.settings.engine !== 'ai') {
        return cb({ ok: false, error: 'Session is not in AI mode' });
      }

      const requester = s.participants.get(token);
      if (!requester || requester.name !== s.host.name) {
        return cb({ ok: false, error: 'Only host can generate AI recommendations' });
      }

      try {
        // Include numOptions from session settings if not in prefs
        const prefsWithMax = {
          ...prefs,
          maxRestaurants: prefs.maxRestaurants || s.settings.numOptions || 4,
        };

        const aiOptions = await aiRecommender.generateRestaurants({
          prefs: prefsWithMax,
          code,
        });

        if (!Array.isArray(aiOptions) || aiOptions.length === 0) {
          return cb({
            ok: false,
            error: 'AI did not return any options. Try adjusting your preferences.',
          });
        }

        const maxOptions = prefsWithMax.maxRestaurants || 4;
        const cleaned = aiOptions
          .map((o, i) => ({
            id: i + 1,
            name: String(o.name || '').trim(),
            restaurant: String(o.location || o.area || '').trim(),
            price: Number(o.averagePrice || o.price || 0),
            image: String(o.image || '').trim(),
            tags: new Set(Array.isArray(o.tags) ? o.tags : []),
          }))
          .filter((o) => o.name && o.price > 0)
          .slice(0, maxOptions); // respect user's numOptions setting

        if (cleaned.length === 0) {
          return cb({
            ok: false,
            error: 'AI options were invalid. Please try again.',
          });
        }

        s.baseOptions = cleaned;
        s.options = filterOptionsByNonNegotiables(
          s.baseOptions,
          Array.from(s.participants.values())
        );
        s.ratings.clear();
        s.participants.forEach((pp) => {
          pp.hasSubmitted = false;
          pp.submittedOptionsCount = 0;
        });

        const now = new Date();
        s.lastActivityAt = now;
        s.expiresAt = new Date(
          now.getTime() + s.settings.inactivityMinutes * 60 * 1000
        );
        rescheduleExpire(s);

        const state = sanitizeSessionForClient(s, token);
        cb({ ok: true, state });
        broadcastState(code);
      } catch (e) {
        // console.error('AI generation failed:', e);
        cb({
          ok: false,
          error: 'Failed to generate restaurants with AI. Please try again.',
        });
      }
    });

    socket.on('disconnect', () => {
      // Keep participants; token ties to device, reconnect is fine.
    });
  });

  // GC for very old sessions (2h)
  setInterval(() => {
    const now = Date.now();
    for (const [code, s] of sessions.entries()) {
      if (s.isVotingOpen) continue;
      if (now - s.createdAt.getTime() > 2 * 60 * 60 * 1000) {
        sessions.delete(code);
      }
    }
  }, 10 * 60 * 1000);
};
