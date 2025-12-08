// client/src/pages/Barkadavote.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Utensils,
  Vote,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./Barkadavote.css";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

  // Classification tags for restaurants
const CLASSIFICATION_OPTIONS = [
  "filipino",
  "american",
  "italian",
  "japanese",
  "korean",
  "chinese",
  "thai",
  "indian",
  "ramen",
  "pizza",
  "burger",
  "bbq",
  "seafood",
  "vegan",
  "vegetarian",
  "dessert",
  "cafe",
  "fastfood",
];

// Map each tag → image. (Create these image files in /public/images/tags/)
const TAG_IMAGES = {
  filipino: `${process.env.PUBLIC_URL || ""}/images/tags/filipino.jpg`,
  american: `${process.env.PUBLIC_URL || ""}/images/tags/american.jpg`,
  italian: `${process.env.PUBLIC_URL || ""}/images/tags/italian.jpg`,
  japanese: `${process.env.PUBLIC_URL || ""}/images/tags/japanese.jpg`,
  korean: `${process.env.PUBLIC_URL || ""}/images/tags/korean.jpg`,
  chinese: `${process.env.PUBLIC_URL || ""}/images/tags/chinese.jpg`,
  thai: `${process.env.PUBLIC_URL || ""}/images/tags/thai.jpg`,
  indian: `${process.env.PUBLIC_URL || ""}/images/tags/indian.jpg`,
  ramen: `${process.env.PUBLIC_URL || ""}/images/tags/ramen.jpg`,
  pizza: `${process.env.PUBLIC_URL || ""}/images/tags/pizza.jpg`,
  burger: `${process.env.PUBLIC_URL || ""}/images/tags/burger.jpg`,
  bbq: `${process.env.PUBLIC_URL || ""}/images/tags/bbq.jpg`,
  seafood: `${process.env.PUBLIC_URL || ""}/images/tags/seafood.jpg`,
  vegan: `${process.env.PUBLIC_URL || ""}/images/tags/vegan.jpeg`,
  vegetarian: `${process.env.PUBLIC_URL || ""}/images/tags/vegetarian.jpg`,
  dessert: `${process.env.PUBLIC_URL || ""}/images/tags/dessert.jpg`,
  cafe: `${process.env.PUBLIC_URL || ""}/images/tags/cafe.jpg`,
  fastfood: `${process.env.PUBLIC_URL || ""}/images/tags/fastfood.jpg`,
  default: `${process.env.PUBLIC_URL || ""}/images/tags/default.jpg`,
};

function getImageForTag(tag) {
  const key = String(tag || "").toLowerCase();
  return TAG_IMAGES[key] || TAG_IMAGES.default;
}

