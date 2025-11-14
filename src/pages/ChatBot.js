import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, Plus, Search, Image, User, Send, Sparkles, X, ChevronRight } from "lucide-react";
import {
  getSessionId,
  saveChatsToLocal,
  loadChatsFromLocal,
  saveActiveChatId,
  loadActiveChatId,
} from "../utils/session";
import { useAuth } from "../auth/AuthContext";

const BOT_PNG = `${process.env.PUBLIC_URL || ""}/images/PickAPlate.png`;
const API_BASE = "http://localhost:4000";
const SESSION_ID = getSessionId();

const brand = { 
  primary: "#FFC42D", 
  secondary: "#FFF7DA", 
  text: "#8B4513", 
  darkText: "#2b2b2b", 
  bg: "#FFF9E6", 
  cardBg: "#FFFBF0" 
};

function BotLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, userSelect: "none" }}>
      <img src={BOT_PNG} alt="PickAPlate" style={{ width: 160, height: 160, objectFit: "contain", filter: "drop-shadow(0 0 30px rgba(255,196,45,.65))" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", color: brand.darkText }}>
          Pick<span style={{ color: brand.primary }}>A</span>Plate<span style={{ color: brand.primary }}>.</span>
        </div>
        <div style={{ fontSize: "0.95rem", color: brand.text, marginTop: 8 }}>Your personal food companion</div>
      </div>
    </div>
  );
}

