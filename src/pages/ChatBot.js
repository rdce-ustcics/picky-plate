// src/pages/ChatBot.js
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Image,
  User,
  Send,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import {
  getSessionId,
  saveChatsToLocal,
  loadChatsFromLocal,
  saveActiveChatId,
  loadActiveChatId,
} from "../utils/session";
import { useAuth } from "../auth/AuthContext";

const BOT_PNG = `${process.env.PUBLIC_URL || ""}/images/PickAPlate.png`;
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const SESSION_ID = getSessionId();

const brand = {
  primary: "#FFC42D",
  secondary: "#FFF7DA",
  text: "#8B4513",
  darkText: "#2b2b2b",
  bg: "#FFF9E6",
  cardBg: "#FFFBF0",
};

const MOOD_OPTIONS = [
  { emoji: "😐", label: "Neutral" },   // 👈 new
  { emoji: "😄", label: "Happy" },
  { emoji: "😊", label: "Chill" },
  { emoji: "😣", label: "Stressed" },
  { emoji: "😔", label: "Sad" },
  { emoji: "🤩", label: "Adventurous" },
  { emoji: "🤤", label: "Very hungry" },
];

function BotLogo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        userSelect: "none",
      }}
    >
      <img
        src={BOT_PNG}
        alt="PickAPlate"
        style={{
          width: 160,
          height: 160,
          objectFit: "contain",
          filter: "drop-shadow(0 0 30px rgba(255,196,45,.65))",
        }}
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: brand.darkText,
          }}
        >
          Pick<span style={{ color: brand.primary }}>A</span>Plate
          <span style={{ color: brand.primary }}>.</span>
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: brand.text,
            marginTop: 8,
          }}
        >
          Your personal food companion
        </div>
      </div>
    </div>
  );
}

function SmallBotAvatar({ mode }) {
  return (
    <div
      style={{ width: 72, height: 72, position: "relative", flexShrink: 0 }}
    >
      <img
        src={BOT_PNG}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.15))",
        }}
      />
      <div
        style={{
          "--face": "#FFE39B",
          position: "absolute",
          left: "50%",
          top: "58%",
          transform: "translate(-50%,-50%)",
          width: "22%",
          height: "11%",
          background: "var(--face)",
          borderRadius: 8,
          boxShadow: "0 0 0 1px var(--face)",
        }}
      />
      <div
        className={`small-mouth ${mode === "talking" ? "talking" : ""}`}
        style={{
          position: "absolute",
          left: "50%",
          top: "58%",
          transform: "translate(-50%,-50%)",
          width: "18%",
          height: "8%",
          background: "#111",
          borderRadius: "0 0 8px 8px",
          transformOrigin: "top center",
        }}
      />
      {mode === "thinking" && (
        <>
          <div
            className="thinking-hand"
            style={{
              position: "absolute",
              left: "65%",
              top: "35%",
              width: "28%",
              height: "28%",
              transformOrigin: "bottom center",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "15%",
                left: "50%",
                transform: "translateX(-50%) rotate(-25deg)",
                width: "28%",
                height: "45%",
                background: "linear-gradient(to bottom, #FFD700, #FFA500)",
                borderRadius: "6px",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "50%",
                height: "50%",
                background: "#FFD700",
                borderRadius: "40%",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-5%",
                left: "55%",
                fontSize: "14px",
              }}
            >
            </div>
          </div>
          <div
            className="thinking-dots"
            style={{
              position: "absolute",
              top: -12,
              right: -12,
              background: "white",
              borderRadius: 12,
              padding: "4px 8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              gap: 3,
            }}
          >
            <span className="dot">•</span>
            <span className="dot">•</span>
            <span className="dot">•</span>
          </div>
        </>
      )}
    </div>
  );
}

// Extract numbered/bulleted items from assistant reply (1., -, •)
function extractRecommendationOptions(text) {
  if (!text) return { cleanedText: text, options: [] };

  const lines = text.split("\n");
  const options = [];
  const remaining = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // Match formats like:
    // 1. Dish: Description
    // - Dish: Description
    // • Dish: Description
    if (/^(\d+\.|-|•)\s+/.test(trimmed)) {
      const fullOption = trimmed.replace(/^(\d+\.|-|•)\s+/, "");
      options.push(fullOption);
    } else {
      remaining.push(line);
    }
  }

  return {
    cleanedText: remaining.join("\n").trim(),
    options,
  };
}

