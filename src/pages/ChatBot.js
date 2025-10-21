import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Plus, Search, Image, User, Send, Sparkles, X, ChevronRight } from "lucide-react";
import {
  getSessionId,
  saveChatsToLocal,
  loadChatsFromLocal,
  saveActiveChatId,
  loadActiveChatId,
} from "../utils/session";
// CHANGE: import useAuth so we can branch between logged-in vs anonymous
import { useAuth } from "../auth/AuthContext";

const API_BASE = "http://localhost:4000";

// Keep an anon session id available for anonymous users.
// When you log in, AuthContext.login() already clears pp_session and pp_chats.
const SESSION_ID = getSessionId();

const brand = {
  primary: "#FFC42D",
  dark: "#FFB400",
  text: "#2b2b2b",
  bg: "#F6F6F7",
};

function BotLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, userSelect: "none" }}>
      <div style={{ position: "relative" }}>
        <div style={{ width: 80, height: 80, background: brand.primary, borderRadius: "50%", margin: "0 auto" }} className="bot-logo-circle" />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "black" }} className="bot-eye" />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "black" }} className="bot-eye" />
            </div>
            <div style={{ width: 32, height: 12, borderRadius: "0 0 16px 16px", background: "black", marginTop: 3 }} className="bot-mouth" />
          </div>
        </div>
        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: brand.primary }} className="bot-antenna" />
          <div style={{ width: 3, height: 14, background: brand.dark }} className="bot-antenna-stick" />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: brand.text }} className="bot-title">
          Pick<span style={{ color: brand.primary }}>A</span>Plate<span style={{ color: brand.primary }}>.</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  // CHANGE: we use auth state to switch between flows
  const { isAuthenticated, authHeaders } = useAuth();

  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]); // [{ id, chatId, title, messages: [...] }]
  const [activeChatId, setActiveChatId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const scrollerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // CHANGE: helper to build headers/payload per auth state
  function buildHeaders() {
    return isAuthenticated
      ? { "Content-Type": "application/json", ...authHeaders() }
      : { "Content-Type": "application/json" };
  }
  function buildPayload({ message, history, chatId }) {
    return isAuthenticated
      ? { message, history, chatId }
      : { message, history, chatId, sessionId: SESSION_ID };
  }
  function chatsListUrl() {
    return isAuthenticated
      ? `${API_BASE}/api/chats`
      : `${API_BASE}/api/chats?sessionId=${encodeURIComponent(SESSION_ID)}`;
  }
  function oneChatUrl(serverId) {
    return isAuthenticated
      ? `${API_BASE}/api/chats/${serverId}`
      : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(SESSION_ID)}`;
  }

  // --- API: send message (auth-aware) ---
  async function apiChat({ message, history = [], chatId = null }) {
    const recent = history
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
              "Content-Type": "application/json",
      ...authHeaders(), // adds Authorization header if logged in
      },                       // CHANGE: add Authorization when logged in
      body: JSON.stringify(buildPayload({            // CHANGE: include sessionId only when anonymous
        message,
        history: recent,
        chatId,
        ...(isAuthenticated ? {} : { sessionId: SESSION_ID }),
      })),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Chat API error ->", res.status, text);
      throw new Error(`Chat API failed (${res.status})`);
    }
    return res.json(); // { reply, chatId }
  }

  // Load chats on mount AND whenever auth state flips (login/logout)
  useEffect(() => {
    (async function loadChats() {
      try {
        const res = await fetch(chatsListUrl(), { headers: isAuthenticated ? authHeaders() : {} }); // CHANGE
        if (!res.ok) throw new Error(await res.text());
        const list = await res.json();

        if (Array.isArray(list) && list.length) {
          const uiChats = list.map((doc) => ({
            id: doc._id,        // keep UI id == server id so it persists across refresh
            chatId: doc._id,    // server chat id
            title: doc.title || "Chat",
            messages: [],       // load lazily when clicked
          }));
          setChats(uiChats);
          const last = loadActiveChatId();
          if (last && uiChats.some((c) => String(c.id) === String(last))) {
            setActiveChatId(last);
          } else {
            setActiveChatId(uiChats[0]?.id || null);
          }
          // Optional: keep a tiny local cache for quick sidebar render.
          saveChatsToLocal(uiChats);
          return;
        }

        // No server chats — try local cache (only meaningful for anonymous)
        const cached = loadChatsFromLocal();
        if (!isAuthenticated && Array.isArray(cached) && cached.length) {
          setChats(cached.map((c) => ({ ...c, messages: c.messages || [] })));
          setActiveChatId(loadActiveChatId() || cached[0]?.id || null);
          return;
        }

        setChats([]);
        setActiveChatId(null);
      } catch (e) {
        console.error("Failed to load chats:", e);
        // fallback to local cache only for anonymous
        const cached = !isAuthenticated ? loadChatsFromLocal() : [];
        if (Array.isArray(cached) && cached.length) {
          setChats(cached.map((c) => ({ ...c, messages: c.messages || [] })));
          setActiveChatId(loadActiveChatId() || cached[0]?.id || null);
        } else {
          setChats([]);
          setActiveChatId(null);
        }
      }
    })();
    // CHANGE: depend on isAuthenticated so it reloads when you log in/out
  }, [isAuthenticated]); 

  // Persist simple chat list & active tab locally (anonymous convenience only)
  useEffect(() => {
    if (!isAuthenticated) saveChatsToLocal(chats); // CHANGE: don't store logged-in users' tabs locally
  }, [chats, isAuthenticated]);

  useEffect(() => {
    if (activeChatId) saveActiveChatId(activeChatId);
  }, [activeChatId]);

  function createNewChat(initialMessage = null) {
    const newChat = {
      id: Date.now(), // temporary UI id; server id will come back as chatId after first send
      title: initialMessage || "New Chat",
      messages: [],
      chatId: null,
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowSidebar(false);
    if (initialMessage) {
      sendMessage(initialMessage, newChat.id);
    }
  }

  async function sendMessage(text = null, chatLocalId = null) {
    const messageText = (text ?? input).trim();
    const targetChatId = chatLocalId ?? activeChatId;

    if (!messageText || !targetChatId) return;

    const targetChat = chats.find((c) => c.id === targetChatId);
    const history = targetChat?.messages || [];

    setInput("");

    setIsTyping(true);


    // Optimistic user message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === targetChatId
          ? { ...chat, messages: [...chat.messages, { role: "user", content: messageText }] }
          : chat
      )
    );

    try {
      const { reply, chatId: persistedId } = await apiChat({
        message: messageText,
        history,
        chatId: targetChat?.chatId || null,
      });

      const aiText = reply?.trim() || "Got it! What cuisine are you craving?";

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                chatId: chat.chatId || persistedId || null, // store server chat id once received
                messages: [...chat.messages, { role: "assistant", content: aiText }],
              }
            : chat
        )
      );
    } catch (e) {
      console.error(e);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "Server error. Please try again." }] }
            : chat
        )
      );
    } finally {
      setIsTyping(false);
    }
  }

  async function selectChat(localId) {
    setActiveChatId(localId);
    setShowSidebar(false);

    const chat = chats.find((c) => c.id === localId);
    const serverId = chat?.chatId || (typeof localId === "string" ? null : localId);

    // Only fetch if it's server-backed and not yet loaded
    if (serverId && chat && chat.messages.length === 0) {
      try {
        const res = await fetch(oneChatUrl(serverId), { headers: isAuthenticated ? authHeaders() : {} }); // CHANGE
        if (!res.ok) throw new Error(await res.text());
        const full = await res.json(); // { _id, messages, title, ... }

        setChats((prev) =>
          prev.map((c) =>
            c.id === localId
              ? {
                  ...c,
                  chatId: full._id,
                  title: full.title || c.title,
                  messages: (Array.isArray(full.messages) ? full.messages : []).map((m) => ({
                    role: m.role,
                    content: m.content,
                  })),
                }
              : c
          )
        );
      } catch (e) {
        console.error("Failed to load chat messages:", e);
      }
    }
  }

  // auto-scroll on new messages
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [activeChat?.messages, isTyping]);

  // Swipe handlers
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) setShowSidebar(false); // left to close
    if (touchStart - touchEnd < -75 && touchStart < 50) setShowSidebar(true); // right from edge to open
  };

async function deleteChat(chat) {
  const confirmDelete = window.confirm(`Delete chat "${chat.title}"?`);
  if (!confirmDelete) return;

  try {
    // Figure out which id to use on the server.
    // When loaded from server, chat.id === chat.chatId. For new (unsaved) chats, chat.chatId is null.
    const serverId = chat.chatId || (typeof chat.id === "string" ? chat.id : null);

    if (serverId) {
      // Auth-aware URL and headers
      const url = isAuthenticated
        ? `${API_BASE}/api/chats/${serverId}`
        : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(SESSION_ID)}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: buildHeaders(), // includes Authorization if logged in
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("Delete failed ->", res.status, t);
        alert("Failed to delete chat on server.");
        return;
      }
    }
    
    // Remove locally
    setChats(prev => {
      const next = prev.filter(c => c.id !== chat.id);
      // Persist anon cache so it doesn't reappear on refresh
      if (!isAuthenticated) saveChatsToLocal(next);
      return next;
    });

    // If the active chat was deleted, go back to the logo state
    if (activeChatId === chat.id) {
      setActiveChatId(null);
      // Optional: also clear saved active id if it pointed to this chat
      const last = loadActiveChatId();
      if (String(last) === String(chat.id)) {
        saveActiveChatId(null);
      }
    }
  } catch (e) {
    console.error("Failed to delete chat:", e);
    alert("Failed to delete chat. Please try again.");
  }
}


  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .bot-logo-circle { width: 120px !important; height: 120px !important; }
          .bot-eye { width: 12px !important; height: 12px !important; }
          .bot-mouth { width: 48px !important; height: 16px !important; }
          .bot-antenna { width: 12px !important; height: 12px !important; }
          .bot-antenna-stick { width: 4px !important; height: 20px !important; }
          .bot-title { font-size: 3rem !important; }
          .swipe-indicator { display: none !important; }
        }
        @media (max-width: 768px) {
          .chat-sidebar { position: fixed !important; left: -100% !important; top: 0 !important; z-index: 1000 !important; transition: left 0.3s ease !important; }
          .chat-sidebar.show { left: 0 !important; box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3) !important; }
          .sidebar-overlay { display: block !important; }
          .swipe-indicator { display: flex !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .typing-dot {
        display: inline-block;
        font-weight: 700;
        animation: blink 1s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: .2s; }
        .typing-dot:nth-child(3) { animation-delay: .4s; }

        @keyframes blink {
         0%, 80%, 100% { opacity: .2; transform: translateY(0); }
        40% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>

      {/* Swipe Indicator - Mobile Only */}
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

      {/* Overlay */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", zIndex: 999, display: "none" }}
          className="sidebar-overlay"
        />
      )}

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          background: brand.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sidebar */}
        <div className={`chat-sidebar ${showSidebar ? "show" : ""}`} style={{ width: 256, minWidth: 256, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={24} color={brand.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: brand.text }}>Chat History</span>
            </div>
            <button onClick={() => setShowSidebar(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="#6b7280" />
            </button>
          </div>

          {/* Nav Buttons */}
          <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => createNewChat()} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", border: "none", fontWeight: 500 }}>
              <Plus size={20} color={brand.primary} />
              <span>New Chat</span>
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", border: "none", fontWeight: 500 }}>
              <Search size={20} color={brand.primary} />
              <span>Search Chats</span>
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", border: "none", fontWeight: 500 }}>
              <Image size={20} color={brand.primary} />
              <span>Library</span>
            </button>
          </div>

          {/* Chats */}
          <div style={{ marginTop: 24, padding: "0 12px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", padding: "0 12px", marginBottom: 12, fontWeight: 600 }}>
              CHATS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
         background: activeChatId === chat.id ? "#f3f4f6" : "transparent",
         }}
        >
        <button
        onClick={() => selectChat(chat.id)}
        style={{
        flex: 1,
        textAlign: "left",
        border: "none",
        background: "transparent",
        color: activeChatId === chat.id ? "#111827" : "#6b7280",
        fontWeight: activeChatId === chat.id ? 500 : 400,
        fontSize: 14,
        cursor: "pointer",
        padding: "8px 6px",
         }}
        >
      {chat.title}
    </button>

    <button
      onClick={() => deleteChat(chat)}  // <- we’ll add this function next
      title="Delete chat"
      style={{
        border: "none",
        background: "transparent",
        color: "#9ca3af",
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      aria-label={`Delete ${chat.title}`}
    >
      <X size={16} />
    </button>
  </div>
))}
            </div>
          </div>

          {/* User */}
          <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: brand.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={20} color="white" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Username</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!activeChatId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <BotLogo />
              <div style={{ width: "100%", maxWidth: 672, marginTop: 32 }}>
                <div style={{ position: "relative" }}>
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
                      border: "1px solid #d1d5db",
                      background: "white",
                      padding: "14px 56px 14px 20px",
                      fontSize: 14,
                      outline: "none",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                      boxSizing: "border-box",
                    }}
                    placeholder="Type or Ask anything"
                  />
                  <button
                    onClick={() => {
                      if (input.trim()) createNewChat(input);
                    }}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderRadius: 12,
                      padding: 10,
                      background: brand.primary,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={18} color="white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="#eab308" />
                <span style={{ fontWeight: 500, fontSize: 14 }}>{activeChat?.title || "Chat"}</span>
              </div>

              <div ref={scrollerRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
{activeChat?.messages?.length ? (
  <>
    {activeChat.messages.map((m, idx) => (
      <div
        key={idx}
        style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
      >
        <div
          style={{
            maxWidth: "85%",
            borderRadius: 14,
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            background: m.role === "user" ? "#ffffff" : "#FFF7DA",
            border: m.role === "user" ? "1px solid #e5e7eb" : "1px solid #FEF3C7",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {m.content}
        </div>
      </div>
    ))}

    {/* ⬇️ Typing bubble appears at the end like a new assistant message */}
    {isTyping && (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            maxWidth: "85%",
            borderRadius: 14,
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            background: "#FFF7DA",
            border: "1px solid #FEF3C7",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
        </div>
      </div>
    )}
  </>
) : (
  // No messages yet
  <>
    {isTyping ? (
      // ⬇️ Show typing bubble instead of "Start the conversation"
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            maxWidth: "85%",
            borderRadius: 14,
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            background: "#FFF7DA",
            border: "1px solid #FEF3C7",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
          <span className="typing-dot">•</span>
        </div>
      </div>
    ) : (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
        }}
      >
        Start the conversation
      </div>
    )}
  </>
)}              </div>


              <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ position: "relative", maxWidth: 768, margin: "0 auto" }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      background: "white",
                      padding: "10px 48px 10px 16px",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    placeholder="Type your message…"
                  />
                  <button
                    onClick={() => sendMessage()} disabled={isTyping}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderRadius: 12,
                      padding: 8,
                      background: brand.primary,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={16} color="white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