function SmallBotAvatar({ mode }) {
  return (
    <div style={{ width: 72, height: 72, position: "relative", flexShrink: 0 }}>
      <img src={BOT_PNG} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.15))" }} />
      <div style={{ "--face": "#FFE39B", position: "absolute", left: "50%", top: "58%", transform: "translate(-50%,-50%)", width: "22%", height: "11%", background: "var(--face)", borderRadius: 8, boxShadow: "0 0 0 1px var(--face)" }} />
      <div className={`small-mouth ${mode === "talking" ? "talking" : ""}`} style={{ position: "absolute", left: "50%", top: "58%", transform: "translate(-50%,-50%)", width: "18%", height: "8%", background: "#111", borderRadius: "0 0 8px 8px", transformOrigin: "top center" }} />
      {mode === "thinking" && (
        <>
          <div className="thinking-hand" style={{ position: "absolute", left: "65%", top: "35%", width: "28%", height: "28%", transformOrigin: "bottom center" }}>
            <div style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%) rotate(-25deg)", width: "28%", height: "45%", background: "linear-gradient(to bottom, #FFD700, #FFA500)", borderRadius: "6px" }} />
            <div style={{ position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)", width: "50%", height: "50%", background: "#FFD700", borderRadius: "40%", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            <div style={{ position: "absolute", top: "-5%", left: "55%", fontSize: "14px" }}>💭</div>
          </div>
          <div className="thinking-dots" style={{ position: "absolute", top: -12, right: -12, background: "white", borderRadius: 12, padding: "4px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "flex", gap: 3 }}>
            <span className="dot">•</span><span className="dot">•</span><span className="dot">•</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatBot() {
  const { isAuthenticated, authHeaders } = useAuth();
  const location = useLocation();

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
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);

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
  
  function buildPayload({ message, history, chatId }) {
    return isAuthenticated ? { message, history, chatId } : { message, history, chatId, sessionId: SESSION_ID };
  }
  
  function oneChatUrl(serverId) {
    return isAuthenticated
      ? `${API_BASE}/api/chats/${serverId}`
      : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(SESSION_ID)}`;
  }

  const chatsListUrlStr = React.useMemo(
    () => (isAuthenticated ? `${API_BASE}/api/chats` : `${API_BASE}/api/chats?sessionId=${encodeURIComponent(SESSION_ID)}`),
    [isAuthenticated]
  );
  
  const headersForList = React.useMemo(() => (isAuthenticated ? authHeaders() : {}), [isAuthenticated, authHeaders]);

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    const nowAuth = isAuthenticated;
    prevAuthRef.current = nowAuth;

    suppressLocalLoadRef.current = true;
    clearLocalChatStorage();
    setActiveChatId(null);
    setChats([]);

    if (wasAuth && !nowAuth) {
      window.location.replace(window.location.pathname + window.location.search);
      return;
    }

    const t = setTimeout(() => {
      suppressLocalLoadRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  async function apiChat({ message, history = [], chatId = null }) {
    const recent = history
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(buildPayload({ message, history: recent, chatId })),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Chat API error ->", res.status, text);
      throw new Error(`Chat API failed (${res.status})`);
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
          }));
          setChats(uiChats);
          setActiveChatId(null);
          if (!isAuthenticated) saveChatsToLocal(uiChats);
          return;
        }

        if (canUseLocal) {
          const cached = loadChatsFromLocal();
          if (Array.isArray(cached) && cached.length) {
            setChats(cached.map((c) => ({ ...c, messages: c.messages || [] })));
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
            setChats(cached.map((c) => ({ ...c, messages: c.messages || [] })));
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
    if (!isAuthenticated && !suppressLocalLoadRef.current) saveChatsToLocal(chats);
  }, [chats, isAuthenticated]);

  useEffect(() => {
    if (activeChatId) saveActiveChatId(activeChatId);
  }, [activeChatId]);

  function createNewChat(initialMessage = null) {
    const newChat = { id: Date.now(), title: initialMessage || "New Chat", messages: [], chatId: null };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowSidebar(false);
    if (initialMessage) sendMessage(initialMessage, newChat.id);
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

    const targetChat = chats.find((c) => c.id === targetChatId);
    const history = targetChat?.messages || [];

    setInput("");
    setIsTyping(true);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === targetChatId ? { ...chat, messages: [...chat.messages, { role: "user", content: messageText }] } : chat
      )
    );

    try {
      const { reply, chatId: persistedId } = await apiChat({
        message: messageText,
        history,
        chatId: targetChat?.chatId || null,
      });

      const aiText = (reply || "").trim() || "Got it! What cuisine are you craving?";

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? { ...chat, chatId: chat.chatId || persistedId || null, messages: [...chat.messages, { role: "assistant", content: aiText }] }
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
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 3000);
    }
  }

  async function selectChat(localId) {
    setActiveChatId(localId);
    setShowSidebar(false);

    const chat = chats.find((c) => c.id === localId);
    const serverId = chat?.chatId || (typeof localId === "string" ? null : localId);

    if (serverId && chat && chat.messages.length === 0) {
      try {
        const res = await fetch(oneChatUrl(serverId), { headers: isAuthenticated ? authHeaders() : {} });
        if (!res.ok) throw new Error(await res.text());
        const full = await res.json();

        setChats((prev) =>
          prev.map((c) =>
            c.id === localId
              ? {
                  ...c,
                  chatId: full._id,
                  title: full.title || c.title,
                  messages: (Array.isArray(full.messages) ? full.messages : []).map((m) => ({ role: m.role, content: m.content })),
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
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [activeChat?.messages, isTyping]);

  function openDeleteDialog(chat) {
    setChatPendingDelete(chat);
    setConfirmDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    const chat = chatPendingDelete;
    if (!chat) return;

    try {
      const serverId = chat.chatId || (typeof chat.id === "string" ? chat.id : null);
      if (serverId) {
        const url = isAuthenticated
          ? `${API_BASE}/api/chats/${serverId}`
          : `${API_BASE}/api/chats/${serverId}?sessionId=${encodeURIComponent(SESSION_ID)}`;
        const res = await fetch(url, { method: "DELETE", headers: buildHeaders() });
        if (!res.ok) {
          const t = await res.text();
          console.error("Delete failed ->", res.status, t);
          alert("Failed to delete chat on server.");
          return;
        }
      }

      setChats((prev) => {
        const next = prev.filter((c) => c.id !== chat.id);
        if (!isAuthenticated && !suppressLocalLoadRef.current) saveChatsToLocal(next);
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
        style={{ position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)", background: brand.primary, padding: "12px 8px 12px 4px", borderRadius: "0 12px 12px 0", boxShadow: "2px 0 8px rgba(0,0,0,0.1)", zIndex: 998, display: "none", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", animation: "pulse 2s infinite" }}
        onClick={() => setShowSidebar(true)}
      >
        <ChevronRight size={20} color="white" />
        <div style={{ fontSize: 10, color: "white", fontWeight: 600, writingMode: "vertical-rl", textOrientation: "mixed", letterSpacing: "1px" }}>
          HISTORY
        </div>
      </div>

      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", zIndex: 999, display: "none" }} className="sidebar-overlay" />
      )}

      <div
        style={{ minHeight: "100vh", width: "100%", display: "flex", background: brand.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (touchStart - touchEnd > 75) setShowSidebar(false);
          if (touchStart - touchEnd < -75 && touchStart < 50) setShowSidebar(true);
        }}
      >
        {/* Sidebar */}
        <div className={`chat-sidebar ${showSidebar ? "show" : ""}`} style={{ width: 256, minWidth: 256, background: brand.cardBg, borderRight: "1px solid #F4E4C1", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)", borderRadius: "0 0 16px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={24} color="white" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Chat History</span>
            </div>
            <button onClick={() => setShowSidebar(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="white" />
            </button>
          </div>

          <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => createNewChat()} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)", border: "none", fontWeight: 500, color: "white", boxShadow: "0 2px 4px rgba(255,196,45,0.3)" }}>
              <Plus size={20} color="white" />
              <span>New Chat</span>
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", border: "1px solid #F4E4C1", fontWeight: 500, color: brand.text }}>
              <Search size={20} color={brand.primary} />
              <span>Search Chats</span>
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", border: "1px solid #F4E4C1", fontWeight: 500, color: brand.text }}>
              <Image size={20} color={brand.primary} />
              <span>Library</span>
            </button>
          </div>

          <div style={{ marginTop: 24, padding: "0 12px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: brand.text, padding: "0 12px", marginBottom: 12, fontWeight: 600 }}>
              CHATS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {chats.map((chat) => (
                <div key={chat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 8px", borderRadius: 8, background: activeChatId === chat.id ? brand.secondary : "transparent", border: activeChatId === chat.id ? "1px solid #FEF3C7" : "1px solid transparent" }}>
                  <button
                    onClick={() => selectChat(chat.id)}
                    style={{ flex: 1, textAlign: "left", border: "none", background: "transparent", color: activeChatId === chat.id ? brand.darkText : brand.text, fontWeight: activeChatId === chat.id ? 600 : 400, fontSize: 14, cursor: "pointer", padding: "8px 6px" }}
                  >
                    {chat.title}
                  </button>

                  <button
                    onClick={() => openDeleteDialog(chat)}
                    title="Delete chat"
                    style={{ border: "none", background: "transparent", color: "#D4A574", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = brand.secondary)}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    aria-label={`Delete ${chat.title}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 16, borderTop: "1px solid #F4E4C1", background: brand.secondary }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 4px rgba(255,196,45,0.3)" }}>
                <User size={20} color="white" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: brand.darkText }}>Username</span>
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
                    onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) createNewChat(input); }}
                    style={{ width: "100%", borderRadius: 16, border: "2px solid #F4E4C1", background: "white", padding: "14px 56px 14px 20px", fontSize: 14, outline: "none", boxShadow: "0 2px 8px rgba(255,196,45,0.1)", boxSizing: "border-box" }}
                    placeholder="Ask me anything about food..."
                  />
                  <button
                    onClick={() => { if (input.trim()) createNewChat(input); }}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", borderRadius: 12, padding: 10, background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(255,196,45,0.3)" }}
                  >
                    <Send size={18} color="white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: brand.cardBg }}>
              <div style={{ padding: "12px 16px", borderBottom: "2px solid #F4E4C1", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)" }}>
                <Sparkles size={18} color="white" />
                <span style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{activeChat?.title || "Chat"}</span>
              </div>

              <div ref={scrollerRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {activeChat?.messages?.length ? (
                  activeChat.messages.map((m, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 8 }}>
                      {m.role === "assistant" && <SmallBotAvatar mode={isTalking && idx === activeChat.messages.length - 1 ? "talking" : "idle"} />}
                      <div style={{ maxWidth: "85%", borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.5, background: m.role === "user" ? "#ffffff" : "#FFF7DA", border: m.role === "user" ? "1px solid #F4E4C1" : "1px solid #FEF3C7", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        {m.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: brand.text }}>
                    Start the conversation
                  </div>
                )}

                {isTyping && (
                  <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: 8 }}>
                    <SmallBotAvatar mode="thinking" />
                  </div>
                )}
              </div>

              <div style={{ padding: "12px 16px", borderTop: "2px solid #F4E4C1", background: brand.secondary }}>
                <div style={{ position: "relative", maxWidth: 768, margin: "0 auto" }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    style={{ width: "100%", borderRadius: 16, border: "2px solid #F4E4C1", background: "white", padding: "10px 48px 10px 16px", fontSize: 14, outline: "none", boxSizing: "border-box", boxShadow: "0 2px 4px rgba(255,196,45,0.1)" }}
                    placeholder="Type your message…"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={isTyping}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", borderRadius: 12, padding: 8, background: "linear-gradient(135deg, #FFC42D 0%, #FFD700 100%)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isTyping ? 0.8 : 1, boxShadow: "0 2px 4px rgba(255,196,45,0.3)" }}
                    aria-label="Send"
                    title={isTyping ? "Sending…" : "Send"}
                  >
                    <Send size={16} color="white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
              <div style={{ fontSize: 16, fontWeight: 700, color: brand.darkText }}>Delete chat?</div>
            </div>

            <div style={{ fontSize: 14, color: brand.text, lineHeight: 1.5, marginBottom: 16 }}>
              Are you sure you want to delete{" "}
              <span style={{ fontWeight: 600, color: brand.darkText }}>{chatPendingDelete?.title || "this chat"}</span>? This action
              cannot be undone.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
    </>
  );
}