// 🔹 Get just the dish title (no description, no **)
function getDishTitle(text) {
  if (!text) return "";
  let t = text.trim();

  // Remove leading list markers just in case
  t = t.replace(/^(\d+\.|-|•)\s+/, "");

  // If there's a colon, keep only the left side (likely the name)
  const colonIndex = t.indexOf(":");
  if (colonIndex !== -1) {
    t = t.slice(0, colonIndex).trim();
  }

  // Strip markdown bold/italics at the edges
  if (/^\*\*(.+)\*\*$/.test(t)) {
    t = t.replace(/^\*\*(.+)\*\*$/, "$1");
  }
  if (/^\*(.+)\*$/.test(t)) {
    t = t.replace(/^\*(.+)\*$/, "$1");
  }

  // Remove any remaining ** inside
  t = t.replace(/\*\*/g, "");

  return t;
}

function stripRecommendationLines(text) {
  if (!text) return "";

  return text
    .split("\n")
    .filter((line) => !/^(\d+\.|-|•)\s+/.test(line.trim()))
    .join("\n")
    .trim();
}

export default function ChatBot() {
  const { isAuthenticated, authHeaders } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const scrollerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [chatPendingDelete, setChatPendingDelete] = useState(null);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] =
    useState(false);

  const [selectedMood, setSelectedMood] = useState(null);
  const [moodMenuOpen, setMoodMenuOpen] = useState(false);

  const [showAnonLimitModal, setShowAnonLimitModal] = useState(false);
  const [guestLimitReached, setGuestLimitReached] = useState(false);

  const [pendingChoice, setPendingChoice] = useState(null);
  const [showConfirmChoiceModal, setShowConfirmChoiceModal] = useState(false);
  const [chosenRecommendation, setChosenRecommendation] = useState(null);
  const [postDecisionStep, setPostDecisionStep] = useState(null); // "awaitingType" | "done" | null
  const [pendingChoiceMessageIndex, setPendingChoiceMessageIndex] = useState(null);
  const [ctaChatId, setCtaChatId] = useState(null);  // which chat the recipe/restaurant buttons belong to

  const prevAuthRef = useRef(isAuthenticated);
  const suppressLocalLoadRef = useRef(false);

  function clearLocalChatStorage() {
    try {
      saveChatsToLocal([]);
      saveActiveChatId(null);
      if (window?.localStorage) {
        localStorage.removeItem("pap:chats");
        localStorage.removeItem("pap:activeChatId");
      }
    } catch {}
  }

  function buildHeaders() {
    return isAuthenticated
      ? { "Content-Type": "application/json", ...authHeaders() }
      : { "Content-Type": "application/json" };
  }

  function buildPayload({ message, history, chatId, mood }) {
    const base = { message, history, chatId };
    if (mood) base.mood = mood;

    return isAuthenticated ? base : { ...base, sessionId: SESSION_ID };
  }

  function oneChatUrl(serverId) {
    return isAuthenticated
      ? `${API_BASE}/api/chats/${serverId}`
      : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(
          SESSION_ID
        )}`;
  }

  const chatsListUrlStr = React.useMemo(
    () =>
      isAuthenticated
        ? `${API_BASE}/api/chats`
        : `${API_BASE}/api/chats?sessionId=${encodeURIComponent(SESSION_ID)}`,
    [isAuthenticated]
  );

  const headersForList = React.useMemo(
    () => (isAuthenticated ? authHeaders() : {}),
    [isAuthenticated, authHeaders]
  );

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    const nowAuth = isAuthenticated;
    prevAuthRef.current = nowAuth;

    suppressLocalLoadRef.current = true;
    clearLocalChatStorage();
    setActiveChatId(null);
    setChats([]);
    setChosenRecommendation(null);
    setPostDecisionStep(null);
    setGuestLimitReached(false);

    if (wasAuth && !nowAuth) {
      window.location.replace(
        window.location.pathname + window.location.search
      );
      return;
    }

    const t = setTimeout(() => {
      suppressLocalLoadRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const chatHasFinalChoice = !!activeChat && !!activeChat.hasFinalChoice;
  const isInputLocked = !isAuthenticated && guestLimitReached;

  async function apiChat({ message, history = [], chatId = null, mood = null }) {
    const recent = history
      .filter(
        (m) =>
          m &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(
        buildPayload({
          message,
          history: recent,
          chatId,
          mood,
        })
      ),
    });

    if (!res.ok) {
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = { raw: await res.text() };
      }
      const error = new Error("Chat API failed");
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return res.json();
  }

  useEffect(() => {
    (async function loadChats() {
      const canUseLocal = !isAuthenticated && !suppressLocalLoadRef.current;

      try {
        const res = await fetch(chatsListUrlStr, { headers: headersForList });
        if (!res.ok) throw new Error(await res.text());
        const list = await res.json();

        if (Array.isArray(list) && list.length) {
          const uiChats = list.map((doc) => ({
            id: doc._id,
            chatId: doc._id,
            title: doc.title || "Chat",
            messages: [],
            closed: !!doc.closed,
            hasFinalChoice: !!doc.hasFinalChoice,
          }));
          setChats(uiChats);
          setActiveChatId(null);
          if (!isAuthenticated) saveChatsToLocal(uiChats);
          return;
        }

        if (canUseLocal) {
          const cached = loadChatsFromLocal();
          if (Array.isArray(cached) && cached.length) {
            setChats(
              cached.map((c) => ({
                ...c,
                messages: c.messages || [],
              }))
            );
            setActiveChatId(null);
            return;
          }
        }

        setChats([]);
        setActiveChatId(null);
      } catch (e) {
        console.error("Failed to load chats:", e);

        if (canUseLocal) {
          const cached = loadChatsFromLocal();
          if (Array.isArray(cached) && cached.length) {
            setChats(
              cached.map((c) => ({
                ...c,
                messages: c.messages || [],
              }))
            );
            setActiveChatId(loadActiveChatId() || cached[0]?.id || null);
            return;
          }
        }

        setChats([]);
        setActiveChatId(null);
      }
    })();
  }, [chatsListUrlStr, headersForList, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && !suppressLocalLoadRef.current)
      saveChatsToLocal(chats);
  }, [chats, isAuthenticated]);

  useEffect(() => {
    if (activeChatId) saveActiveChatId(activeChatId);
  }, [activeChatId]);

  function createNewChat(initialMessage = null) {
    // Guests: only allowed to create ONE chat total
    if (!isAuthenticated) {
      if (chats.length === 0) {
        const newChat = {
          id: Date.now(),
          title: initialMessage || "New Chat",
          messages: [],
          chatId: null,
          closed: false,
          hasFinalChoice: false,
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setShowSidebar(false);

        if (initialMessage) {
          sendMessage(initialMessage, newChat.id);
        }
      } else {
        setShowAnonLimitModal(true);
      }
      return;
    }

    const newChat = {
      id: Date.now(),
      title: initialMessage || "New Chat",
      messages: [],
      chatId: null,
      closed: false,
      hasFinalChoice: false,
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowSidebar(false);

    if (initialMessage) {
      sendMessage(initialMessage, newChat.id);
    }
  }

  useEffect(() => {
    const incomingMessage = location.state?.message;

    if (incomingMessage && !hasProcessedInitialMessage) {
      const timer = setTimeout(() => {
        createNewChat(incomingMessage);
        setHasProcessedInitialMessage(true);
        window.history.replaceState({}, document.title);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.state?.message, hasProcessedInitialMessage]);

  async function sendMessage(text = null, chatLocalId = null) {
    const messageText = (text ?? input).trim();
    const targetChatId = chatLocalId ?? activeChatId;

    if (!messageText || !targetChatId) return;

    // If locked or guest-limit reached, prevent sending
    if (isInputLocked) return;

    // 👇 User is moving on; clear any previous "I'm choosing this" UI
    setPostDecisionStep(null);
    setChosenRecommendation(null);
    setCtaChatId(null);
    setPendingChoice(null);
    setPendingChoiceMessageIndex(null);


    const targetChat = chats.find((c) => c.id === targetChatId);
    const history = targetChat?.messages || [];
    const isFirstMessage = history.length === 0;

    setInput("");
    setIsTyping(true);

    // Update title on first message (especially for logged-in new chat)
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== targetChatId) return chat;

        // Lock any assistant messages that had options (user ignored them and typed instead)
        const updatedMessages = chat.messages.map((msg) => {
          if (
            msg.role === "assistant" &&
            !msg.choiceLocked
          ) {
            const extracted = extractRecommendationOptions(msg.content);
            if (extracted.options && extracted.options.length > 0) {
              return { ...msg, choiceLocked: true };
            }
          }
          return msg;
        });

        return {
          ...chat,
          title:
            isFirstMessage &&
            (chat.title === "New Chat" || !chat.title)
              ? messageText.slice(0, 60)
              : chat.title,
          messages: [
            ...updatedMessages,
            { role: "user", content: messageText },
          ],
        };
      })
    );

    // Mood now can be selected anytime; if none selected, we send null
    const moodEmoji = selectedMood || null;

    try {
      const { reply, chatId: persistedId, learned } = await apiChat({
        message: messageText,
        history,
        chatId: targetChat?.chatId || null,
        mood: moodEmoji,
      });

      const aiText =
        (reply || "").trim() || "Got it! What cuisine are you craving?";

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                chatId: chat.chatId || persistedId || null,
                messages: [
                  ...chat.messages,
                  { role: "assistant", content: aiText, learned: !!learned },
                ],
              }
            : chat
        )
      );
    } catch (e) {
      console.error(e);

      if (e.status === 403 && e.data?.error === "guest_limit_reached") {
        setGuestLimitReached(true);
        setShowAnonLimitModal(true);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      role: "assistant",
                      content:
                        "You’ve reached the limit of 5 messages as a guest. Please sign up or log in to continue chatting 🚀",
                    },
                  ],
                }
              : chat
          )
        );
      } else {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      role: "assistant",
                      content: "Server error. Please try again.",
                    },
                  ],
                }
              : chat
          )
        );
      }
    } finally {
      setIsTyping(false);
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 3000);
    }
  }

  async function selectChat(localId) {
    setActiveChatId(localId);
    setShowSidebar(false);

      setPostDecisionStep(null);
      setChosenRecommendation(null);
      setCtaChatId(null);
      setPendingChoice(null);
      setPendingChoiceMessageIndex(null);

    const chat = chats.find((c) => c.id === localId);
    const serverId =
      chat?.chatId || (typeof localId === "string" ? null : localId);

    if (serverId && chat && chat.messages.length === 0) {
      try {
        const res = await fetch(oneChatUrl(serverId), {
          headers: isAuthenticated ? authHeaders() : {},
        });
        if (!res.ok) throw new Error(await res.text());
        const full = await res.json();

        setChats((prev) =>
          prev.map((c) =>
            c.id === localId
              ? {
                  ...c,
                  chatId: full._id,
                  title: full.title || c.title,
                  messages: (Array.isArray(full.messages)
                    ? full.messages
                    : []
                  ).map((m) => ({ role: m.role, content: m.content, learned:!!m.learned, choiceLocked: !!m.choiceLocked, })),
                  closed: !!full.closed,
                  hasFinalChoice: !!full.hasFinalChoice,
                }
              : c
          )
        );
      } catch (e) {
        console.error("Failed to load chat messages:", e);
      }
    }
  }

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isTyping]);

  function openDeleteDialog(chat) {
    setChatPendingDelete(chat);
    setConfirmDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    const chat = chatPendingDelete;
    if (!chat) return;

    try {
      const serverId =
        chat.chatId || (typeof chat.id === "string" ? chat.id : null);
      if (serverId) {
        const url = isAuthenticated
          ? `${API_BASE}/api/chats/${serverId}`
          : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(
              SESSION_ID
            )}`;
        const res = await fetch(url, {
          method: "DELETE",
          headers: buildHeaders(),
        });
        if (!res.ok) {
          const t = await res.text();
          console.error("Delete failed ->", res.status, t);
          alert("Failed to delete chat on server.");
          return;
        }
      }

      setChats((prev) => {
        const next = prev.filter((c) => c.id !== chat.id);
        if (!isAuthenticated && !suppressLocalLoadRef.current)
          saveChatsToLocal(next);
        return next;
      });

      if (activeChatId === chat.id) {
        setActiveChatId(null);
        const last = loadActiveChatId();
        if (String(last) === String(chat.id)) saveActiveChatId(null);
      }
    } catch (e) {
      console.error("Failed to delete chat:", e);
      alert("Failed to delete chat. Please try again.");
    } finally {
      setConfirmDeleteOpen(false);
      setChatPendingDelete(null);
    }
  }

  function handleChooseRecommendation(text, msgIndex) {
    if (!isAuthenticated || !activeChatId) return;
    if (!text) return;

    const titleOnly = getDishTitle(text);

    setPendingChoice(titleOnly);
    setPendingChoiceMessageIndex(msgIndex);
    setShowConfirmChoiceModal(true);
  }

  async function confirmRecommendationChoice() {
    if (!activeChatId || !pendingChoice) return;

    const chat = chats.find((c) => c.id === activeChatId);
    const sourceChatId = chat?.chatId || null;
    const titleOnly = pendingChoice; // already cleaned via getDishTitle

    try {
      await fetch(`${API_BASE}/api/history`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          label: titleOnly,
          type: "recipe",
          chatId: sourceChatId,
          mood: selectedMood || null,
        }),
      });
    } catch (e) {
      console.error("history_save_error:", e);
    }

    setChosenRecommendation(titleOnly);
    setCtaChatId(activeChatId);        // 👈 buttons belong to the currently active chat
    setShowConfirmChoiceModal(false);
    setPostDecisionStep("awaitingType");

    const followup = `Yum, great choice! Since you picked "${titleOnly}", do you want me to suggest side dishes, drinks, or desserts that go well with it? You can also use the buttons below if you’d like a recipe or restaurants for this.`;

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              hasFinalChoice: true,
              closed: true,
              messages: c.messages
                .map((msg, index) =>
                  index === pendingChoiceMessageIndex
                    ? { ...msg, choiceLocked: true }
                    : msg
                )
                .concat({
                  role: "assistant",
                  content: followup,
                }),
            }
          : c
      )
    );

    setPendingChoice(null);
    setPendingChoiceMessageIndex(null);
  }

  function goToRecipePage() {
    if (!chosenRecommendation) return;
    const q = encodeURIComponent(chosenRecommendation);
    setPostDecisionStep("done");
    navigate(`/recipes?q=${q}`);
  }

  async function fetchRestaurantsForChoice() {
    if (!chosenRecommendation || !activeChatId) return;

    const chat = chats.find((c) => c.id === activeChatId);
    const history = chat?.messages || [];

    setIsTyping(true);
    setPostDecisionStep("done");

    try {
      const { reply } = await apiChat({
        message: `The user finalized their decision: "${chosenRecommendation}". Please suggest 3–5 restaurants in Metro Manila (Philippines) that match this choice. Respond with a short bulleted list of restaurant names plus a tiny note each.`,
        history,
        chatId: chat?.chatId || null,
        mood: null,
      });

      const aiText =
        (reply || "").trim() ||
        "Here are some restaurant ideas you can try:";

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant", content: aiText },
                ],
              }
            : c
        )
      );
    } catch (e) {
      console.error("restaurant_flow_error:", e);
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    role: "assistant",
                    content:
                      "Sorry, something went wrong while fetching restaurant ideas.",
                  },
                ],
              }
            : c
        )
      );
    } finally {
      setIsTyping(false);
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 3000);
    }
  }

  const currentInputLength = input.length;

  // Mood helper for the pill
  const currentMoodOption =
    MOOD_OPTIONS.find((m) => m.emoji === selectedMood) || null;

  const moodDisplayEmoji = currentMoodOption?.emoji || "😐";     // was 🙂 before
  const moodDisplayLabel = currentMoodOption?.label || "Neutral";

