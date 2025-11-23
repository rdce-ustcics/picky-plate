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

/* ============================================
   INTERNAL STYLES - Matching Profile Theme
   ============================================ */
const styles = `
  /* Reset and Base */
  * {
    box-sizing: border-box;
  }

  /* Page Container */
  .barkada-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Header */
  .barkada-header {
    background: #fffbeb;
    border-bottom: 2px solid #fbbf24;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .barkada-logo {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
  }

  .barkada-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #78350f;
  }

  .barkada-title .highlight {
    color: #f59e0b;
  }

  /* Connection Badge */
  .conn-badge {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .conn-badge.connected {
    background: #d1fae5;
    color: #065f46;
    border: 2px solid #10b981;
  }

  .conn-badge.connecting {
    background: #fef3c7;
    color: #92400e;
    border: 2px solid #fbbf24;
  }

  .conn-badge.error {
    background: #fee2e2;
    color: #991b1b;
    border: 2px solid #ef4444;
  }

  /* Cards */
  .barkada-card {
    background: #fffbeb;
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    border: 2px solid #fbbf24;
  }

  .barkada-card-white {
    background: white;
    border-radius: 1.5rem;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 2px solid #fde68a;
  }

  /* Session Code Banner */
  .session-code-banner {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: 1.5rem;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
    border: 3px solid #fef3c7;
    margin-bottom: 1.5rem;
  }

  .session-code-label {
    font-size: 0.875rem;
    color: white;
    opacity: 0.9;
  }

  .session-code-display {
    font-size: 3rem;
    font-weight: 800;
    color: white;
    letter-spacing: 0.5rem;
    margin: 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  /* Input Fields */
  .barkada-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    font-size: 1rem;
    color: #78350f;
    background: white;
    transition: all 0.3s ease;
  }

  .barkada-input:focus {
    outline: none;
    border-color: #fbbf24;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1);
  }

  .barkada-input::placeholder {
    color: #d1d5db;
  }

  .barkada-input.code-input {
    text-align: center;
    letter-spacing: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .barkada-textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    color: #78350f;
    background: white;
    transition: all 0.3s ease;
    min-height: 80px;
    resize: vertical;
  }

  .barkada-textarea:focus {
    outline: none;
    border-color: #fbbf24;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1);
  }

  /* Buttons */
  .barkada-btn {
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .barkada-btn-primary {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
  }

  .barkada-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
  }

  .barkada-btn-secondary {
    background: white;
    color: #92400e;
    border: 2px solid #fbbf24;
  }

  .barkada-btn-secondary:hover:not(:disabled) {
    background: #fef3c7;
    border-color: #f59e0b;
  }

  .barkada-btn-danger {
    background: #1f2937;
    color: white;
  }

  .barkada-btn-danger:hover:not(:disabled) {
    background: #111827;
  }

  .barkada-btn-blue {
    background: #2563eb;
    color: white;
  }

  .barkada-btn-blue:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .barkada-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .barkada-btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .barkada-btn-icon {
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: 2px solid #fde68a;
    color: #92400e;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .barkada-btn-icon:hover {
    background: #fef3c7;
    border-color: #fbbf24;
  }

  .barkada-btn-copy {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
  }

  .barkada-btn-copy:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Timer Badge */
  .timer-badge {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    background: #fef3c7;
    color: #92400e;
    border: 2px solid #fbbf24;
  }

  .timer-badge.blue {
    background: #dbeafe;
    color: #1e40af;
    border: 2px solid #3b82f6;
  }

  /* Participant Cards */
  .participant-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: white;
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
  }

  .participant-card:hover {
    background: #fef3c7;
    border-color: #fbbf24;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
  }

  .participant-name {
    font-weight: 600;
    color: #78350f;
  }

  .participant-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .participant-badge.host {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fbbf24;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .participant-badge.submitted {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  /* Restaurant Cards */
  .restaurant-card {
    background: white;
    border: 2px solid #fde68a;
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .restaurant-card:hover {
    border-color: #fbbf24;
    box-shadow: 0 6px 16px rgba(251, 191, 36, 0.2);
    transform: translateY(-2px);
  }

  .restaurant-image {
    width: 100%;
    height: 10rem;
    object-fit: cover;
  }

  .restaurant-image-placeholder {
    width: 100%;
    height: 10rem;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .restaurant-info {
    padding: 1rem;
  }

  .restaurant-name {
    font-weight: 700;
    color: #78350f;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .restaurant-location {
    color: #92400e;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .restaurant-price {
    color: #f59e0b;
    font-weight: 700;
    font-size: 0.875rem;
  }

  /* Rating Section */
  .rating-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #fde68a;
  }

  .rating-row:last-child {
    border-bottom: none;
  }

  .rating-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #78350f;
  }

  .rating-weights {
    font-size: 0.75rem;
    color: #92400e;
    background: #fef3c7;
    padding: 0.5rem;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
    border: 1px solid #fde68a;
  }

  /* Menu Editor Row */
  .menu-editor-row {
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
    align-items: center;
    background: white;
    margin-bottom: 0.75rem;
  }

  .menu-editor-row:hover {
    border-color: #fbbf24;
  }

  /* Modals */
  .barkada-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 50;
  }

  .barkada-modal {
    background: #fffbeb;
    border-radius: 1.5rem;
    width: 100%;
    max-width: 40rem;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    border: 3px solid #fbbf24;
  }

  .barkada-modal-header {
    background: #fffbeb;
    padding: 1.5rem;
    border-bottom: 2px solid #fbbf24;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .barkada-modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #78350f;
    margin: 0;
  }

  .barkada-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
    background: white;
  }

  .barkada-modal-footer {
    background: #fffbeb;
    padding: 1.25rem 1.5rem;
    border-top: 2px solid #fde68a;
    display: flex;
    gap: 0.75rem;
  }

  /* Settings */
  .settings-group {
    margin-bottom: 1.5rem;
  }

  .settings-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #78350f;
    margin-bottom: 0.5rem;
  }

  .settings-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    color: #78350f;
    background: white;
    transition: all 0.3s ease;
  }

  .settings-select:focus {
    outline: none;
    border-color: #fbbf24;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
  }

  .settings-hint {
    font-size: 0.75rem;
    color: #92400e;
    margin-top: 0.5rem;
  }

  /* Leaderboard */
  .leaderboard-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 2px solid #fde68a;
    border-radius: 0.75rem;
    background: white;
    transition: all 0.3s ease;
    margin-bottom: 0.75rem;
  }

  .leaderboard-item.winner {
    background: #fef3c7;
    border-color: #f59e0b;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }

  .leaderboard-rank {
    width: 2rem;
    text-align: center;
    font-weight: 700;
    color: #78350f;
  }

  .leaderboard-image {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    object-fit: cover;
    border: 2px solid #fde68a;
  }

  .leaderboard-placeholder {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    background: #f3f4f6;
  }

  .leaderboard-score {
    font-weight: 700;
    color: #f59e0b;
    font-size: 1.125rem;
  }

  .leaderboard-voters {
    font-size: 0.75rem;
    color: #92400e;
  }

  /* Winner Banner */
  .winner-banner {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: 1.5rem;
    padding: 3rem 2rem;
    text-align: center;
    color: white;
    box-shadow: 0 12px 32px rgba(251, 191, 36, 0.4);
    border: 3px solid #fef3c7;
    margin-bottom: 2rem;
  }

  .winner-banner-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0;
  }

  .winner-banner-subtitle {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.5rem 0;
  }

  .winner-banner-details {
    font-size: 0.95rem;
    opacity: 0.95;
    margin-top: 0.5rem;
  }

  /* Info Alert */
  .info-alert {
    background: #fef3c7;
    border: 2px solid #fbbf24;
    border-radius: 0.75rem;
    padding: 1rem;
    color: #92400e;
    font-size: 0.875rem;
    text-align: center;
  }

  .info-alert.blue {
    background: #dbeafe;
    border: 2px solid #3b82f6;
    color: #1e40af;
  }

  /* Fixed Bottom Bar */
  .fixed-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fffbeb;
    border-top: 2px solid #fbbf24;
    padding: 1rem;
    display: flex;
    gap: 0.75rem;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
    z-index: 40;
  }

  /* Layout Utilities */
  .container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .container-narrow {
    max-width: 64rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .flex-gap {
    display: flex;
    gap: 0.75rem;
  }

  .space-y {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Home Page Feature Cards */
  .feature-card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    border: 2px solid #fde68a;
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    border-color: #fbbf24;
    box-shadow: 0 6px 16px rgba(251, 191, 36, 0.2);
    transform: translateY(-2px);
  }

  .feature-number {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .feature-icon-box {
    width: 2.5rem;
    height: 2.5rem;
    background: #fef3c7;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid #fbbf24;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .session-code-display {
      font-size: 2rem;
      letter-spacing: 0.3rem;
    }
    .barkada-modal {
      max-width: 95vw;
    }
    .menu-editor-row {
      grid-template-columns: 1fr;
    }
    .winner-banner {
      padding: 2rem 1.5rem;
    }
    .winner-banner-title {
      font-size: 1.5rem;
    }
    .fixed-bottom-bar {
      flex-direction: column;
    }
    .grid-2, .grid-3 {
      grid-template-columns: 1fr;
    }
    .barkada-title {
      font-size: 2rem;
    }
  }

  @media (min-width: 641px) {
    .menu-editor-row {
      grid-template-columns: 3fr 3fr 2fr 3fr 1fr;
    }
  }
`;

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

  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");

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
    { name: "", restaurant: "", price: "", image: "" },
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
          restaurant: o.restaurant || "",
          price: o.price || "",
          image: o.image || "",
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
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    if (!createName || !createPassword) return alert("Enter name & password");

    socket.emit(
      "session:create",
      {
        name: createName,
        password: createPassword,
        userId: null,
        isRegistered: false,
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
        setShowSettings(true);
      }
    );
  };

  const doJoin = (restrictionsOverride = null) => {
    const socket = socketRef.current;
    if (!socket) return alert("Not connected yet.");
    if (connState !== "connected") return alert("Not connected yet.");
    if (!joinName || !joinCode || !joinPassword)
      return alert("Fill all fields");

    socket.emit(
      "session:join",
      {
        code: joinCode,
        password: joinPassword,
        name: joinName,
        isRegistered: !!authUser,
        userId: authUser?._id || null,
        existingToken: participantToken || null,
        restrictions: restrictionsOverride,
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
    if (!socket) return alert("Not connected yet.");
    if (!isHost || isVotingOpen) return;
    if (connState !== "connected") return alert("Not connected yet.");

    const cleaned = menuDraft
      .map((o) => ({
        name: String(o.name || "").trim(),
        restaurant: String(o.restaurant || "").trim(),
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
        name: String(o.name || "").trim(),
        restaurant: String(o.restaurant || "").trim(),
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
        if (!res?.ok)
          return alert(res?.error || "Failed to submit options");
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
    if (!Object.keys(cleaned).length)
      return alert("Rate at least one option");

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
    const engine = draft.engine === "ai" ? "ai" : "manual";
    const w = draft.weights || { taste: 0, mood: 0, value: 0 };
    const sum = Number(w.taste) + Number(w.mood) + Number(w.value);
    if (sum !== 100) return alert("Weights must add up to 100%.");

    const votingSeconds = Number(draft.votingSeconds);
    if (votingSeconds < 30 || votingSeconds > 300)
      return alert("Voting duration must be between 30 and 300 seconds.");

    const inactivityMinutes = Number(draft.inactivityMinutes || 5);
    if (inactivityMinutes < 1 || inactivityMinutes > 60)
      return alert("Inactivity timeout must be between 1 and 60 minutes.");

    const maxParticipants = Number(draft.maxParticipants || 10);
    if (maxParticipants < 2 || maxParticipants > 20)
      return alert("Max participants must be between 2 and 20.");

    const numOptions = Number(draft.numOptions || 4);
    if (numOptions < 1 || numOptions > 6)
      return alert("Number of restaurants must be between 1 and 6.");

    let mode = draft.mode;
    let perUserLimit = Number(draft.perUserLimit || 2);

    if (engine === "manual") {
      if (!["host_only", "per_user"].includes(mode)) mode = "host_only";
      if (mode === "per_user" && ![1, 2, 3].includes(perUserLimit)) {
        return alert("Per-user limit must be 1, 2, or 3.");
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
          return alert(res?.error || "Failed to save settings");
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
    if (!isHost)
      return alert("Only the host can generate AI recommendations.");
    if (!sessionCode) return alert("No session code.");

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
        if (!res?.ok)
          return alert(
            res?.error || "Failed to generate AI recommendations"
          );

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

  /* ========================================
     ENHANCED HOME VIEW
     ======================================== */
  if (currentView === "home") {
    return (
      <>
        <style>{styles}</style>
        <div className="barkada-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
            <h1 className="barkada-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              Barkada <span className="highlight">Vote</span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#92400e', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Make group decisions easy. Vote together, eat together.
            </p>
          </div>

          {/* Connection Badge - Top right corner */}
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
            {ConnBadge}
          </div>

          {/* Main Cards Container */}
          <div className="container-narrow" style={{ flex: 1, padding: '0 1rem 2rem' }}>
            <div className="grid-2" style={{ marginBottom: '3rem' }}>
              {/* CREATE */}
              <div className="barkada-card">
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#78350f" }}>
                  Create Session
                </h2>
                <div className="grid-2" style={{ marginBottom: "0.75rem" }}>
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Your Name"
                    className="barkada-input"
                  />
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Session Password"
                    className="barkada-input"
                  />
                </div>
                <p style={{ fontSize: "0.75rem", color: "#92400e", marginBottom: "1rem" }}>
                  You can choose Manual or AI mode and configure settings in the lobby.
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={connState !== "connected"}
                  className="barkada-btn barkada-btn-primary"
                  style={{ width: "100%" }}
                >
                  Create Lobby
                </button>
              </div>

              {/* JOIN */}
              <div className="barkada-card">
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#78350f" }}>
                  Join Session
                </h2>
                <div className="grid-2" style={{ marginBottom: "0.75rem" }}>
                  <input
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Your Name"
                    className="barkada-input"
                  />
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="Code (5 digits)"
                    maxLength={5}
                    className="barkada-input code-input"
                  />
                </div>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Password"
                  className="barkada-input"
                  style={{ marginBottom: "1rem" }}
                />
                <button
                  onClick={handleJoinSession}
                  disabled={connState !== "connected"}
                  className="barkada-btn barkada-btn-blue"
                  style={{ width: "100%" }}
                >
                  Join Lobby
                </button>
              </div>
            </div>

            {/* Feature Highlights - How It Works */}
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#78350f', marginBottom: '2rem' }}>
                How It Works
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.5rem',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                {/* Step 1 */}
                <div className="feature-card">
                  <div className="feature-number">1</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.5rem' }}>
                    Create or Join
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                    Start a new session or join your friends with a 5-digit code
                  </p>
                </div>

                {/* Step 2 */}
                <div className="feature-card">
                  <div className="feature-number">2</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.5rem' }}>
                    Add Options
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                    Manually add restaurants or let AI suggest based on your preferences
                  </p>
                </div>

                {/* Step 3 */}
                <div className="feature-card">
                  <div className="feature-number">3</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.5rem' }}>
                    Vote Together
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                    Everyone rates options on taste, mood, and value
                  </p>
                </div>

                {/* Step 4 */}
                <div className="feature-card">
                  <div className="feature-number">4</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.5rem' }}>
                    See Results
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5 }}>
                    Get instant results with weighted scoring and a clear winner
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features - Why Choose */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.6)', 
              borderRadius: '1.5rem', 
              padding: '2rem',
              border: '2px solid #fde68a',
              marginBottom: '2rem'
            }}>
              <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#78350f', marginBottom: '1.5rem' }}>
                Why Choose Barkada Vote?
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="feature-icon-box">
                    <Users style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.25rem' }}>
                      Real-time Collaboration
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      Vote simultaneously with your friends, no waiting around
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="feature-icon-box">
                    <Settings style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.25rem' }}>
                      Flexible Options
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      Choose between manual selection or AI-powered recommendations
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div className="feature-icon-box">
                    <Trophy style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#78350f', marginBottom: '0.25rem' }}>
                      Fair & Transparent
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      Weighted voting ensures everyone's preferences matter
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer style={{ 
            background: 'rgba(255, 255, 255, 0.5)', 
            borderTop: '2px solid #fde68a',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
              Made with 💛 for indecisive food lovers everywhere
            </p>
          </footer>
        </div>
      </>
    );
  }

  /* ========================================
     LOBBY VIEW
     ======================================== */
  if (currentView === "lobby") {
    const canStart = participants.length >= 2 && options.length > 0;

    return (
      <>
        <style>{styles}</style>
        <div className="barkada-page">
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
                <div className="grid-3">
                  {options.map((opt) => (
                    <div key={opt.id} className="restaurant-card">
                      {opt.image ? (
                        <img
                          src={opt.image}
                          alt={opt.name}
                          className="restaurant-image"
                        />
                      ) : (
                        <div className="restaurant-image-placeholder">
                          No image
                        </div>
                      )}
                      <div className="restaurant-info">
                        <div className="restaurant-name">{opt.name}</div>
                        <div className="restaurant-location">
                          {opt.restaurant}
                        </div>
                        <div className="restaurant-price">
                          ₱{Number(opt.price).toFixed(2)} / person
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <div>
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
                                  restaurant: "",
                                  price: "",
                                  image: "",
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
                          className="barkada-input"
                        />
                        <input
                          placeholder="Avg price (₱)"
                          type="number"
                          min="1"
                          value={o.price}
                          onChange={(e) =>
                            setMenuDraft((prev) =>
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
                            setMenuDraft((prev) =>
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
                            setMenuDraft((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="barkada-btn-icon"
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
                                  restaurant: "",
                                  price: "",
                                  image: "",
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
                          className="barkada-btn-icon"
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

                  <div className="settings-group">
                    <label className="settings-label">
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

                  <div className="settings-group">
                    <label className="settings-label">
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
                    style={{ flex: 1 }}
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
                    style={{ flex: 1 }}
                  >
                    Save & Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ========================================
     VOTING VIEW
     ======================================== */
  if (currentView === "voting") {
    return (
      <>
        <style>{styles}</style>
        <div className="barkada-page" style={{ paddingBottom: "6rem" }}>
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

          <div className="container" style={{ padding: "2rem 1rem" }}>
            <div className="grid-3">
              {options.map((food) => {
                const r = ratings[food.id] || {
                  taste: 0,
                  mood: 0,
                  value: 0,
                };
                return (
                  <div key={food.id} className="restaurant-card">
                    {food.image ? (
                      <img
                        src={food.image}
                        alt={food.name}
                        className="restaurant-image"
                      />
                    ) : (
                      <div className="restaurant-image-placeholder">
                        No image
                      </div>
                    )}
                    <div className="restaurant-info">
                      <h3 className="restaurant-name">{food.name}</h3>
                      <p className="restaurant-location">{food.restaurant}</p>
                      <p className="restaurant-price">
                        ₱{Number(food.price).toFixed(2)} avg / person
                      </p>

                      <div style={{ marginTop: "1rem" }}>
                        <div className="rating-row">
                          <label className="rating-label">Taste</label>
                          <StarRating
                            value={r.taste}
                            onChange={(v) =>
                              setRatingField(food.id, "taste", v)
                            }
                          />
                        </div>
                        <div className="rating-row">
                          <label className="rating-label">Mood</label>
                          <StarRating
                            value={r.mood}
                            onChange={(v) => setRatingField(food.id, "mood", v)}
                          />
                        </div>
                        <div className="rating-row">
                          <label className="rating-label">Value</label>
                          <StarRating
                            value={r.value}
                            onChange={(v) =>
                              setRatingField(food.id, "value", v)
                            }
                          />
                        </div>
                        <p className="rating-weights">
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
                className="barkada-btn barkada-btn-blue"
                style={{ padding: "1rem" }}
              >
                End Voting
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ========================================
     RESULTS VIEW
     ======================================== */
  if (currentView === "results") {
    const { leaderboard = [], winner = null } =
      window.__barkadaResults || {};
    return (
      <>
        <style>{styles}</style>
        <div className="barkada-page">
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
                {leaderboard.map((opt, i) => (
                  <div
                    key={opt.id}
                    className={`leaderboard-item ${
                      i === 0 ? "winner" : ""
                    }`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div className="leaderboard-rank">{i + 1}</div>
                      {opt.image ? (
                        <img
                          src={opt.image}
                          alt={opt.name}
                          className="leaderboard-image"
                        />
                      ) : (
                        <div className="leaderboard-placeholder" />
                      )}
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
                          {opt.restaurant}
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
                ))}
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
      </>
    );
  }

  return null;
}