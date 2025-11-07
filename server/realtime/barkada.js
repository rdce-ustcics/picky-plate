// server/realtime/barkada.js
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');

module.exports = function mountBarkada(io) {
  /**
   * sessions: Map<code, {
   *   code, passwordHash,
   *   host: { userId, name, isRegistered },
   *   participants: Map<token, { name, isRegistered, hasSubmitted, socketId, restrictions? }>,
   *   options: Array<{id,name,price,image,restaurant,tags:Set<string>}>,
   *   isVotingOpen: boolean,
   *   ratings: Map<token, { [optionId]: { taste:number, mood:number, value:number } }>,
   *   createdAt: Date
   * }>
   */
  const sessions = new Map();

  const generateCode = () => {
    let code;
    do {
      code = String(Math.floor(10000 + Math.random() * 90000));
    } while (sessions.has(code));
    return code;
  };

  const BASE_OPTIONS = [
    {
      id: 1,
      name: "McDonald's Burger Combo",
      price: 150.0,
      image:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      restaurant: "McDonald's",
      tags: new Set(['beef', 'gluten', 'dairy']),
    },
    {
      id: 2,
      name: 'Murakami Ramen Bowl',
      price: 250.0,
      image:
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
      restaurant: 'Murakami',
      tags: new Set(['pork', 'gluten', 'egg']),
    },
    {
      id: 3,
      name: 'Landers Pepperoni Pizza',
      price: 350.0,
      image:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
      restaurant: 'Landers',
      tags: new Set(['pork', 'gluten', 'dairy']),
    },
    {
      id: 4,
      name: 'Chicken Inasal Meal',
      price: 95.0,
      image:
        'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
      restaurant: 'Mang Inasal',
      tags: new Set(['chicken']),
    },
    {
      id: 5,
      name: 'Milk Tea Combo',
      price: 150.0,
      image:
        'https://images.unsplash.com/photo-1525385444278-fb1c9a81db3e?w=400&h=300&fit=crop',
      restaurant: 'Gong Cha',
      tags: new Set(['dairy']),
    },
    {
      id: 6,
      name: 'Sushi Platter',
      price: 450.0,
      image:
        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      restaurant: 'Sushi Nori',
      tags: new Set(['seafood', 'soy']),
    },
  ];

  const WEIGHTS = { taste: 0.4, mood: 0.4, value: 0.2 };

  const sanitizeSessionForClient = (s, requestingToken = null) => {
    const participants = Array.from(s.participants.entries()).map(([token, p]) => ({
      token: token === requestingToken ? token : undefined, // only reveal your own token
      name: p.name,
      isRegistered: p.isRegistered,
      hasSubmitted: p.hasSubmitted,
    }));
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
      })),
    };
  };

  const broadcastState = (code) => {
    const s = sessions.get(code);
    if (!s) return;
    io.to(code).emit('session:state', sanitizeSessionForClient(s));
  };

  const computeResults = (s) => {
    const perOption = s.options.map((opt) => {
      let voters = 0;
      let tasteSum = 0,
        moodSum = 0,
        valueSum = 0;
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
      const score =
        tasteAvg * WEIGHTS.taste + moodAvg * WEIGHTS.mood + valueAvg * WEIGHTS.value;
      return {
        ...opt,
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
      for (const t of o.tags) if (avoid.has(t)) return false;
      return true;
    });
  };

  io.on('connection', (socket) => {
    // Create lobby
// 1) In session:create, accept { options } and validate
socket.on(
  "session:create",
  async ({ name, password, userId = null, isRegistered = !!userId, options = [] }, cb) => {
    try {
      if (!name || !password) return cb({ ok: false, error: "Missing fields" });

      // Clean/validate optional options (0..6)
      const cleaned = Array.isArray(options)
        ? options
            .map(o => ({
              id: undefined,
              name: String(o.name || "").trim(),
              restaurant: String(o.restaurant || "").trim(),
              price: Number(o.price),
              image: String(o.image || "").trim(),
              tags: new Set(),
            }))
            .filter(o => o.name && o.restaurant && o.price > 0)
        : [];
      if (cleaned.length > 6) return cb({ ok: false, error: "Max 6 options" });
      cleaned.forEach((o, i) => (o.id = i + 1));

      const code = generateCode();
      const passwordHash = await bcrypt.hash(String(password), 8);

      const s = {
        code,
        passwordHash,
        host: { userId, name, isRegistered: !!userId },
        participants: new Map(),
        baseOptions: cleaned,          // host-set list (can be empty initially)
        options: cleaned.slice(),      // filtered list (non-negotiables)
        isVotingOpen: false,
        ratings: new Map(),
        createdAt: new Date(),
      };

      const hostToken = nanoid();
      s.participants.set(hostToken, {
        name,
        isRegistered: !!userId,
        hasSubmitted: false,
        socketId: socket.id,
      });

      sessions.set(code, s);
      socket.join(code);

      cb({
        ok: true,
        code,
        participantToken: hostToken,
        state: sanitizeSessionForClient(s, hostToken),
      });
      broadcastState(code);
    } catch (e) {
      cb({ ok: false, error: "Failed to create session" });
    }
  }
);

socket.on("session:updateOptions", ({ code, token, options }, cb) => {
  const s = sessions.get(code);
  if (!s) return cb({ ok: false, error: "Invalid code" });
  if (s.isVotingOpen) return cb({ ok: false, error: "Voting already started" });

  // Only host can update
  const p = s.participants.get(token);
  if (!p || p.name !== s.host.name) {
    return cb({ ok: false, error: "Only host can update options" });
  }

  // Validate 1..6 items
  const cleaned = Array.isArray(options)
    ? options
        .map(o => ({
          id: undefined,
          name: String(o.name || "").trim(),
          restaurant: String(o.restaurant || "").trim(),
          price: Number(o.price),
          image: String(o.image || "").trim(),
          tags: new Set(),
        }))
        .filter(o => o.name && o.restaurant && o.price > 0)
    : [];

  if (cleaned.length === 0) return cb({ ok: false, error: "Add at least one option" });
  if (cleaned.length > 6) return cb({ ok: false, error: "Max 6 options" });

  cleaned.forEach((o, i) => (o.id = i + 1));

  // Save and re-filter (respect non-negotiables)
  s.baseOptions = cleaned;
  s.options = filterOptionsByNonNegotiables(
    s.baseOptions,
    Array.from(s.participants.values())
  );

  // Reset any previous ratings since the option set changed
  s.ratings.clear();
  s.participants.forEach(part => (part.hasSubmitted = false));

  cb({ ok: true, state: sanitizeSessionForClient(s, token) });
  broadcastState(code);
});

    // Join lobby (guests allowed)
    socket.on(
      'session:join',
      async (
        { code, password, name, isRegistered = false, existingToken = null, restrictions = null },
        cb
      ) => {
        const s = sessions.get(code);
        if (!s) return cb({ ok: false, error: 'Invalid code' });

        const ok = await bcrypt.compare(String(password || ''), s.passwordHash);
        if (!ok) return cb({ ok: false, error: 'Wrong password' });

        let token =
          existingToken && s.participants.has(existingToken) ? existingToken : nanoid();

        s.participants.set(token, {
          name,
          isRegistered,
          hasSubmitted: s.participants.get(token)?.hasSubmitted || false,
          socketId: socket.id,
          restrictions: restrictions?.avoidTags?.length
            ? { avoidTags: new Set(restrictions.avoidTags) }
            : undefined,
        });

        // Recompute options based on non-negotiables
        s.options = filterOptionsByNonNegotiables(
        s.baseOptions,
        Array.from(s.participants.values())
        );

        
        socket.join(code);
        cb({
          ok: true,
          participantToken: token,
          state: sanitizeSessionForClient(s, token),
        });
        broadcastState(code);
      }
    );

    socket.on('session:get', ({ code, token }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });
      if (!s.participants.has(token)) return cb({ ok: false, error: 'Not in session' });
      cb({ ok: true, state: sanitizeSessionForClient(s, token) });
    });

    // Only host can start
    socket.on('session:start', ({ code, token }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });

      const requester = s.participants.get(token);
      if (!requester || requester.name !== s.host.name)
        return cb({ ok: false, error: 'Only host can start' });

      s.isVotingOpen = true;
      cb({ ok: true });
      broadcastState(code);
    });

    // One submission per device (token)
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
        const taste = Math.max(1, Math.min(5, parseInt(r.taste, 10)));
        const mood = Math.max(1, Math.min(5, parseInt(r.mood, 10)));
        const value = Math.max(1, Math.min(5, parseInt(r.value, 10)));
        cleaned[opt.id] = { taste, mood, value };
      }
      if (Object.keys(cleaned).length === 0)
        return cb({ ok: false, error: 'No ratings provided' });

      s.ratings.set(token, cleaned);
      p.hasSubmitted = true;
      cb({ ok: true });
      broadcastState(code);
    });

    // Only host can end & trigger results
    socket.on('session:end', ({ code, token }, cb) => {
      const s = sessions.get(code);
      if (!s) return cb({ ok: false, error: 'Invalid code' });

      const requester = s.participants.get(token);
      if (!requester || requester.name !== s.host.name)
        return cb({ ok: false, error: 'Only host can end' });

      s.isVotingOpen = false;
      const leaderboard = computeResults(s);
      const winner = leaderboard[0] || null;

      io.to(code).emit('session:results', { leaderboard, winner });
      cb({ ok: true, leaderboard, winner });
    });

    socket.on('disconnect', () => {
      // We keep participants for simplicity; reconnects can reuse token.
    });
  });

  // (Optional) garbage collector for stale sessions
  setInterval(() => {
    const now = Date.now();
    for (const [code, s] of sessions.entries()) {
      if (now - s.createdAt.getTime() > 2 * 60 * 60 * 1000) {
        sessions.delete(code);
      }
    }
  }, 10 * 60 * 1000);
};