function renderMoodPill() {
  if (isInputLocked) return null;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={() => setMoodMenuOpen((v) => !v)}
        style={{
          borderRadius: 999,
          border: "1px solid #F4E4C1",
          background: "#FFFFFF",
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <span style={{ fontSize: 16 }}>{moodDisplayEmoji}</span>
        <span style={{ fontSize: 11, color: brand.text }}>
          {moodDisplayLabel}
        </span>
      </button>

      {moodMenuOpen && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "110%", // pops up above the chip
            background: "#FFFFFF",
            borderRadius: 12,
            border: "1px solid #F4E4C1",
            padding: 6,
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
            zIndex: 30,
            minWidth: 180,
          }}
        >
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => {
                setSelectedMood(m.emoji);
                setMoodMenuOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 18 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

  return (
    <>
      <style>{`
        @media (min-width: 769px) { .swipe-indicator { display: none !important; } }
        @media (max-width: 768px) {
          .chat-sidebar { position: fixed !important; left: -100% !important; top: 0 !important; z-index: 1000 !important; transition: left 0.3s ease !important; }
          .chat-sidebar.show { left: 0 !important; box-shadow: "4px 0 20px rgba(0,0,0,0.3)" !important; }
          .sidebar-overlay { display: block !important; }
          .swipe-indicator { display: flex !important; }
        }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.6 } }
        @keyframes mouthTalk { 0% { transform: translate(-50%,-50%) scaleY(0.3);} 25% { transform: translate(-50%,-50%) scaleY(1.0);} 50% { transform: translate(-50%,-50%) scaleY(0.4);} 75% { transform: translate(-50%,-50%) scaleY(0.9);} 100% { transform: translate(-50%,-50%) scaleY(0.3);} }
        .small-mouth.talking { animation: mouthTalk .35s infinite ease-in-out; }
        @keyframes thinkingDot { 0%, 20%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
        .thinking-dots .dot { animation: thinkingDot 1.4s infinite ease-in-out; font-size: 12px; color: #FFC42D; }
        .thinking-dots .dot:nth-child(1) { animation-delay: 0s; }
        .thinking-dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinkingHandMove {
          0%, 100% { transform: translateY(0px) rotate(-5deg); opacity: 1; }
          15% { transform: translateY(-2px) rotate(-8deg); }
          30% { transform: translateY(0px) rotate(-5deg); }
          45% { transform: translateY(-3px) rotate(-10deg); }
          60% { transform: translateY(-1px) rotate(-6deg); }
          75% { transform: translateY(-2px) rotate(-8deg); }
        }
        .thinking-hand { animation: thinkingHandMove 2s infinite ease-in-out; }
      `}</style>

      {/* Mobile swipe indicator */}
      <div
        className="swipe-indicator"
        style={{
          position: "fixed",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          background: brand.primary,
          padding: "12px 8px 12px 4px",
          borderRadius: "0 12px 12px 0",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 998,
          display: "none",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
          animation: "pulse 2s infinite",
        }}
        onClick={() => setShowSidebar(true)}
      >
        <ChevronRight size={20} color="white" />
        <div
          style={{
            fontSize: 10,
            color: "white",
            fontWeight: 600,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            letterSpacing: "1px",
          }}
        >
          HISTORY
        </div>
      </div>

      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "none",
          }}
          className="sidebar-overlay"
        />
      )}

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          background: brand.bg,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (touchStart - touchEnd > 75) setShowSidebar(false);
          if (touchStart - touchEnd < -75 && touchStart < 50)
            setShowSidebar(true);
        }}
      >
        {/* Sidebar */}
        <div
          className={`chat-sidebar ${showSidebar ? "show" : ""}`}
          style={{
            width: 256,
            minWidth: 256,
            background: brand.cardBg,
            borderRight: "1px solid #F4E4C1",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            height: "100vh",
            position: "sticky",
            top: 0,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
              borderRadius: "0 0 16px 16px",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={24} color="white" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "white",
                }}
              >
                Chat History
              </span>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="white" />
            </button>
          </div>

          <div
            style={{
              padding: "0 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <button
              onClick={() => createNewChat()}
              disabled={!isAuthenticated}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                cursor: !isAuthenticated ? "not-allowed" : "pointer",
                background:
                  "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                border: "none",
                fontWeight: 500,
                color: "white",
                boxShadow: "0 2px 4px rgba(255,196,45,0.3)",
                opacity: !isAuthenticated ? 0.5 : 1,
              }}
            >
              <Plus size={20} color="white" />
              <span>New Chat</span>
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid #F4E4C1",
                fontWeight: 500,
                color: brand.text,
              }}
            >
              <Search size={20} color={brand.primary} />
              <span>Search Chats</span>
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid #F4E4C1",
                fontWeight: 500,
                color: brand.text,
              }}
            >
              <Image size={20} color={brand.primary} />
              <span>Library</span>
            </button>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: "0 12px",
              flex: 1,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: brand.text,
                padding: "0 12px",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              CHATS
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 8,
                    background:
                      activeChatId === chat.id
                        ? brand.secondary
                        : "transparent",
                    border:
                      activeChatId === chat.id
                        ? "1px solid #FEF3C7"
                        : "1px solid transparent",
                  }}
                >
                  <button
                    onClick={() => selectChat(chat.id)}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color:
                        activeChatId === chat.id
                          ? brand.darkText
                          : brand.text,
                      fontWeight:
                        activeChatId === chat.id ? 600 : 400,
                      fontSize: 14,
                      cursor: "pointer",
                      padding: "8px 6px",
                    }}
                  >
                    {chat.title}
                    {chat.closed && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "#9CA3AF",
                        }}
                      >
                        (closed)
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => openDeleteDialog(chat)}
                    title="Delete chat"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#D4A574",
                      cursor: "pointer",
                      padding: 6,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        brand.secondary)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background =
                        "transparent")
                    }
                    aria-label={`Delete ${chat.title}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderTop: "1px solid #F4E4C1",
              background: brand.secondary,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow:
                    "0 2px 4px rgba(255,196,45,0.3)",
                }}
              >
                <User size={20} color="white" />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: brand.darkText,
                }}
              >
                Username
              </span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {!activeChatId ? (
            // Landing view – no active chat
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <BotLogo />
              <div
                style={{
                  width: "100%",
                  maxWidth: 672,
                  marginTop: 32,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* mood chip on the left */}
                  <div style={{ flexShrink: 0 }}>{renderMoodPill()}</div>

                  {/* input + send on the right */}
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && input.trim()) {
                          createNewChat(input);
                        }
                      }}
                      style={{
                        width: "100%",
                        borderRadius: 16,
                        border: "2px solid #F4E4C1",
                        background: isInputLocked ? "#F5F5F5" : "white",
                        padding: "14px 56px 14px 20px", // normal left padding now
                        fontSize: 14,
                        outline: "none",
                        boxShadow: "0 2px 8px rgba(255,196,45,0.1)",
                        boxSizing: "border-box",
                        pointerEvents: isInputLocked ? "none" : "auto",
                      }}
                      placeholder={
                        guestLimitReached
                          ? "Guest chat limit reached. Please signup or login to continue."
                          : "Ask me anything about food..."
                      }
                      maxLength={200}
                      disabled={isInputLocked}
                    />
                    <button
                      onClick={() => {
                        if (input.trim()) createNewChat(input);
                      }}
                      disabled={isInputLocked}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        borderRadius: 12,
                        padding: 10,
                        background:
                          "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                        border: "none",
                        cursor: isInputLocked ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(255,196,45,0.3)",
                        opacity: isInputLocked ? 0.6 : 1,
                      }}
                    >
                      <Send size={18} color="white" />
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        bottom: -18,
                        fontSize: 11,
                        color: brand.text,
                        opacity: 0.7,
                      }}
                    >
                      {currentInputLength}/200
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Active chat view
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: brand.cardBg,
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "2px solid #F4E4C1",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                }}
              >
                <Sparkles size={18} color="white" />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "white",
                  }}
                >
                  {activeChat?.title || "Chat"}
                  {activeChat?.closed && " (closed)"}
                </span>
              </div>

              <div
                ref={scrollerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {activeChat?.messages?.length ? (
                  activeChat.messages.map((m, idx) => {
                    const options = [];
                    const showLearnedNote = !!m.learned;
                    let displayContent = m.content;

                    if (m.role === "assistant") {
                      const extracted = extractRecommendationOptions(m.content);
                      if (extracted?.options?.length) {
                        options.push(...extracted.options);
                      }
                      displayContent = stripRecommendationLines(m.content);
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent:
                            m.role === "user" ? "flex-end" : "flex-start",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        {m.role === "assistant" && (
                          <SmallBotAvatar
                            mode={
                              isTalking &&
                              idx === activeChat.messages.length - 1
                                ? "talking"
                                : "idle"
                            }
                          />
                        )}

                        <div
                          style={{
                            maxWidth: "85%",
                            borderRadius: 14,
                            padding: "10px 14px",
                            fontSize: 14,
                            lineHeight: 1.5,
                            background:
                              m.role === "user" ? "#ffffff" : "#FFF7DA",
                            border:
                              m.role === "user"
                                ? "1px solid #F4E4C1"
                                : "1px solid #FEF3C7",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        >
                          {/* Main text */}
                          {displayContent}

                          {/* Recommendation choices */}
                          {options.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {options.map((opt, i) => {
                                const titleOnly = getDishTitle(opt);
                                const colonIndex = opt.indexOf(":");
                                const description =
                                  colonIndex !== -1
                                    ? opt.slice(colonIndex + 1).trim()
                                    : "";

                                const hideButton =
                                  m.choiceLocked;

                                return (
                                  <div
                                    key={i}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        fontSize: 13,
                                        textAlign: "left",
                                      }}
                                    >
                                      <div style={{ fontWeight: 600 }}>
                                        {titleOnly}
                                      </div>
                                      {description && (
                                        <div
                                          style={{
                                            fontSize: 12,
                                            opacity: 0.85,
                                            marginTop: 2,
                                          }}
                                        >
                                          {description}
                                        </div>
                                      )}
                                    </div>

                                    {!hideButton && isAuthenticated &&  (
                                      <button
                                        onClick={() =>
                                          handleChooseRecommendation(opt, idx)
                                        }
                                        style={{
                                          borderRadius: 999,
                                          padding: "4px 10px",
                                          border: "1px solid #FDBA74",
                                          background: "#FFFBEB",
                                          fontSize: 11,
                                          cursor: "pointer",
                                          fontWeight: 600,
                                        }}
                                      >
                                        I&apos;m choosing this!
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Learned note */}
                          {showLearnedNote && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 11,
                                color: "#6B7280",
                              }}
                            >
                              Chatbot just learned something about you!
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: brand.text,
                    }}
                  >
                    Start the conversation
                  </div>
                )}

                {isTyping && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <SmallBotAvatar mode="thinking" />
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "2px solid #F4E4C1",
                  background: brand.secondary,
                }}
              >
                {/* Post-decision CTA buttons */}
                {isAuthenticated &&
                  postDecisionStep === "awaitingType" &&
                  chosenRecommendation && 
                  activeChatId === ctaChatId &&(
                    <div
                      style={{
                        maxWidth: 768,
                        margin: "0 auto 8px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={goToRecipePage}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid #F4E4C1",
                          background: "#FFFFFF",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        I want a recipe for this
                      </button>
                      <button
                        onClick={fetchRestaurantsForChoice}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "none",
                          background:
                            "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                          color: "#fff",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Show me restaurants
                      </button>
                    </div>
                  )}

                <div
                  style={{
                    maxWidth: 768,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* mood chip on the left */}
                  <div style={{ flexShrink: 0 }}>{renderMoodPill()}</div>

                  {/* chat input + send on the right */}
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      style={{
                        width: "100%",
                        borderRadius: 16,
                        border: "2px solid #F4E4C1",
                        background: isInputLocked ? "#F5F5F5" : "white",
                        padding: "10px 48px 10px 16px",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                        boxShadow: "0 2px 4px rgba(255,196,45,0.1)",
                        pointerEvents: isInputLocked ? "none" : "auto",
                      }}
                      placeholder={
                          guestLimitReached
                          ? "Guest chat limit reached. Please signup or login to continue."
                          : "Type your message…"
                      }
                      disabled={isTyping || isInputLocked}
                      maxLength={200}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={isTyping || isInputLocked}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        borderRadius: 12,
                        padding: 8,
                        background:
                          "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                        border: "none",
                        cursor:
                          isTyping || isInputLocked
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isTyping || isInputLocked ? 0.6 : 1,
                        boxShadow: "0 2px 4px rgba(255,196,45,0.3)",
                      }}
                      aria-label="Send"
                      title={
                        isTyping
                          ? "Sending…"
                          : guestLimitReached
                          ? "Input disabled"
                          : "Send"
                      }
                    >
                      <Send size={16} color="white" />
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        bottom: -16,
                        fontSize: 11,
                        color: brand.text,
                        opacity: 0.7,
                      }}
                    >
                      {currentInputLength}/200
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: confirm delete chat */}
      {confirmDeleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmDeleteOpen(false);
              setChatPendingDelete(null);
            }
          }}
        >
          <div
            style={{
              width: "min(92vw, 420px)",
              background: brand.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,.2)",
              border: "2px solid #F4E4C1",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#FFF7DA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #FEF3C7",
                }}
              >
                <X size={18} color="#ef4444" />
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: brand.darkText,
                }}
              >
                Delete chat?
              </div>
            </div>

            <div
              style={{
                fontSize: 14,
                color: brand.text,
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              Are you sure you want to delete{" "}
              <span
                style={{
                  fontWeight: 600,
                  color: brand.darkText,
                }}
              >
                {chatPendingDelete?.title || "this chat"}
              </span>
              ? This action cannot be undone.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setChatPendingDelete(null);
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #F4E4C1",
                  background: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                  color: brand.text,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: guest chat limit / no new chats */}
      {showAnonLimitModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAnonLimitModal(false);
            }
          }}
        >
          <div
            style={{
              width: "min(92vw, 420px)",
              background: brand.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,.2)",
              border: "2px solid #F4E4C1",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: brand.darkText,
                marginBottom: 8,
              }}
            >
              Chat limit reached
            </div>
            <div
              style={{
                fontSize: 14,
                color: brand.text,
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              You can chat up to 5 times while using Pick-A-Plate as a guest,
              and you only get one chat thread. Please{" "}
              <strong>sign up or log in</strong> to start more chats and save
              your food history.
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAnonLimitModal(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #F4E4C1",
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  color: brand.text,
                  fontWeight: 500,
                }}
              >
                Close
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #F4E4C1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  cursor: "pointer",
                  color: brand.darkText,
                  fontWeight: 500,
                }}
              >
                Go back to home
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Signup or Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirm recommendation choice */}
      {showConfirmChoiceModal && pendingChoice && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmChoiceModal(false);
              setPendingChoice(null);
            }
          }}
        >
          <div
            style={{
              width: "min(92vw, 460px)",
              background: brand.cardBg,
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,.2)",
              border: "2px solid #F4E4C1",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: brand.darkText,
                marginBottom: 8,
              }}
            >
              Lock in this recommendation?
            </div>
            <div
              style={{
                fontSize: 14,
                color: brand.text,
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              You chose:
              <br />
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "#FFF7DA",
                  border: "1px solid #FEF3C7",
                  fontWeight: 500,
                }}
              >
                {pendingChoice}
              </span>
              <br />
              <br />
              Are you sure with your decision? After confirming, you won&apos;t
              be able to send new messages in this chat, and we&apos;ll help you
              get a recipe or restaurant for it.
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setShowConfirmChoiceModal(false);
                  setPendingChoice(null);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #F4E4C1",
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  color: brand.text,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRecommendationChoice}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#22c55e",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Yes, I&apos;m sure
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
