// src/pages/BarkadaVote.js
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
} from "lucide-react";

// Derive API origin (works for localhost and LAN IPs)
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

export default function BarkadaVote() {
  // ──────────────────────────────────────────────────────────────
  // Socket
  // ──────────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  const [connState, setConnState] = useState("connecting"); // connecting | connected | error

  // ──────────────────────────────────────────────────────────────
  // Routing / view
  // ──────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState("home");

  // ──────────────────────────────────────────────────────────────
  // CREATE form state (separate from JOIN)
  // ──────────────────────────────────────────────────────────────
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  // ──────────────────────────────────────────────────────────────
  // JOIN form state (separate from CREATE)
  // ──────────────────────────────────────────────────────────────
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // ──────────────────────────────────────────────────────────────
  // Session state
  // ──────────────────────────────────────────────────────────────
  const [sessionCode, setSessionCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [options, setOptions] = useState([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [host, setHost] = useState(null);
  const [copied, setCopied] = useState(false);

  // One-vote-per-device token
  const [participantToken, setParticipantToken] = useState(
    localStorage.getItem("barkada_vote_token") || ""
  );

  // Ratings: { [optionId]: { taste, mood, value } }
  const [ratings, setRatings] = useState({});

  // Lobby menu editor (host only, editable before voting)
  const [menuDraft, setMenuDraft] = useState([]);

  // Optional: wire to your AuthContext if you have it
  const authUser = null;

  // ──────────────────────────────────────────────────────────────
  // Socket setup
  // ──────────────────────────────────────────────────────────────
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
    });

    s.on("session:results", ({ leaderboard, winner }) => {
      window.__barkadaResults = { leaderboard, winner };
      setCurrentView("results");
    });

    return () => {
      s.off("session:state");
      s.off("session:results");
      s.disconnect();
    };
  }, []);

  // Auto-navigate to voting when session opens (host or guests)
  useEffect(() => {
    if (isVotingOpen && (currentView === "lobby" || currentView === "home")) {
      setCurrentView("voting");
    }
  }, [isVotingOpen, currentView]);

  const socket = socketRef.current;

  // ──────────────────────────────────────────────────────────────
  // UI helpers
  // ──────────────────────────────────────────────────────────────
  const ConnBadge = useMemo(() => {
    const base = "px-2 py-1 rounded-lg text-xs font-semibold";
    if (connState === "connected")
      return <span className={`${base} bg-green-100 text-green-700`}>Connected</span>;
    if (connState === "connecting")
      return <span className={`${base} bg-yellow-100 text-yellow-700`}>Connecting…</span>;
    return <span className={`${base} bg-red-100 text-red-700`}>Connection Error</span>;
  }, [connState]);

  const copyToClipboard = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ──────────────────────────────────────────────────────────────
  // Lobby menu editor helpers
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentView === "lobby") {
      // Preload draft from current options
      setMenuDraft(
        (options || []).map((o) => ({
          name: o.name || "",
          restaurant: o.restaurant || "",
          price: o.price || "",
          image: o.image || "",
        }))
      );
    }
  }, [currentView, options]);

  const addDraftItem = () => {
    if (menuDraft.length >= 6) return;
    setMenuDraft((prev) => [
      ...prev,
      { name: "", restaurant: "", price: "", image: "" },
    ]);
  };

  const updateDraftItem = (i, key, val) => {
    setMenuDraft((prev) => prev.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)));
  };

  const removeDraftItem = (i) => {
    setMenuDraft((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveMenuToServer = () => {
    if (connState !== "connected") return alert("Not connected yet.");
    const cleaned = menuDraft
      .map((o) => ({
        name: String(o.name || "").trim(),
        restaurant: String(o.restaurant || "").trim(),
        price: Number(o.price),
        image: String(o.image || "").trim(),
      }))
      .filter((o) => o.name && o.restaurant && o.price > 0);
    if (cleaned.length === 0) return alert("Add at least one option");
    if (cleaned.length > 6) return alert("Max 6 options");

    socket.emit(
      "session:updateOptions",
      { code: sessionCode, token: participantToken, options: cleaned },
      (res) => {
        if (!res?.ok) return alert(res?.error || "Save failed");
        alert("Menu saved! ✅");
      }
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────
  const handleCreateSession = () => {
    if (connState !== "connected") return alert("Not connected yet.");
    if (!createName || !createPassword) return alert("Enter name & password");

    // Create lobby WITHOUT options; host will add them in lobby
    socket.emit(
      "session:create",
      {
        name: createName,
        password: createPassword,
        userId: authUser?.id || null,
        isRegistered: !!authUser,
        options: [], // host adds later
      },
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
        setCurrentView("lobby");
      }
    );
  };

  const handleJoinSession = () => {
    if (connState !== "connected") return alert("Not connected yet.");
    if (!joinName || !joinCode || !joinPassword) return alert("Fill all fields");

    socket.emit(
      "session:join",
      {
        code: joinCode,
        password: joinPassword,
        name: joinName,
        isRegistered: !!authUser,
        existingToken: participantToken || null,
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
        setCurrentView("lobby");
      }
    );
  };

  const startVoting = () => {
    if (connState !== "connected") return alert("Not connected yet.");
    // Optional: ensure menu exists
    if (!options || options.length === 0) {
      return alert("Please add at least one menu item before starting the vote.");
    }
    socket.emit("session:start", { code: sessionCode, token: participantToken }, (res) => {
      if (!res?.ok) return alert(res?.error || "Start failed");
      // Host goes to voting immediately; guests will auto-navigate via isVotingOpen
      setCurrentView("voting");
    });
  };

  const submitRatings = () => {
    if (connState !== "connected") return alert("Not connected yet.");

    const cleaned = {};
    Object.entries(ratings).forEach(([id, r]) => {
      const t = parseInt(r.taste, 10);
      const m = parseInt(r.mood, 10);
      const v = parseInt(r.value, 10);
      if ([t, m, v].every((x) => x >= 1 && x <= 5)) {
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
    if (connState !== "connected") return alert("Not connected yet.");
    socket.emit("session:end", { code: sessionCode, token: participantToken }, (res) => {
      if (!res?.ok) return alert(res?.error || "End failed");
      window.__barkadaResults = { leaderboard: res.leaderboard, winner: res.winner };
      setCurrentView("results");
    });
  };

  // ──────────────────────────────────────────────────────────────
  // VIEWS
  // ──────────────────────────────────────────────────────────────
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
            {/* CREATE SESSION */}
            <div className="bg-white rounded-3xl p-6 shadow border">
              <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-center mb-4">Create Session</h2>

              <div className="grid sm:grid-cols-2 gap-3">
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
                You can add restaurants in the lobby before starting the vote.
              </p>

              <button
                onClick={handleCreateSession}
                disabled={connState !== "connected"}
                className={`w-full mt-4 font-bold py-3 rounded-2xl text-white ${
                  connState === "connected" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300"
                }`}
              >
                Create Lobby
              </button>
            </div>

            {/* JOIN SESSION */}
            <div className="bg-white rounded-3xl p-6 shadow border">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-center mb-4">Join Session</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border rounded-2xl"
                />
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
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
                  connState === "connected" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <header className="bg-white border-b px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <h1 className="font-bold text-xl">Lobby</h1>
          </div>
          {ConnBadge}
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* PROMINENT CODE */}
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-3xl p-6 mb-6 text-center shadow">
            <p className="text-sm opacity-90">Session Code</p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="text-5xl font-extrabold tracking-widest">{sessionCode}</div>
              <button
                onClick={copyToClipboard}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl border border-white/30 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* PARTICIPANTS */}
          <div className="bg-white rounded-3xl p-6 border">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-600" /> Participants ({participants.length})
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

          {/* HOST MENU EDITOR (only before voting) */}
          {isHost && !isVotingOpen && (
            <div className="mt-6 bg-white rounded-3xl p-6 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Manage Menu (max 6)</h3>
                <button
                  onClick={addDraftItem}
                  disabled={menuDraft.length >= 6}
                  className={`px-3 py-2 rounded-xl border ${
                    menuDraft.length >= 6 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Plus className="w-4 h-4 inline-block" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {menuDraft.map((o, i) => (
                  <div key={i} className="border rounded-2xl p-3 grid sm:grid-cols-12 gap-2">
                    <input
                      placeholder="Food name"
                      value={o.name}
                      onChange={(e) => updateDraftItem(i, "name", e.target.value)}
                      className="sm:col-span-3 px-3 py-2 border rounded-xl"
                    />
                    <input
                      placeholder="Restaurant"
                      value={o.restaurant}
                      onChange={(e) => updateDraftItem(i, "restaurant", e.target.value)}
                      className="sm:col-span-3 px-3 py-2 border rounded-xl"
                    />
                    <input
                      placeholder="Price (₱)"
                      type="number"
                      min="1"
                      value={o.price}
                      onChange={(e) => updateDraftItem(i, "price", e.target.value)}
                      className="sm:col-span-2 px-3 py-2 border rounded-xl"
                    />
                    <input
                      placeholder="Image URL"
                      value={o.image}
                      onChange={(e) => updateDraftItem(i, "image", e.target.value)}
                      className="sm:col-span-3 px-3 py-2 border rounded-xl"
                    />
                    <button
                      onClick={() => removeDraftItem(i)}
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

          {/* CONTROLS */}
          <div className="mt-6">
            {isHost ? (
              <button
                onClick={startVoting}
                disabled={connState !== "connected"}
                className={`w-full font-bold py-4 rounded-2xl text-white ${
                  connState === "connected" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300"
                }`}
              >
                {isVotingOpen ? "Voting In Progress" : "Start Voting"}
              </button>
            ) : (
              <div className="text-center text-gray-700 py-4 border rounded-2xl bg-blue-50">
                {isVotingOpen ? "Voting started — opening…" : "Waiting for host to start…"}
              </div>
            )}
          </div>

          {isHost && (
            <button
              onClick={endVoting}
              disabled={connState !== "connected"}
              className={`w-full font-bold py-4 rounded-2xl text-white mt-4 ${
                connState === "connected" ? "bg-gray-800 hover:bg-black" : "bg-gray-300"
              }`}
            >
              End Voting
            </button>
          )}
        </div>
      </div>
    );
  }

  if (currentView === "voting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 pb-24">
        <header className="bg-white sticky top-0 border-b px-4 py-4 flex items-center gap-3">
          <button onClick={() => setCurrentView("lobby")} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-xl">Rate Options</h1>
          <div className="ml-auto">{ConnBadge}</div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((food) => {
            const r = ratings[food.id] || { taste: 3, mood: 3, value: 3 };
            return (
              <div key={food.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                {food.image ? (
                  <img src={food.image} alt={food.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold">{food.name}</h3>
                  <p className="text-sm text-gray-600">{food.restaurant}</p>
                  <p className="text-yellow-700 font-bold">₱{Number(food.price).toFixed(2)}</p>

                  <div className="mt-3 space-y-2">
                    {["taste", "mood", "value"].map((f) => (
                      <div key={f} className="flex justify-between items-center">
                        <label className="capitalize text-sm">{f}</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={r[f]}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [food.id]: { ...r, [f]: e.target.value },
                            }))
                          }
                          className="w-16 border rounded-lg text-center"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Weights: Taste 40% • Mood 40% • Value 20%
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
              connState === "connected" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300"
            }`}
          >
            Submit Ratings
          </button>
          {isHost && (
            <button
              onClick={endVoting}
              disabled={connState !== "connected"}
              className={`font-bold px-6 rounded-2xl text-white ${
                connState === "connected" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
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
    const { leaderboard = [], winner = null } = window.__barkadaResults || {};
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
                Weighted Score: <strong>{winner.score.toFixed(2)}</strong> — Voters:{" "}
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
                    <div className="w-8 text-center font-bold">{i + 1}</div>
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
                      <p className="text-xs text-gray-600">{opt.restaurant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">{opt.score.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">voters: {opt.voters}</p>
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
