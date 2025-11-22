// client/src/pages/Barkadavote.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Users,
  Crown,
  Trophy,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";


const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

/* ──────────────────────────────────────────────────────────────
   ⭐ StarRating — 0.5 increments, centered, clear overlay per star
   value: number 0..5 (steps of 0.5)
   onChange(newValue)
   ────────────────────────────────────────────────────────────── */
function StarRating({
  value = 0,
  onChange,
  size = 28,
  readOnly = false,
  showValue = true,
}) {
  const [hover, setHover] = useState(null);
  const containerRef = useRef(null);

  const display = hover != null ? hover : value;

  // Build an array of 5 stars, each with a per-star fill (0, 0.5, 1.0)
  const starFills = Array.from({ length: 5 }, (_, i) => {
    const diff = display - i;
    if (diff >= 1) return 1;
    if (diff >= 0.5) return 0.5;
    if (diff > 0) return 0.5;
    return 0;
  });

  // Events determine which star and half the cursor is on
  const onStarMove = (index) => (e) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const half = relX < rect.width / 2 ? 0.5 : 1.0;
    setHover(index + half);
  };
  const onStarLeave = () => {
    if (readOnly) return;
    setHover(null);
  };
  const onStarClick = (index) => () => {
    if (readOnly) return;
    const chosen = (hover != null ? hover : value) || index + 1;
    if (onChange) onChange(chosen);
  };

  return (
    <div
      ref={containerRef}
      className="inline-flex items-center gap-2"
      style={{ userSelect: "none" }}
      aria-label={`Rating ${display} of 5`}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={Number(display || 0).toFixed(1)}
    >
      <div className="inline-flex items-center gap-2">
        {starFills.map((fill, idx) => (
          <div
            key={idx}
            className="relative"
            style={{
              width: size,
              height: size,
              cursor: readOnly ? "default" : "pointer",
            }}
            onMouseMove={onStarMove(idx)}
            onMouseLeave={onStarLeave}
            onClick={onStarClick(idx)}
          >
            {/* Base star (gray) */}
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              style={{ position: "absolute", inset: 0 }}
              aria-hidden="true"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
                fill="#d1d5db"
              />
            </svg>

            {/* Filled star (gold) with precise width clip for half */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${fill * 100}%`,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                aria-hidden="true"
              >
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
                  fill="#f59e0b"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
      {showValue && (
        <span
          className="text-xs font-semibold text-gray-600 tabular-nums"
          style={{ minWidth: 32 }}
        >
          {Number(display || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default function BarkadaVote() {
  // 🔧 Default settings (now includes AI + maxParticipants + numOptions)
  const defaultSettings = {
    engine: "manual", // "manual" | "ai"
    mode: "host_only", // manual only: "host_only" | "per_user"
    perUserLimit: 2,
    maxParticipants: 10,
    numOptions: 4, // AI: number of restaurants to suggest (1–6)
    weights: { taste: 40, mood: 40, value: 20 },
    votingSeconds: 90,
    inactivityMinutes: 5,
  };

  // Socket
  const socketRef = useRef(null);
  const [connState, setConnState] = useState("connecting");

  // View
  const [currentView, setCurrentView] = useState("home");

  // Create form
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  // Join form
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Session
  const [sessionCode, setSessionCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [options, setOptions] = useState([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [host, setHost] = useState(null);
  const [copied, setCopied] = useState(false);
  const [createdAt, setCreatedAt] = useState(null);
  const [lastActivityAt, setLastActivityAt] = useState(null);

  // Settings (from server)
  const [settings, setSettings] = useState(defaultSettings);

  // Timers
  const [votingEndsAt, setVotingEndsAt] = useState(null);
  const [remainingVoting, setRemainingVoting] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingExpire, setRemainingExpire] = useState(null);

  // Device token
  const [participantToken, setParticipantToken] = useState(
    localStorage.getItem("barkada_vote_token") || ""
  );

  // Ratings map
  const [ratings, setRatings] = useState({});

  // Lobby menu editor (host)
  const [menuDraft, setMenuDraft] = useState([]);

  // Per-user options
  const [myDraft, setMyDraft] = useState([
    { name: "", restaurant: "", price: "", image: "" },
  ]);

  // Settings modal (LOBBY ONLY)
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(defaultSettings);

  // ⭐ AI preferences + modal
  const [aiPrefs, setAiPrefs] = useState({
    area: "",
    budgetPerPerson: "",
    cuisinesLike: "",
    cuisinesAvoid: "",
    allergens: "",
    notes: "",
  });
  const [showAIPrefs, setShowAIPrefs] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

    // For logged-out users (guest)
  const [guestRestrictions, setGuestRestrictions] = useState({
    allergens: "",
    diet: "",
  });
  const [showGuestPrefs, setShowGuestPrefs] = useState(false);

  // For storing a “pending join” when we pop the modal
  const pendingJoinRef = useRef(null);


  const { user: authUser } = useAuth(); 

  /* Socket setup */
  useEffect(() => {
    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = s;

    s.on("connect", () => setConnState("connected"));
    s.on("connect_error", () => setConnState("error"));
    s.on("disconnect", () => setConnState("error"));

    s.on("session:state", (state) => {
      setParticipants(state.participants || []);
      setOptions(state.options || []);
      setIsVotingOpen(state.isVotingOpen);
      setHost(state.host || null);
      if (state.settings) {
        setSettings(state.settings);
        setSettingsDraft(state.settings);
      }
      if (state.createdAt) setCreatedAt(state.createdAt);
      if (state.lastActivityAt) setLastActivityAt(state.lastActivityAt);
      if (state.votingEndsAt) setVotingEndsAt(state.votingEndsAt);
      if (state.expiresAt) setExpiresAt(state.expiresAt);
    });

    s.on("session:results", ({ leaderboard, winner }) => {
      window.__barkadaResults = { leaderboard, winner };
      setCurrentView("results");
    });

    s.on("session:expired", () => {
      alert("This lobby has expired due to inactivity.");
      setCurrentView("home");
      setParticipants([]);
      setOptions([]);
      setSessionCode("");
      setVotingEndsAt(null);
      setExpiresAt(null);
    });

    return () => {
      s.off("session:state");
      s.off("session:results");
      s.off("session:expired");
      s.disconnect();
    };
  }, []);

  /* Auto navigate to voting when opened */
  useEffect(() => {
    if (isVotingOpen && (currentView === "lobby" || currentView === "home")) {
      setCurrentView("voting");
    }
  }, [isVotingOpen, currentView]);

  /* Voting countdown */
  useEffect(() => {
    if (!votingEndsAt) {
      setRemainingVoting(null);
      return;
    }
    const tick = () => {
      const ms = new Date(votingEndsAt).getTime() - Date.now();
      setRemainingVoting(ms > 0 ? ms : 0);
      if (ms <= 0) {
        const socket = socketRef.current;
        if (socket) {
          socket.emit(
            "session:end",
            { code: sessionCode, token: participantToken },
            () => {}
          );
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [votingEndsAt, sessionCode, participantToken]);

  /* Inactivity countdown */
  useEffect(() => {
    if (!expiresAt || isVotingOpen) {
      setRemainingExpire(null);
      return;
    }
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemainingExpire(ms > 0 ? ms : 0);
      if (ms <= 0) {
        const socket = socketRef.current;
        if (socket) {
          socket.emit("session:expire", { code: sessionCode }, () => {});
        }
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [expiresAt, isVotingOpen, sessionCode]);

  /* Sync host menuDraft from options when in lobby (top-level hook, not conditional) */
  const optionsKey = JSON.stringify(options);
  useEffect(() => {
    if (currentView === "lobby" && isHost && !isVotingOpen) {
      setMenuDraft(
        (options || []).map((o) => ({
          name: o.name || "",
          restaurant: o.restaurant || "",
          price: o.price || "",
          image: o.image || "",
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, isHost, isVotingOpen, optionsKey]);

  /* UI helpers */
  const ConnBadge = useMemo(() => {
    const base = "px-2 py-1 rounded-lg text-xs font-semibold";
    if (connState === "connected")
      return (
        <span className={`${base} bg-green-100 text-green-700`}>Connected</span>
      );
    if (connState === "connecting")
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>
          Connecting…
        </span>
      );
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        Connection Error
      </span>
    );
  }, [connState]);

  const copyToClipboard = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fmtTime = (ms) => {
    if (ms == null) return "";
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(1, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const setRatingField = (id, key, val) => {
    setRatings((prev) => {
      const cur = prev[id] || { taste: 0, mood: 0, value: 0 };
      return { ...prev, [id]: { ...cur, [key]: val } };
    });
  };

  /* Actions */
  const handleCreateSession = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    if (!createName || !createPassword) return alert("Enter name & password");

    socket.emit(
      "session:create",
      { name: createName, password: createPassword, userId: null, isRegistered: false },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Create failed");
        setSessionCode(res.code);
        setIsHost(true);
        setParticipantToken(res.participantToken);
        localStorage.setItem("barkada_vote_token", res.participantToken);

        const st = res.state;
        setParticipants(st.participants || []);
        setOptions(st.options || []);
        setIsVotingOpen(st.isVotingOpen);
        setHost(st.host || null);
        if (st.settings) {
          setSettings(st.settings);
          setSettingsDraft(st.settings);
        } else {
          setSettings(defaultSettings);
          setSettingsDraft(defaultSettings);
        }
        if (st.createdAt) setCreatedAt(st.createdAt);
        if (st.expiresAt) setExpiresAt(st.expiresAt);

        setCurrentView("lobby");
        // Immediately open settings modal so host can choose Manual/AI, max participants, etc.
        setShowSettings(true);
      }
    );
  };

const doJoin = (restrictionsOverride = null) => {
  const socket = socketRef.current;
  if (!socket) return alert("Not connected yet.");
  if (connState !== "connected") return alert("Not connected yet.");
  if (!joinName || !joinCode || !joinPassword) return alert("Fill all fields");

  socket.emit(
    "session:join",
    {
      code: joinCode,
      password: joinPassword,
      name: joinName,
      isRegistered: !!authUser,
      userId: authUser?._id || null,
      existingToken: participantToken || null,
      restrictions: restrictionsOverride, // null for logged-in or guest-without-prefs
    },
    (res) => {
      if (!res?.ok) return alert(res?.error || "Join failed");

      setSessionCode(joinCode);
      setIsHost(false);
      setParticipantToken(res.participantToken);
      localStorage.setItem("barkada_vote_token", res.participantToken);

      const st = res.state;
      setParticipants(st.participants || []);
      setOptions(st.options || []);
      setIsVotingOpen(st.isVotingOpen);
      setHost(st.host || null);
      if (st.settings) {
        setSettings(st.settings);
        setSettingsDraft(st.settings);
      } else {
        setSettings(defaultSettings);
        setSettingsDraft(defaultSettings);
      }
      if (st.createdAt) setCreatedAt(st.createdAt);
      if (st.expiresAt) setExpiresAt(st.expiresAt);

      // Example: you can read st.groupAvoid / st.groupDiet here if you want
      // console.log("Group avoid:", st.groupAvoid, "Group diet:", st.groupDiet);

      setCurrentView("lobby");
    }
  );
};

const handleJoinSession = () => {
  // Logged-in: just join, server will pull from UserPreferences
  if (authUser) {
    return doJoin(null);
  }

  // Logged-out: pop modal first (optional)
  pendingJoinRef.current = true;
  setShowGuestPrefs(true);
};

  const saveMenuToServer = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (!isHost || isVotingOpen) return;
    if (connState !== "connected") return alert("Not connected yet.");

    const cleaned = menuDraft
      .map((o) => ({
        name: String(o.name || "").trim(), // Restaurant name
        restaurant: String(o.restaurant || "").trim(), // Area / branch
        price: Number(o.price),
        image: String(o.image || "").trim(),
      }))
      .filter((o) => o.name && o.restaurant && o.price > 0);
    if (cleaned.length === 0) return alert("Add at least one restaurant");
    if (cleaned.length > 6) return alert("Max 6 restaurants");

    socket.emit(
      "session:updateOptions",
      { code: sessionCode, token: participantToken, options: cleaned },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Save failed");
        alert("Menu saved! ✅");
      }
    );
  };

  const pushMyOptions = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    const limit = settings?.perUserLimit || 2;

    const cleaned = myDraft
      .map((o) => ({
        name: String(o.name || "").trim(), // Restaurant name
        restaurant: String(o.restaurant || "").trim(), // Area / branch
        price: Number(o.price),
        image: String(o.image || "").trim(),
      }))
      .filter((o) => o.name && o.restaurant && o.price > 0)
      .slice(0, limit);

    if (cleaned.length === 0) return alert("Add at least one restaurant");
    if (cleaned.length > limit)
      return alert(`Max ${limit} options per person`);

    socket.emit(
      "session:addUserOptions",
      { code: sessionCode, token: participantToken, options: cleaned },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Failed to submit options");
        alert("Your options have been submitted! ✅");
      }
    );
  };

  const startVoting = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    if (participants.length < 2)
      return alert("Need at least 2 participants to start.");
    if (!options || options.length === 0)
      return alert(
        "Please add at least one restaurant before starting the vote."
      );

    socket.emit(
      "session:start",
      {
        code: sessionCode,
        token: participantToken,
        votingSeconds: settings.votingSeconds || 90,
        weights: settings.weights,
      },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Start failed");
        if (res.votingEndsAt) setVotingEndsAt(res.votingEndsAt);
        setCurrentView("voting");
      }
    );
  };

  const submitRatings = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");

    const cleaned = {};
    Object.entries(ratings).forEach(([id, r]) => {
      const t = Math.max(0, Math.min(5, Number(r.taste) || 0));
      const m = Math.max(0, Math.min(5, Number(r.mood) || 0));
      const v = Math.max(0, Math.min(5, Number(r.value) || 0));
      if (t > 0 || m > 0 || v > 0) {
        cleaned[id] = { taste: t, mood: m, value: v };
      }
    });
    if (!Object.keys(cleaned).length) return alert("Rate at least one option");

    socket.emit(
      "session:submitRatings",
      { code: sessionCode, token: participantToken, ratings: cleaned },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Submit failed");
        alert("Ratings submitted! 👍");
      }
    );
  };

  const endVoting = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    socket.emit(
      "session:end",
      { code: sessionCode, token: participantToken },
      (res) => {
        if (!res?.ok) return alert(res?.error || "End failed");
        window.__barkadaResults = {
          leaderboard: res.leaderboard,
          winner: res.winner,
        };
        setCurrentView("results");
      }
    );
  };

  const saveSettings = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");

    const draft = settingsDraft || defaultSettings;

    // Engine: "manual" or "ai"
    const engine = draft.engine === "ai" ? "ai" : "manual";

    // Weights
    const w = draft.weights || { taste: 0, mood: 0, value: 0 };
    const sum = Number(w.taste) + Number(w.mood) + Number(w.value);
    if (sum !== 100) return alert("Weights must add up to 100%.");

    // Voting duration
    const votingSeconds = Number(draft.votingSeconds);
    if (votingSeconds < 30 || votingSeconds > 300)
      return alert("Voting duration must be between 30 and 300 seconds.");

    // Inactivity
    const inactivityMinutes = Number(draft.inactivityMinutes || 5);
    if (inactivityMinutes < 1 || inactivityMinutes > 60)
      return alert("Inactivity timeout must be between 1 and 60 minutes.");

    // Max participants
    const maxParticipants = Number(draft.maxParticipants || 10);
    if (maxParticipants < 2 || maxParticipants > 20)
      return alert("Max participants must be between 2 and 20.");

    // Number of restaurants (AI)
    const numOptions = Number(draft.numOptions || 4);
    if (numOptions < 1 || numOptions > 6)
      return alert("Number of restaurants must be between 1 and 6.");

    // Manual-only fields
    let mode = draft.mode;
    let perUserLimit = Number(draft.perUserLimit || 2);

    if (engine === "manual") {
      if (!["host_only", "per_user"].includes(mode)) mode = "host_only";
      if (mode === "per_user" && ![1, 2, 3].includes(perUserLimit)) {
        return alert("Per-user limit must be 1, 2, or 3.");
      }
    } else {
      // AI mode ignores per-user manual adding
      mode = "host_only";
      perUserLimit = 0;
    }

    socket.emit(
      "session:updateSettings",
      {
        code: sessionCode,
        token: participantToken,
        settings: {
          engine,
          mode,
          perUserLimit,
          maxParticipants,
          numOptions,
          weights: {
            taste: Number(w.taste),
            mood: Number(w.mood),
            value: Number(w.value),
          },
          votingSeconds,
          inactivityMinutes,
        },
      },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Failed to save settings");
        if (res.state?.settings) {
          setSettings(res.state.settings);
          setSettingsDraft(res.state.settings);
        }
        setShowSettings(false);
      }
    );
  };

  const handleGenerateAIOptions = () => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (!isHost) return alert("Only the host can generate AI recommendations.");
    if (!sessionCode) return alert("No session code.");

    // If prefs are basically empty, force the modal first
    if (
      !authUser &&
      !aiPrefs.area &&
      !aiPrefs.budgetPerPerson &&
      !aiPrefs.cuisinesLike &&
      !aiPrefs.cuisinesAvoid &&
      !aiPrefs.allergens
    ) {
      setShowAIPrefs(true);
      return;
    }

    setAiLoading(true);
    socket.emit(
      "session:aiGenerate",
      {
        code: sessionCode,
        token: participantToken,
        prefs: aiPrefs,
      },
      (res) => {
        setAiLoading(false);
        if (!res?.ok) return alert(res?.error || "Failed to generate AI recommendations");

        const st = res.state;
        setOptions(st.options || []);
        if (st.settings) {
          setSettings(st.settings);
          setSettingsDraft(st.settings);
        }
        if (st.expiresAt) setExpiresAt(st.expiresAt);
        if (st.lastActivityAt) setLastActivityAt(st.lastActivityAt);

        alert("AI restaurant recommendations updated! 🍽️");
      }
    );
  };

  /* Views */
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">
              Barkada <span className="text-yellow-500">Vote</span>
            </h1>
            {ConnBadge}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* CREATE */}
            <div className="bg-white rounded-3xl p-6 shadow border">
              <h2 className="text-xl font-bold">Create Session</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border rounded-2xl"
                />
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Session Password"
                  className="w-full px-4 py-3 border rounded-2xl"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You can choose Manual or AI mode and configure settings in the
                lobby.
              </p>
              <button
                onClick={handleCreateSession}
                disabled={connState !== "connected"}
                className={`w-full mt-4 font-bold py-3 rounded-2xl text-white ${
                  connState === "connected"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-300"
                }`}
              >
                Create Lobby
              </button>
            </div>

            {/* JOIN */}
            <div className="bg-white rounded-3xl p-6 shadow border">
              <h2 className="text-xl font-bold">Join Session</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border rounded-2xl"
                />
                <input
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder="Session Code (5 digits)"
                  maxLength={5}
                  className="w-full px-4 py-3 border rounded-2xl text-center tracking-widest"
                />
              </div>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Password"
                className="w-full mt-3 px-4 py-3 border rounded-2xl"
              />
              <button
                onClick={handleJoinSession}
                disabled={connState !== "connected"}
                className={`w-full mt-4 font-bold py-3 rounded-2xl text-white ${
                  connState === "connected"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300"
                }`}
              >
                Join Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "lobby") {
    const canStart = participants.length >= 2 && options.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <h1 className="font-bold text-xl">Lobby</h1>
          </div>
          <div className="flex items-center gap-3">
            {expiresAt && !isVotingOpen && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
                Expires in {fmtTime(remainingExpire)}
              </span>
            )}
            <button
              className="px-3 py-2 border rounded-xl flex items-center gap-2 text-sm"
              onClick={() => {
                setSettingsDraft(settings);
                setShowSettings(true);
              }}
              disabled={!isHost}
              title="Lobby settings"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            {ConnBadge}
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* PROMINENT CODE */}
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-3xl p-6 mb-6 text-center shadow">
            <p className="text-sm opacity-90">Session Code</p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="text-5xl font-extrabold tracking-widest">
                {sessionCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl border border-white/30 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

                              {/* CURRENT OPTIONS VISIBLE TO EVERYONE (before voting) */}
          {options && options.length > 0 && (
            <div className="mt-6 bg-white rounded-3xl p-6 border">
              <h3 className="font-bold mb-3">Current Restaurants in the Vote</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="border rounded-2xl overflow-hidden bg-gray-50"
                  >
                    {opt.image ? (
                      <img
                        src={opt.image}
                        alt={opt.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-semibold text-sm">{opt.name}</div>
                      <div className="text-xs text-gray-600">
                        {opt.restaurant}
                      </div>
                      <div className="text-xs text-yellow-700 font-bold mt-1">
                        ₱{Number(opt.price).toFixed(2)} / person
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          <div className="bg-white rounded-3xl p-6 border">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-600" /> Participants (
              {participants.length}
              {settings.maxParticipants
                ? `/${settings.maxParticipants}`
                : ""}
              )
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {participants.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border rounded-2xl px-4 py-3 bg-white"
                >
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    {host?.name === p.name && (
                      <div className="text-xs text-yellow-600 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Host
                      </div>
                    )}
                  </div>
                  {p.hasSubmitted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-xl">
                      Submitted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 🔹 AI Mode Panel */}
          {settings.engine === "ai" && (
            <div className="mt-6 bg-white rounded-3xl p-6 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">AI Restaurant Recommendations</h3>
                {isHost && (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 border rounded-xl text-sm"
                      onClick={() => setShowAIPrefs(true)}
                    >
                      Edit preferences
                    </button>
                    <button
                      onClick={handleGenerateAIOptions}
                      disabled={aiLoading || connState !== "connected"}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold text-white ${
                        aiLoading || connState !== "connected"
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600"
                      }`}
                    >
                      {aiLoading ? "Generating…" : "Generate with AI"}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {isHost
                  ? "We’ll use your group’s preferences (budget, area, allergens, etc.) to suggest restaurants. You can refine and regenerate anytime."
                  : "The host is using AI to suggest restaurants. You’ll see options appear here once they’re generated."}
              </p>
            </div>
          )}

          {/* HOST MENU EDITOR (Manual mode only) */}
          {isHost &&
            !isVotingOpen &&
            settings.engine === "manual" &&
            settings.mode === "host_only" && (
              <div className="mt-6 bg-white rounded-3xl p-6 border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Manage Restaurants (max 6)</h3>
                  <button
                    onClick={() =>
                      setMenuDraft((prev) =>
                        prev.length >= 6
                          ? prev
                          : [
                              ...prev,
                              {
                                name: "",
                                restaurant: "",
                                price: "",
                                image: "",
                              },
                            ]
                      )
                    }
                    disabled={menuDraft.length >= 6}
                    className={`px-3 py-2 rounded-xl border ${
                      menuDraft.length >= 6
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Plus className="w-4 h-4 inline-block" /> Add Restaurant
                  </button>
                </div>

                <div className="space-y-3">
                  {menuDraft.map((o, i) => (
                    <div
                      key={i}
                      className="border rounded-2xl p-3 grid sm:grid-cols-12 gap-2"
                    >
                      <input
                        placeholder="Restaurant name"
                        value={o.name}
                        onChange={(e) =>
                          setMenuDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, name: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Area / Branch (e.g. UST, BGC)"
                        value={o.restaurant}
                        onChange={(e) =>
                          setMenuDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, restaurant: e.target.value }
                                : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Avg price per person (₱)"
                        type="number"
                        min="1"
                        value={o.price}
                        onChange={(e) =>
                          setMenuDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, price: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-2 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Image URL"
                        value={o.image}
                        onChange={(e) =>
                          setMenuDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, image: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <button
                        onClick={() =>
                          setMenuDraft((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="sm:col-span-1 px-3 py-2 rounded-xl border flex items-center justify-center"
                        aria-label="remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={saveMenuToServer}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-2xl"
                  >
                    Save Menu
                  </button>
                </div>
              </div>
            )}

          {/* PER-USER ADD (Manual mode only) */}
          {!isVotingOpen &&
            settings.engine === "manual" &&
            settings.mode === "per_user" && (
              <div className="mt-6 bg-white rounded-3xl p-6 border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">
                    Add Your Restaurants (max {settings.perUserLimit})
                  </h3>
                  <button
                    onClick={() =>
                      setMyDraft((prev) =>
                        prev.length >= settings.perUserLimit
                          ? prev
                          : [
                              ...prev,
                              {
                                name: "",
                                restaurant: "",
                                price: "",
                                image: "",
                              },
                            ]
                      )
                    }
                    disabled={myDraft.length >= settings.perUserLimit}
                    className={`px-3 py-2 rounded-xl border ${
                      myDraft.length >= settings.perUserLimit
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Plus className="w-4 h-4 inline-block" /> Add Restaurant
                  </button>
                </div>

                <div className="space-y-3">
                  {myDraft.map((o, i) => (
                    <div
                      key={i}
                      className="border rounded-2xl p-3 grid sm:grid-cols-12 gap-2"
                    >
                      <input
                        placeholder="Restaurant name"
                        value={o.name}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, name: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Area / Branch (e.g. UST, BGC)"
                        value={o.restaurant}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, restaurant: e.target.value }
                                : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Avg price per person (₱)"
                        type="number"
                        min="1"
                        value={o.price}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, price: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-2 px-3 py-2 border rounded-xl"
                      />
                      <input
                        placeholder="Image URL"
                        value={o.image}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, image: e.target.value } : x
                            )
                          )
                        }
                        className="sm:col-span-3 px-3 py-2 border rounded-xl"
                      />
                      <button
                        onClick={() =>
                          setMyDraft((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="sm:col-span-1 px-3 py-2 rounded-xl border flex items-center justify-center"
                        aria-label="remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={pushMyOptions}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-2xl"
                  >
                    Submit My Restaurants
                  </button>
                </div>
              </div>
            )}

          {/* CONTROLS */}
          <div className="mt-6">
            {isHost ? (
              <button
                onClick={startVoting}
                disabled={connState !== "connected" || !canStart}
                className={`w-full font-bold py-4 rounded-2xl text-white ${
                  connState === "connected" && canStart
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isVotingOpen ? "Voting In Progress" : "Start Voting"}
              </button>
            ) : (
              <div className="text-center text-gray-700 py-4 border rounded-2xl bg-blue-50">
                {isVotingOpen
                  ? "Voting started — opening…"
                  : "Waiting for host to start…"}
              </div>
            )}
          </div>

          {isHost && (
            <button
              onClick={endVoting}
              disabled={connState !== "connected"}
              className={`w-full font-bold py-4 rounded-2xl text-white mt-4 ${
                connState === "connected"
                  ? "bg-gray-800 hover:bg-black"
                  : "bg-gray-300"
              }`}
            >
              End Voting
            </button>
          )}
        </div>

        {/* LOBBY SETTINGS MODAL */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Lobby Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Manual or AI */}
                <div>
                  <label className="font-semibold text-sm block mb-1">
                    Manual or AI
                  </label>
                  <select
                    className="w-full border rounded-xl px-3 py-2"
                    value={settingsDraft.engine}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        engine: e.target.value === "ai" ? "ai" : "manual",
                      }))
                    }
                  >
                    <option value="manual">Manually choose (default)</option>
                    <option value="ai">
                      Use AI to generate recommendations
                    </option>
                  </select>
                </div>

                {/* If manual, show mode + per-user limit */}
                {settingsDraft.engine !== "ai" && (
                  <>
                    <div>
                      <label className="font-semibold text-sm block mb-1">
                        Manual mode
                      </label>
                      <select
                        className="w-full border rounded-xl px-3 py-2"
                        value={settingsDraft.mode}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({
                            ...p,
                            mode: e.target.value,
                          }))
                        }
                      >
                        <option value="host_only">
                          Admin chooses everything
                        </option>
                        <option value="per_user">Each person submits</option>
                      </select>
                    </div>

                    {settingsDraft.mode === "per_user" && (
                      <div>
                        <label className="font-semibold text-sm block mb-1">
                          Per-user limit
                        </label>
                        <select
                          className="w-full border rounded-xl px-3 py-2"
                          value={settingsDraft.perUserLimit}
                          onChange={(e) =>
                            setSettingsDraft((p) => ({
                              ...p,
                              perUserLimit: Number(e.target.value),
                            }))
                          }
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Max participants */}
                <div>
                  <label className="font-semibold text-sm block mb-1">
                    Maximum participants
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    className="w-full border rounded-xl px-3 py-2"
                    value={settingsDraft.maxParticipants}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        maxParticipants: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    People who try to join after this limit will see a “Lobby is
                    full” message.
                  </p>
                </div>

                {/* Number of restaurants (AI) */}
                <div>
                  <label className="font-semibold text-sm block mb-1">
                    Number of restaurants (for AI suggestions)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="w-full border rounded-xl px-3 py-2"
                    value={settingsDraft.numOptions}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        numOptions: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    AI will suggest up to this many restaurants (max 6).
                  </p>
                </div>

                {/* Weights */}
                <div>
                  <label className="font-semibold text-sm block mb-1">
                    Weights (must total 100%)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Taste</span>
                      <input
                        type="number"
                        className="w-full border rounded-xl px-3 py-2"
                        value={settingsDraft.weights.taste}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({
                            ...p,
                            weights: {
                              ...p.weights,
                              taste: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Mood</span>
                      <input
                        type="number"
                        className="w-full border rounded-xl px-3 py-2"
                        value={settingsDraft.weights.mood}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({
                            ...p,
                            weights: {
                              ...p.weights,
                              mood: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Value</span>
                      <input
                        type="number"
                        className="w-full border rounded-xl px-3 py-2"
                        value={settingsDraft.weights.value}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({
                            ...p,
                            weights: {
                              ...p.weights,
                              value: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current total:{" "}
                    {Number(settingsDraft.weights.taste) +
                      Number(settingsDraft.weights.mood) +
                      Number(settingsDraft.weights.value)}
                    %
                  </p>
                </div>

                {/* Durations */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-sm block mb-1">
                      Voting duration (sec)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-xl px-3 py-2"
                      value={settingsDraft.votingSeconds}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({
                          ...p,
                          votingSeconds: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-sm block mb-1">
                      Inactivity timeout (min)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-xl px-3 py-2"
                      value={settingsDraft.inactivityMinutes}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({
                          ...p,
                          inactivityMinutes: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 border rounded-2xl py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl py-3 font-bold"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Preferences Modal */}
        {showAIPrefs && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">AI Preferences</h3>
                <button
                  onClick={() => setShowAIPrefs(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Preferred area / location
                  </label>
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. UST area, Sampaloc, Quezon City, BGC…"
                    value={aiPrefs.area}
                    onChange={(e) =>
                      setAiPrefs((p) => ({ ...p, area: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Budget per person (₱)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. 200–400"
                    value={aiPrefs.budgetPerPerson}
                    onChange={(e) =>
                      setAiPrefs((p) => ({
                        ...p,
                        budgetPerPerson: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Cuisines you like
                  </label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. Filipino, Korean BBQ, ramen, pizza…"
                    value={aiPrefs.cuisinesLike}
                    onChange={(e) =>
                      setAiPrefs((p) => ({
                        ...p,
                        cuisinesLike: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Cuisines you want to avoid
                  </label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. spicy food, very oily food, etc."
                    value={aiPrefs.cuisinesAvoid}
                    onChange={(e) =>
                      setAiPrefs((p) => ({
                        ...p,
                        cuisinesAvoid: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Allergens / must-avoid ingredients (important)
                  </label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. peanuts, shellfish, dairy, egg…"
                    value={aiPrefs.allergens}
                    onChange={(e) =>
                      setAiPrefs((p) => ({
                        ...p,
                        allergens: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">
                    Extra notes
                  </label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2"
                    placeholder="e.g. prefer fast-casual; walking distance only; no buffet…"
                    value={aiPrefs.notes}
                    onChange={(e) =>
                      setAiPrefs((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowAIPrefs(false)}
                  className="flex-1 border rounded-2xl py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAIPrefs(false);
                    handleGenerateAIOptions();
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl py-3 font-bold"
                >
                  Save & Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === "voting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 pb-24">
        <header className="bg-white sticky top-0 border-b px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setCurrentView("lobby")}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-xl">Rate Options</h1>
          <div className="ml-auto flex items-center gap-3">
            {remainingVoting != null && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                Ends in {fmtTime(remainingVoting)}
              </span>
            )}
            {ConnBadge}
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((food) => {
            const r = ratings[food.id] || { taste: 0, mood: 0, value: 0 };
            return (
              <div
                key={food.id}
                className="bg-white border rounded-2xl overflow-hidden shadow-sm"
              >
                {food.image ? (
                  <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold">{food.name}</h3>
                  <p className="text-sm text-gray-600">{food.restaurant}</p>
                  <p className="text-yellow-700 font-bold">
                    ₱{Number(food.price).toFixed(2)} avg / person
                  </p>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Taste</label>
                      <StarRating
                        value={r.taste}
                        onChange={(v) => setRatingField(food.id, "taste", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Mood</label>
                      <StarRating
                        value={r.mood}
                        onChange={(v) => setRatingField(food.id, "mood", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Value</label>
                      <StarRating
                        value={r.value}
                        onChange={(v) => setRatingField(food.id, "value", v)}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Weights: Taste {settings.weights.taste}% • Mood{" "}
                      {settings.weights.mood}% • Value{" "}
                      {settings.weights.value}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
          <button
            onClick={submitRatings}
            disabled={connState !== "connected"}
            className={`flex-1 font-bold py-4 rounded-2xl text-white ${
              connState === "connected"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-gray-300"
            }`}
          >
            Submit Ratings
          </button>
          {isHost && (
            <button
              onClick={endVoting}
              disabled={connState !== "connected"}
              className={`font-bold px-6 rounded-2xl text-white ${
                connState === "connected"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300"
              }`}
            >
              End Voting
            </button>
          )}
        </div>
      </div>
    );
  }

  if (currentView === "results") {
    const { leaderboard = [], winner = null } =
      window.__barkadaResults || {};
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <header className="bg-white border-b px-4 py-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h1 className="font-bold text-xl">Results</h1>
          <div className="ml-auto">{ConnBadge}</div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {winner && (
            <div className="text-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-3xl p-8 mb-6 shadow-lg">
              <Trophy className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-3xl font-bold mb-1">Winner!</h2>
              <p className="text-xl font-semibold">{winner.name}</p>
              <p className="text-sm opacity-90">
                Weighted Score:{" "}
                <strong>{winner.score.toFixed(2)}</strong> — Voters:{" "}
                {winner.voters}
              </p>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border shadow">
            <h3 className="font-bold mb-4">Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between border rounded-2xl p-3 ${
                    i === 0 ? "bg-yellow-50 border-yellow-300" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold">
                      {i + 1}
                    </div>
                    {opt.image ? (
                      <img
                        src={opt.image}
                        alt={opt.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100" />
                    )}
                    <div>
                      <p className="font-semibold">{opt.name}</p>
                      <p className="text-xs text-gray-600">
                        {opt.restaurant}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">
                      {opt.score.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      voters: {opt.voters}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCurrentView("home");
                  setParticipants([]);
                  setOptions([]);
                  window.__barkadaResults = null;
                }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-2xl"
              >
                New Session
              </button>
              <button
                onClick={() => setCurrentView("voting")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-2xl"
              >
                Vote Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