function formatTagLabel(tag) {
  if (!tag) return "";
  return tag
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/* Custom Themed Alert Component */
function ThemedAlert({ message, type = "info", onClose }) {
  if (!message) return null;

  const icons = {
    success: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  return (
    <div className="themed-alert-overlay" onClick={onClose}>
      <div className={`themed-alert themed-alert-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="themed-alert-icon">{icons[type]}</div>
        <p className="themed-alert-message">{message}</p>
        <button className="themed-alert-btn" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}

/* StarRating Component */
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

  const starFills = Array.from({ length: 5 }, (_, i) => {
    const diff = display - i;
    if (diff >= 1) return 1;
    if (diff >= 0.5) return 0.5;
    if (diff > 0) return 0.5;
    return 0;
  });

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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        userSelect: "none",
      }}
      aria-label={`Rating ${display} of 5`}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={Number(display || 0).toFixed(1)}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        {starFills.map((fill, idx) => (
          <div
            key={idx}
            style={{
              position: "relative",
              width: size,
              height: size,
              cursor: readOnly ? "default" : "pointer",
            }}
            onMouseMove={onStarMove(idx)}
            onMouseLeave={onStarLeave}
            onClick={onStarClick(idx)}
          >
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
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#4b5563",
            minWidth: 32,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Number(display || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default function BarkadaVote() {
  const navigate = useNavigate();

  const defaultSettings = {
    engine: "manual",
    mode: "host_only",
    perUserLimit: 2,
    maxParticipants: 10,
    numOptions: 4,
    weights: { taste: 40, mood: 40, value: 20 },
    votingSeconds: 90,
    inactivityMinutes: 5,
  };

  const socketRef = useRef(null);
  const [connState, setConnState] = useState("connecting");
  const [currentView, setCurrentView] = useState("home");

  // New state for modal-based forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Get authUser for auto-populating name
  const { user: authUser } = useAuth();

  // Auto-populate name from authenticated user
  useEffect(() => {
    if (authUser) {
      const fullName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.name || '';
      if (fullName && !createName) {
        setCreateName(fullName);
      }
      if (fullName && !joinName) {
        setJoinName(fullName);
      }
    }
  }, [authUser, createName, joinName]);

  const [sessionCode, setSessionCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [options, setOptions] = useState([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [host, setHost] = useState(null);
  const [copied, setCopied] = useState(false);
  const [createdAt, setCreatedAt] = useState(null);
  const [lastActivityAt, setLastActivityAt] = useState(null);

  const [settings, setSettings] = useState(defaultSettings);
  const [votingEndsAt, setVotingEndsAt] = useState(null);
  const [remainingVoting, setRemainingVoting] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingExpire, setRemainingExpire] = useState(null);

  const [participantToken, setParticipantToken] = useState(
    localStorage.getItem("barkada_vote_token") || ""
  );

  const [ratings, setRatings] = useState({});
  const [menuDraft, setMenuDraft] = useState([]);
  const [myDraft, setMyDraft] = useState([
    { name: "", tag: "", price: "" },
  ]);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(defaultSettings);

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

  const [guestRestrictions, setGuestRestrictions] = useState({
    allergens: "",
    diet: "",
  });
  const [showGuestPrefs, setShowGuestPrefs] = useState(false);
  const pendingJoinRef = useRef(null);

  // Custom alert state
  const [alertState, setAlertState] = useState({ message: "", type: "info" });
  
  const showAlert = (message, type = "info") => {
    setAlertState({ message, type });
  };
  
  const closeAlert = () => {
    setAlertState({ message: "", type: "info" });
  };

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
      showAlert("This lobby has expired due to inactivity.", "warning");
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

  useEffect(() => {
    if (isVotingOpen && (currentView === "lobby" || currentView === "home")) {
      setCurrentView("voting");
    }
  }, [isVotingOpen, currentView]);

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

  const optionsKey = JSON.stringify(options);
  useEffect(() => {
    if (currentView === "lobby" && isHost && !isVotingOpen) {
    setMenuDraft(
      (options || []).map((o) => ({
        name: o.name || "",
        tag:
          o.tag ||
          (Array.isArray(o.tags) && o.tags.length ? o.tags[0] : ""),
        price: o.price || o.averagePrice || "",
      }))
    );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, isHost, isVotingOpen, optionsKey]);

  const ConnBadge = useMemo(() => {
    if (connState === "connected")
      return <span className="conn-badge connected">Connected</span>;
    if (connState === "connecting")
      return <span className="conn-badge connecting">Connecting…</span>;
    return <span className="conn-badge error">Connection Error</span>;
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
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");
    if (!createName || !createPassword) return showAlert("Please enter your name and password", "warning");

    socket.emit(
      "session:create",
      {
        name: createName,
        password: createPassword,
        userId: authUser?._id || authUser?.id || null,
        isRegistered: !!authUser,
        profileImage: authUser?.profileImage || '',
      },
      (res) => {
        if (!res?.ok) return showAlert(res?.error || "Create failed", "error");
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

        setShowCreateModal(false);
        setCurrentView("lobby");
        setShowSettings(true);
      }
    );
  };

  const doJoin = (restrictionsOverride = null) => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");
    if (!joinName || !joinCode || !joinPassword)
      return showAlert("Please fill in all fields", "warning");

    socket.emit(
      "session:join",
      {
        code: joinCode,
        password: joinPassword,
        name: joinName,
        isRegistered: !!authUser,
        userId: authUser?._id || authUser?.id || null,
        existingToken: participantToken || null,
        restrictions: restrictionsOverride,
        profileImage: authUser?.profileImage || '',
      },
      (res) => {
        if (!res?.ok) return showAlert(res?.error || "Join failed", "error");

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

        setShowJoinModal(false);
        setCurrentView("lobby");
      }
    );
  };

  const handleJoinSession = () => {
    if (authUser) {
      return doJoin(null);
    }
    pendingJoinRef.current = true;
    setShowGuestPrefs(true);
  };

  const saveMenuToServer = () => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (!isHost || isVotingOpen) return;
    if (connState !== "connected") return showAlert("Not connected yet.", "error");

    const hasAnyRow = menuDraft.some(
      (o) => (o.name || "").trim() || (o.tag || "").trim() || Number(o.price) > 0
    );

    const cleaned = menuDraft
      .map((o) => ({
        name: String(o.name || "").trim(),
        tag: String(o.tag || "").trim(), // classification
        price: Number(o.price),
      }))
      .filter((o) => o.name && o.tag && o.price > 0);

    if (!hasAnyRow) {
      return showAlert("Please add at least one restaurant", "warning");
    }

    if (hasAnyRow && cleaned.length === 0) {
      return showAlert(
        "Please complete name, classification, and price (₱) for at least one restaurant.",
        "warning"
      );
    }

    if (cleaned.length > 6) return showAlert("Maximum 6 restaurants allowed", "warning");

    socket.emit(
      "session:updateOptions",
      { code: sessionCode, token: participantToken, options: cleaned },
      (res) => {
        if (!res?.ok) return showAlert(res?.error || "Save failed", "error");
        showAlert("Menu saved!", "success");
      }
    );
  };

  const pushMyOptions = () => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");
    const limit = settings?.perUserLimit || 2;

    const hasAnyRow = myDraft.some(
      (o) => (o.name || "").trim() || (o.tag || "").trim() || Number(o.price) > 0
    );

    const cleaned = myDraft
      .map((o) => ({
        name: String(o.name || "").trim(),
        tag: String(o.tag || "").trim(), // classification
        price: Number(o.price),
      }))
      .filter((o) => o.name && o.tag && o.price > 0)
      .slice(0, limit);

    if (!hasAnyRow) {
      return showAlert("Please add at least one restaurant", "warning");
    }

    if (hasAnyRow && cleaned.length === 0) {
      return showAlert(
        "Please complete name, classification, and price (₱) for at least one restaurant.",
        "warning"
      );
    }

    if (cleaned.length > limit)
      return showAlert(`Maximum ${limit} options per person`, "warning");

    socket.emit(
      "session:addUserOptions",
      { code: sessionCode, token: participantToken, options: cleaned },
      (res) => {
        if (!res?.ok)
          return showAlert(res?.error || "Failed to submit options", "error");
        showAlert("Your options have been submitted!", "success");
      }
    );
  };

  const startVoting = () => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");
    if (participants.length < 2)
      return showAlert("Need at least 2 participants to start", "warning");
    if (!options || options.length === 0)
      return showAlert(
        "Please add at least one restaurant before starting the vote.",
        "warning"
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
        if (!res?.ok) return showAlert(res?.error || "Start failed", "error");
        if (res.votingEndsAt) setVotingEndsAt(res.votingEndsAt);
        setCurrentView("voting");
      }
    );
  };

  const submitRatings = () => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");

    const cleaned = {};
    Object.entries(ratings).forEach(([id, r]) => {
      const t = Math.max(0, Math.min(5, Number(r.taste) || 0));
      const m = Math.max(0, Math.min(5, Number(r.mood) || 0));
      const v = Math.max(0, Math.min(5, Number(r.value) || 0));
      if (t > 0 || m > 0 || v > 0) {
        cleaned[id] = { taste: t, mood: m, value: v };
      }
    });
    if (!Object.keys(cleaned).length)
      return showAlert("Please rate at least one option", "warning");

    socket.emit(
      "session:submitRatings",
      { code: sessionCode, token: participantToken, ratings: cleaned },
      (res) => {
        if (!res?.ok) return showAlert(res?.error || "Submit failed", "error");
        showAlert("Ratings submitted!", "success");
      }
    );
  };

  const endVoting = () => {
    const socket = socketRef.current;
    if (!socket) return showAlert("Not connected yet.", "error");
    if (connState !== "connected") return showAlert("Not connected yet.", "error");
    socket.emit(
      "session:end",
      { code: sessionCode, token: participantToken },
      (res) => {
        if (!res?.ok) return showAlert(res?.error || "End failed", "error");
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
    if (!socket) return showAlert("Not connected yet.", "error");

    const draft = settingsDraft || defaultSettings;
    const engine = draft.engine === "ai" ? "ai" : "manual";
    const w = draft.weights || { taste: 0, mood: 0, value: 0 };
    const sum = Number(w.taste) + Number(w.mood) + Number(w.value);
    if (sum !== 100) return showAlert("Weights must add up to 100%", "warning");

    const votingSeconds = Number(draft.votingSeconds);
    if (votingSeconds < 30 || votingSeconds > 300)
      return showAlert("Voting duration must be between 30 and 300 seconds", "warning");

    const inactivityMinutes = Number(draft.inactivityMinutes || 5);
    if (inactivityMinutes < 1 || inactivityMinutes > 60)
      return showAlert("Inactivity timeout must be between 1 and 60 minutes", "warning");

    const maxParticipants = Number(draft.maxParticipants || 10);
    if (maxParticipants < 2 || maxParticipants > 20)
      return showAlert("Max participants must be between 2 and 20", "warning");

    const numOptions = Number(draft.numOptions || 4);
    if (numOptions < 1 || numOptions > 6)
      return showAlert("Number of restaurants must be between 1 and 6", "warning");

    let mode = draft.mode;
    let perUserLimit = Number(draft.perUserLimit || 2);

    if (engine === "manual") {
      if (!["host_only", "per_user"].includes(mode)) mode = "host_only";
      if (mode === "per_user" && ![1, 2, 3].includes(perUserLimit)) {
        return showAlert("Per-user limit must be 1, 2, or 3", "warning");
      }
    } else {
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
        if (!res?.ok)
          return showAlert(res?.error || "Failed to save settings", "error");
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
    if (!socket) return showAlert("Not connected yet.", "error");
    if (!isHost)
      return showAlert("Only the host can generate AI recommendations", "warning");
    if (!sessionCode) return showAlert("No session code", "error");

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
        prefs: {
          ...aiPrefs,
          maxRestaurants: settings.numOptions || settingsDraft.numOptions || 4,
        },
      },
      (res) => {
        setAiLoading(false);
        if (!res?.ok)
          return showAlert(
            res?.error || "Failed to generate AI recommendations",
            "error"
          );

        const st = res.state;
        setOptions(st.options || []);
        if (st.settings) {
          setSettings(st.settings);
          setSettingsDraft(st.settings);
        }
        if (st.expiresAt) setExpiresAt(st.expiresAt);
        if (st.lastActivityAt) setLastActivityAt(st.lastActivityAt);

        showAlert("AI restaurant recommendations updated!", "success");
      }
    );
  };

  /* ========================================
     REDESIGNED HOME VIEW - BUTTON BASED
     ======================================== */
  if (currentView === "home") {
    return (
      <div className="barkada-page home-page">
        {/* Themed Alert */}
        <ThemedAlert 
          message={alertState.message} 
          type={alertState.type} 
          onClose={closeAlert} 
        />
        
        {/* Connection Badge - Top right corner */}
        <div className="home-conn-badge">
          {ConnBadge}
        </div>

        {/* Hero Section */}
        <div className="home-hero">
          <div className="home-hero-icon">
            <Utensils className="hero-icon" />
          </div>
          <h1 className="home-hero-title">
            Barkada<span className="highlight">Vote</span>
          </h1>
          <p className="home-hero-subtitle">
            Can't decide where to eat? Let your barkada vote!
          </p>
        </div>

        {/* Main Action Buttons - ONLY BUTTONS, NO FORMS */}
        <div className="home-actions">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={connState !== "connected"}
            className="home-action-btn home-action-create"
          >
            <div className="action-btn-icon">
              <Plus />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Create Session</span>
              <span className="action-btn-desc">Start a new voting lobby</span>
            </div>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            disabled={connState !== "connected"}
            className="home-action-btn home-action-join"
          >
            <div className="action-btn-icon">
              <Users />
            </div>
            <div className="action-btn-text">
              <span className="action-btn-title">Join Session</span>
              <span className="action-btn-desc">Enter a 5-digit code</span>
            </div>
          </button>
        </div>

        {/* How It Works Section */}
        <div className="home-section">
          <h2 className="home-section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <Plus />
              </div>
              <h3 className="step-title">Create or Join</h3>
              <p className="step-desc">Start a new session or join friends with a code</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <ChefHat />
              </div>
              <h3 className="step-title">Add Options</h3>
              <p className="step-desc">Add restaurants manually or let AI suggest</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <Vote />
              </div>
              <h3 className="step-title">Vote Together</h3>
              <p className="step-desc">Rate each option on taste, mood & value</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">
                <Trophy />
              </div>
              <h3 className="step-title">Get Results</h3>
              <p className="step-desc">See the winner with weighted scoring</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="home-section home-features-section">
          <h2 className="home-section-title">Why Barkada Vote?</h2>
          <div className="features-container">
            <div className="feature-item">
              <div className="feature-item-icon">
                <Users />
              </div>
              <div className="feature-item-content">
                <h4>Real-time Collaboration</h4>
                <p>Vote simultaneously with friends</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-item-icon">
                <Sparkles />
              </div>
              <div className="feature-item-content">
                <h4>AI Recommendations</h4>
                <p>Get smart restaurant suggestions</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-item-icon">
                <Trophy />
              </div>
              <div className="feature-item-content">
                <h4>Fair & Transparent</h4>
                <p>Weighted scoring for accurate results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Session Modal - Opens when Create button is clicked */}
        {showCreateModal && (
          <div className="barkada-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="barkada-modal" onClick={(e) => e.stopPropagation()}>
              <div className="barkada-modal-header">
                <h3 className="barkada-modal-title">Create Session</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="barkada-btn-icon"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="barkada-modal-body">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter your name"
                    className="barkada-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Session Password</label>
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Create a password for the lobby"
                    className="barkada-input"
                  />
                  <p className="form-hint">
                    Share this password with friends so they can join
                  </p>
                </div>
              </div>

              <div className="barkada-modal-footer">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="barkada-btn barkada-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={connState !== "connected" || !createName || !createPassword}
                  className="barkada-btn barkada-btn-primary"
                >
                  Create Lobby
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Session Modal - Opens when Join button is clicked */}
        {showJoinModal && (
          <div className="barkada-modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="barkada-modal" onClick={(e) => e.stopPropagation()}>
              <div className="barkada-modal-header">
                <h3 className="barkada-modal-title">Join Session</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="barkada-btn-icon"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="barkada-modal-body">
                <div className="form-group">
                  <label className="form-label">Session Code</label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="Enter 5-digit code"
                    maxLength={5}
                    className="barkada-input code-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Enter your name"
                    className="barkada-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter session password"
                    className="barkada-input"
                  />
                </div>
              </div>

              <div className="barkada-modal-footer">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="barkada-btn barkada-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinSession}
                  disabled={connState !== "connected" || !joinName || !joinCode || !joinPassword}
                  className="barkada-btn barkada-btn-blue"
                >
                  Join Lobby
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GUEST PREFERENCES MODAL */}
        {showGuestPrefs && (
          <div className="barkada-modal-overlay">
            <div className="barkada-modal">
              <div className="barkada-modal-header">
                <h3 className="barkada-modal-title">
                  Your Dietary Preferences
                </h3>
                <button
                  onClick={() => setShowGuestPrefs(false)}
                  className="barkada-btn-icon"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="barkada-modal-body">
                <p style={{ fontSize: "0.875rem", color: "#92400e", marginBottom: "1rem" }}>
                  Help us accommodate your needs (optional but recommended):
                </p>

                <div className="form-group">
                  <label className="form-label">
                    Allergens / Must-avoid ingredients
                  </label>
                  <textarea
                    className="barkada-textarea"
                    placeholder="e.g. peanuts, shellfish, dairy…"
                    value={guestRestrictions.allergens}
                    onChange={(e) =>
                      setGuestRestrictions((p) => ({
                        ...p,
                        allergens: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Dietary restrictions
                  </label>
                  <input
                    className="barkada-input"
                    placeholder="e.g. vegetarian, vegan, halal…"
                    value={guestRestrictions.diet}
                    onChange={(e) =>
                      setGuestRestrictions((p) => ({
                        ...p,
                        diet: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="barkada-modal-footer">
                <button
                  onClick={() => {
                    setShowGuestPrefs(false);
                    doJoin(null);
                  }}
                  className="barkada-btn barkada-btn-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    setShowGuestPrefs(false);
                    doJoin({
                      allergens: guestRestrictions.allergens.trim(),
                      diet: guestRestrictions.diet.trim(),
                    });
                  }}
                  className="barkada-btn barkada-btn-primary"
                >
                  Save & Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================
     LOBBY VIEW
     ======================================== */
  if (currentView === "lobby") {
    const canStart = participants.length >= 2 && options.length > 0;

    return (
      <div className="barkada-page">
        {/* Themed Alert */}
        <ThemedAlert 
          message={alertState.message} 
          type={alertState.type} 
          onClose={closeAlert} 
        />
        
        <header className="barkada-header">
          <div className="flex-gap" style={{ alignItems: "center" }}>
            <div className="barkada-logo">P</div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#78350f",
              }}
            >
              Lobby
            </h1>
          </div>
          <div className="flex-gap" style={{ alignItems: "center" }}>
            {expiresAt && !isVotingOpen && (
              <span className="timer-badge">
                Expires in {fmtTime(remainingExpire)}
              </span>
            )}
            <button
              className="barkada-btn barkada-btn-icon"
              onClick={() => {
                setSettingsDraft(settings);
                setShowSettings(true);
              }}
              disabled={!isHost}
              title="Lobby settings"
            >
              <Settings style={{ width: "1rem", height: "1rem" }} />
            </button>
            {ConnBadge}
          </div>
        </header>

        <div className="container-narrow" style={{ padding: "2rem 1rem" }}>
          {/* SESSION CODE */}
          <div className="session-code-banner">
            <p className="session-code-label">Session Code</p>
            <div className="session-code-display">
              <div>{sessionCode}</div>
              <button onClick={copyToClipboard} className="barkada-btn-copy">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  {copied ? (
                    <Check style={{ width: "1rem", height: "1rem" }} />
                  ) : (
                    <Copy style={{ width: "1rem", height: "1rem" }} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* CURRENT OPTIONS */}
          {options && options.length > 0 && (
            <div className="barkada-card-white" style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "#78350f" }}>
                Current Restaurants in the Vote
              </h3>
              <div className="grid-3 lobby-restaurant-grid">
                {options.map((opt) => {
                  const tag =
                    opt.tag ||
                    (Array.isArray(opt.tags) && opt.tags.length ? opt.tags[0] : "");
                  const imgSrc = getImageForTag(tag);

                  return (
                    <div key={opt.id} className="restaurant-card">
                      <img
                        src={imgSrc}
                        alt={tag ? `${formatTagLabel(tag)} food` : opt.name}
                        className="restaurant-image"
                        loading="lazy"
                      />
                      <div className="restaurant-info">
                        <div className="restaurant-name">{opt.name}</div>
                        <div className="restaurant-location">
                          {opt.restaurant || formatTagLabel(tag)}
                        </div>
                        <div className="restaurant-price">
                          ₱{Number(opt.price).toFixed(2)} / person
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          <div className="barkada-card-white" style={{ marginTop: "1.5rem" }}>
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#78350f",
              }}
            >
              <Users style={{ width: "1.25rem", height: "1.25rem", color: "#f59e0b" }} />
              Participants ({participants.length}
              {settings.maxParticipants
                ? `/${settings.maxParticipants}`
                : ""}
              )
            </h3>
            <div className="grid-2">
              {participants.map((p, i) => (
                <div key={i} className="participant-card">
                  <div className="participant-avatar">
                    {p.profileImage ? (
                      <img
                        src={p.profileImage}
                        alt={p.name}
                        className="participant-avatar-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="participant-avatar-placeholder">
                        {p.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="participant-info">
                    <div className="participant-name">{p.name}</div>
                    {host?.name === p.name && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Crown style={{ width: "0.75rem", height: "0.75rem" }} />
                        Host
                      </div>
                    )}
                  </div>
                  {p.hasSubmitted && (
                    <span className="participant-badge submitted">
                      Submitted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI MODE PANEL */}
          {settings.engine === "ai" && (
            <div className="barkada-card-white" style={{ marginTop: "1.5rem" }}>
              <div className="flex-between" style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: 700, color: "#78350f" }}>
                  AI Restaurant Recommendations
                </h3>
                {isHost && (
                  <div className="flex-gap">
                    <button
                      className="barkada-btn barkada-btn-sm barkada-btn-secondary"
                      onClick={() => setShowAIPrefs(true)}
                    >
                      Edit preferences
                    </button>
                    <button
                      onClick={handleGenerateAIOptions}
                      disabled={aiLoading || connState !== "connected"}
                      className="barkada-btn barkada-btn-sm barkada-btn-primary"
                    >
                      {aiLoading ? "Generating…" : "Generate with AI"}
                    </button>
                  </div>
                )}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#92400e" }}>
                {isHost
                  ? "We'll use your group's preferences (budget, area, allergens, etc.) to suggest restaurants. You can refine and regenerate anytime."
                  : "The host is using AI to suggest restaurants. You'll see options appear here once they're generated."}
              </p>
            </div>
          )}

          {/* HOST MENU EDITOR */}
          {isHost &&
            !isVotingOpen &&
            settings.engine === "manual" &&
            settings.mode === "host_only" && (
              <div className="barkada-card-white" style={{ marginTop: "1.5rem" }}>
                <div className="flex-between" style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontWeight: 700, color: "#78350f" }}>
                    Manage Restaurants (max 6)
                  </h3>
                  <button
                    onClick={() =>
                      setMenuDraft((prev) =>
                        prev.length >= 6
                          ? prev
                          : [
                              ...prev,
                              {
                                name: "",
                                tag: "",
                                price: "",
                              },
                            ]
                      )
                    }
                    disabled={menuDraft.length >= 6}
                    className="barkada-btn barkada-btn-sm barkada-btn-secondary"
                  >
                    <Plus style={{ width: "1rem", height: "1rem" }} /> Add
                    Restaurant
                  </button>
                </div>

                <div className="space-y">
                {menuDraft.map((o, i) => (
                  <div key={i} className="menu-editor-row">
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
                      className="barkada-input"
                    />

                    {/* Classification dropdown (only one tag allowed) */}
                    <select
                      className="barkada-input"
                      value={o.tag || ""}
                      onChange={(e) =>
                        setMenuDraft((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, tag: e.target.value } : x
                          )
                        )
                      }
                    >
                      <option value="">Select classification</option>
                      {CLASSIFICATION_OPTIONS.map((tag) => (
                        <option key={tag} value={tag}>
                          {formatTagLabel(tag)}
                        </option>
                      ))}
                    </select>

                    <input
                      placeholder="Avg price (₱)"
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
                      className="barkada-input"
                    />

                    <button
                      onClick={() =>
                        setMenuDraft((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="barkada-btn-delete"
                      aria-label="remove"
                    >
                      <Trash2 style={{ width: "1rem", height: "1rem" }} />
                    </button>
                  </div>
                ))}
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button
                    onClick={saveMenuToServer}
                    className="barkada-btn barkada-btn-primary"
                    style={{ width: "100%" }}
                  >
                    Save Menu
                  </button>
                </div>
              </div>
            )}

          {/* PER-USER ADD */}
          {!isVotingOpen &&
            settings.engine === "manual" &&
            settings.mode === "per_user" && (
              <div className="barkada-card-white" style={{ marginTop: "1.5rem" }}>
                <div className="flex-between" style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontWeight: 700, color: "#78350f" }}>
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
                                tag: "",
                                price: "",
                              },
                            ]
                      )
                    }
                    disabled={myDraft.length >= settings.perUserLimit}
                    className="barkada-btn barkada-btn-sm barkada-btn-secondary"
                  >
                    <Plus style={{ width: "1rem", height: "1rem" }} /> Add
                    Restaurant
                  </button>
                </div>

                <div className="space-y">
                  {myDraft.map((o, i) => (
                    <div key={i} className="menu-editor-row">
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
                        className="barkada-input"
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
                        className="barkada-input"
                      />
                      <input
                        placeholder="Avg price (₱)"
                        type="number"
                        min="1"
                        value={o.price}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, price: e.target.value }
                                : x
                            )
                          )
                        }
                        className="barkada-input"
                      />
                      <input
                        placeholder="Image URL"
                        value={o.image}
                        onChange={(e) =>
                          setMyDraft((prev) =>
                            prev.map((x, idx) =>
                              idx === i
                                ? { ...x, image: e.target.value }
                                : x
                            )
                          )
                        }
                        className="barkada-input"
                      />
                      <button
                        onClick={() =>
                          setMyDraft((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="barkada-btn-delete"
                        aria-label="remove"
                      >
                        <Trash2 style={{ width: "1rem", height: "1rem" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button
                    onClick={pushMyOptions}
                    className="barkada-btn barkada-btn-primary"
                    style={{ width: "100%" }}
                  >
                    Submit My Restaurants
                  </button>
                </div>
              </div>
            )}

          {/* CONTROLS */}
          <div style={{ marginTop: "1.5rem" }}>
            {isHost ? (
              <button
                onClick={startVoting}
                disabled={connState !== "connected" || !canStart}
                className="barkada-btn barkada-btn-primary"
                style={{ width: "100%", padding: "1rem" }}
              >
                {isVotingOpen ? "Voting In Progress" : "Start Voting"}
              </button>
            ) : (
              <div className="info-alert blue">
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
              className="barkada-btn barkada-btn-danger"
              style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}
            >
              End Voting
            </button>
          )}
        </div>

        {/* SETTINGS MODAL */}
        {showSettings && (
          <div className="barkada-modal-overlay">
            <div className="barkada-modal">
              <div className="barkada-modal-header">
                <h3 className="barkada-modal-title">Lobby Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="barkada-btn-icon"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="barkada-modal-body">
                <div className="settings-group">
                  <label className="settings-label">Manual or AI</label>
                  <select
                    className="settings-select"
                    value={settingsDraft.engine}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        engine: e.target.value === "ai" ? "ai" : "manual",
                      }))
                    }
                  >
                    <option value="manual">
                      Manually choose (default)
                    </option>
                    <option value="ai">
                      Use AI to generate recommendations
                    </option>
                  </select>
                </div>

                {settingsDraft.engine !== "ai" && (
                  <>
                    <div className="settings-group">
                      <label className="settings-label">Manual mode</label>
                      <select
                        className="settings-select"
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
                        <option value="per_user">
                          Each person submits
                        </option>
                      </select>
                    </div>

                    {settingsDraft.mode === "per_user" && (
                      <div className="settings-group">
                        <label className="settings-label">
                          Per-user limit
                        </label>
                        <select
                          className="settings-select"
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

                <div className="settings-group">
                  <label className="settings-label">
                    Maximum participants
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    className="barkada-input"
                    value={settingsDraft.maxParticipants}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        maxParticipants: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="settings-hint">
                    People who try to join after this limit will see a
                    "Lobby is full" message.
                  </p>
                </div>

                {settingsDraft.engine === "ai" && (
                  <>
                <div className="settings-group">
                  <label className="settings-label">
                    Number of restaurants (for AI suggestions)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="barkada-input"
                    value={settingsDraft.numOptions}
                    onChange={(e) =>
                      setSettingsDraft((p) => ({
                        ...p,
                        numOptions: Number(e.target.value),
                      }))
                    }
                  />
                  <p className="settings-hint">
                    AI will suggest up to this many restaurants (max 6).
                  </p>
                </div>

              {/* NEW: Optional budget per head for AI */}
              <div className="settings-group">
                <label className="settings-label">
                  Budget per person (₱){" "}
                  <span style={{ fontWeight: 400 }}>(optional — minimum ₱100)</span>
                </label>
                <input
                  type="number"
                  min={100}
                  className="barkada-input"
                  placeholder="e.g. 200–400"
                  value={aiPrefs.budgetPerPerson}
                  onChange={(e) => {
                    let val = e.target.value;

                    // Only clamp if user entered something
                    if (val !== "" && Number(val) < 100) val = 100;

                    setAiPrefs((p) => ({
                      ...p,
                      budgetPerPerson: val,
                    }));
                  }}
                />
                <p className="settings-hint">
                  If set, the AI will try to favor restaurants around this price per head.
                </p>
              </div>

                </>
                )}


                <div className="settings-group">
                  <label className="settings-label">
                    Weights (must total 100%)
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#92400e",
                        }}
                      >
                        Taste
                      </span>
                      <input
                        type="number"
                        className="barkada-input"
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
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#92400e",
                        }}
                      >
                        Mood
                      </span>
                      <input
                        type="number"
                        className="barkada-input"
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
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#92400e",
                        }}
                      >
                        Value
                      </span>
                      <input
                        type="number"
                        className="barkada-input"
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
                  <p className="settings-hint">
                    Current total:{" "}
                    {Number(settingsDraft.weights.taste) +
                      Number(settingsDraft.weights.mood) +
                      Number(settingsDraft.weights.value)}
                    %
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.75rem",
                  }}
                >
                  <div className="settings-group">
                    <label className="settings-label">
                      Voting duration (sec)
                    </label>
                    <input
                      type="number"
                      className="barkada-input"
                      value={settingsDraft.votingSeconds}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({
                          ...p,
                          votingSeconds: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="settings-group">
                    <label className="settings-label">
                      Inactivity timeout (min)
                    </label>
                    <input
                      type="number"
                      className="barkada-input"
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

              <div className="barkada-modal-footer">
                <button
                  onClick={() => setShowSettings(false)}
                  className="barkada-btn barkada-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="barkada-btn barkada-btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI PREFERENCES MODAL */}
        {showAIPrefs && (
          <div className="barkada-modal-overlay">
            <div className="barkada-modal">
              <div className="barkada-modal-header">
                <h3 className="barkada-modal-title">AI Preferences</h3>
                <button
                  onClick={() => setShowAIPrefs(false)}
                  className="barkada-btn-icon"
                >
                  <X style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              </div>

              <div className="barkada-modal-body">
                <div className="settings-group">
                  <label className="settings-label">
                    Preferred area / location
                  </label>
                  <input
                    className="barkada-input"
                    placeholder="e.g. UST area, Sampaloc, Quezon City, BGC…"
                    value={aiPrefs.area}
                    onChange={(e) =>
                      setAiPrefs((p) => ({ ...p, area: e.target.value }))
                    }
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">
                    Budget per person (₱)
                  </label>
                  <input
                    type="number"
                    className="barkada-input"
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

                <div className="settings-group">
                  <label className="settings-label">
                    Cuisines you like
                  </label>
                  <textarea
                    className="barkada-textarea"
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

                <div className="settings-group">
                  <label className="settings-label">
                    Cuisines you want to avoid
                  </label>
                  <textarea
                    className="barkada-textarea"
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

                <div className="settings-group">
                  <label className="settings-label">
                    Allergens / must-avoid ingredients (important)
                  </label>
                  <textarea
                    className="barkada-textarea"
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

                <div className="settings-group">
                  <label className="settings-label">Extra notes</label>
                  <textarea
                    className="barkada-textarea"
                    placeholder="e.g. prefer fast-casual; walking distance only; no buffet…"
                    value={aiPrefs.notes}
                    onChange={(e) =>
                      setAiPrefs((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="barkada-modal-footer">
                <button
                  onClick={() => setShowAIPrefs(false)}
                  className="barkada-btn barkada-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAIPrefs(false);
                    handleGenerateAIOptions();
                  }}
                  className="barkada-btn barkada-btn-primary"
                  style={{ flex: 1 }}
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

  /* ========================================
     VOTING VIEW
     ======================================== */
  if (currentView === "voting") {
    return (
      <div className="barkada-page" style={{ paddingBottom: "6rem" }}>
        {/* Themed Alert */}
        <ThemedAlert 
          message={alertState.message} 
          type={alertState.type} 
          onClose={closeAlert} 
        />
        
        <header className="barkada-header">
          <button
            onClick={() => setCurrentView("lobby")}
            className="barkada-btn-icon"
          >
            <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#78350f",
            }}
          >
            Rate Options
          </h1>
          <div className="flex-gap" style={{ alignItems: "center", marginLeft: "auto" }}>
            {remainingVoting != null && (
              <span className="timer-badge blue">
                Ends in {fmtTime(remainingVoting)}
              </span>
            )}
            {ConnBadge}
          </div>
        </header>

        <div className="container" style={{ padding: "1rem" }}>
          <div className="grid-3 voting-restaurant-grid">
          {options.map((food) => {
            const r = ratings[food.id] || { taste: 0, mood: 0, value: 0 };
            const tag =
              food.tag ||
              (Array.isArray(food.tags) && food.tags.length ? food.tags[0] : "");
            const imgSrc = getImageForTag(tag);

            return (
              <div key={food.id} className="restaurant-card">
                <img
                  src={imgSrc}
                  alt={tag ? `${formatTagLabel(tag)} food` : food.name}
                  className="restaurant-image"
                  loading="lazy"
                />
                <div className="restaurant-info">
                  <h3 className="restaurant-name">{food.name}</h3>
                  <p className="restaurant-location">
                    {food.restaurant || formatTagLabel(tag)}
                  </p>
                  <p className="restaurant-price">
                    ₱{Number(food.price).toFixed(2)} avg / person
                  </p>

                  {/* ⭐ Compact star ratings */}
                  <div className="rating-section">
                    <div className="rating-item">
                      <span>Taste</span>
                      <StarRating
                        value={r.taste}
                        onChange={(v) => setRatingField(food.id, "taste", v)}
                        size={20}
                        showValue={false}
                      />
                    </div>

                    <div className="rating-item">
                      <span>Mood</span>
                      <StarRating
                        value={r.mood}
                        onChange={(v) => setRatingField(food.id, "mood", v)}
                        size={20}
                        showValue={false}
                      />
                    </div>

                    <div className="rating-item">
                      <span>Value</span>
                      <StarRating
                        value={r.value}
                        onChange={(v) => setRatingField(food.id, "value", v)}
                        size={20}
                        showValue={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="fixed-bottom-bar">
          <button
            onClick={submitRatings}
            disabled={connState !== "connected"}
            className="barkada-btn barkada-btn-primary"
            style={{ flex: 1, padding: "1rem" }}
          >
            Submit Ratings
          </button>
          {isHost && (
            <button
              onClick={endVoting}
              disabled={connState !== "connected"}
              className="barkada-btn barkada-btn-danger"
              style={{ padding: "1rem" }}
            >
              End Voting
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ========================================
     RESULTS VIEW
     ======================================== */
  if (currentView === "results") {
    const { leaderboard = [], winner = null } =
      window.__barkadaResults || {};
    return (
      <div className="barkada-page">
        {/* Themed Alert */}
        <ThemedAlert 
          message={alertState.message} 
          type={alertState.type} 
          onClose={closeAlert} 
        />
        
        <header className="barkada-header">
          <div className="flex-gap" style={{ alignItems: "center" }}>
            <Trophy
              style={{
                width: "1.5rem",
                height: "1.5rem",
                color: "#f59e0b",
              }}
            />
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#78350f",
              }}
            >
              Results
            </h1>
          </div>
          <div style={{ marginLeft: "auto" }}>{ConnBadge}</div>
        </header>

        <div className="container-narrow" style={{ padding: "2rem 1rem" }}>
          {winner && (
            <div className="winner-banner">
              <Trophy
                style={{
                  width: "3rem",
                  height: "3rem",
                  margin: "0 auto 1rem",
                }}
              />
              <h2 className="winner-banner-title">Winner!</h2>
              <p className="winner-banner-subtitle">{winner.name}</p>
              <p className="winner-banner-details">
                Weighted Score:{" "}
                <strong>{winner.score.toFixed(2)}</strong> — Voters:{" "}
                {winner.voters}
              </p>
              <button
                onClick={() => navigate(`/restaurants?search=${encodeURIComponent(winner.name)}&nearme=true`)}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(245, 158, 11, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Find "{winner.name}" Near Me
              </button>
            </div>
          )}

          <div className="barkada-card-white">
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "1rem",
                color: "#78350f",
              }}
            >
              Leaderboard
            </h3>
            <div>
            {leaderboard.map((opt, i) => {
              const tag =
                opt.tag ||
                (Array.isArray(opt.tags) && opt.tags.length ? opt.tags[0] : "default");

              const imgSrc = getImageForTag(tag);

              return (
                <div
                  key={opt.id}
                  className={`leaderboard-item ${i === 0 ? "winner" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div className="leaderboard-rank">{i + 1}</div>
                    <img
                      src={imgSrc}
                      alt={tag ? `${formatTagLabel(tag)} food` : opt.name}
                      className="leaderboard-image"
                      loading="lazy"
                    />
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          color: "#78350f",
                        }}
                      >
                        {opt.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#92400e",
                        }}
                      >
                        {opt.restaurant || formatTagLabel(tag)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="leaderboard-score">
                      {opt.score.toFixed(2)}
                    </p>
                    <p className="leaderboard-voters">
                      voters: {opt.voters}
                    </p>
                  </div>
                </div>
              );
            })}
            </div>

            <div className="flex-gap" style={{ marginTop: "1.5rem" }}>
              <button
                onClick={() => {
                  setCurrentView("home");
                  setParticipants([]);
                  setOptions([]);
                  window.__barkadaResults = null;
                }}
                className="barkada-btn barkada-btn-primary"
                style={{ flex: 1, padding: "1rem" }}
              >
                New Session
              </button>
              <button
                onClick={() => setCurrentView("voting")}
                className="barkada-btn barkada-btn-secondary"
                style={{ flex: 1, padding: "1rem" }}
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