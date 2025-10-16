import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Plus, Search, Image, User, Send, Sparkles, X, ChevronRight } from "lucide-react";

//API
const API_BASE = "http://localhost:4000";

async function apiChat(message,history = []) {

  const recent = history.slice(-8).map(m => ({ role: m.role, content: m.content }));

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: recent }),
  });
  if (!res.ok) throw new Error("Chat API failed");
  const data = await res.json();
  return data.reply || "(no reply)";
}

const brand = {
  primary: "#FFC42D",
  dark: "#FFB400",
  text: "#2b2b2b",
  bg: "#F6F6F7",
};

const seedChats = [
  "What to eat today?",
  "What to eat tomorrow?",
  "What to eat next week?",
  "What to eat this saturday?",
];

function BotLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', userSelect: 'none' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          background: brand.primary,
          borderRadius: '50%',
          margin: '0 auto'
        }} 
        className="bot-logo-circle"/>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '6px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'black' }} className="bot-eye"/>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'black' }} className="bot-eye"/>
            </div>
            <div style={{ width: 32, height: 12, borderRadius: '0 0 16px 16px', background: 'black', marginTop: '3px' }} className="bot-mouth"/>
          </div>
        </div>
        <div style={{ 
          position: 'absolute', 
          top: -12, 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: brand.primary }} className="bot-antenna"/>
          <div style={{ width: 3, height: 14, background: brand.dark }} className="bot-antenna-stick"/>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: brand.text }} className="bot-title">
          Pick<span style={{ color: brand.primary }}>A</span>Plate<span style={{ color: brand.primary }}>.</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const scrollerRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (chats.length === 0) {
      const initialChats = seedChats.map((title, index) => ({
        id: index + 1,
        title,
        messages: []
      }));
      setChats(initialChats);
      setActiveChatId(0);
    }
  }, []);

  function createNewChat(initialMessage = null) {
    const newChat = {
      id: Date.now(),
      title: initialMessage || "New Chat",
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowSidebar(false);
    
    if (initialMessage) {
      sendMessage(initialMessage, newChat.id);
    }
  }

  async function sendMessage(text = null, chatId = null) {
    const messageText = text || input.trim();
    const targetChatId = chatId || activeChatId;
    
    if (!messageText) return;

    const targetChat = chats.find(c => c.id === targetChatId);
    const history = targetChat?.messages || [];
    
    setInput("");
    
    setChats(prev => prev.map(chat => {
      if (chat.id === targetChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { role: "user", content: messageText }]
        };
      }
      return chat;
    }));

    try {
      const aiReply = await apiChat(messageText, history);

    setChats(prev => prev.map(chat =>
      chat.id === targetChatId
        ? { ...chat, messages: [...chat.messages, { role: "assistant", content: aiReply }] }
        : chat
    ));
  } catch (e) {
    setChats(prev => prev.map(chat =>
      chat.id === targetChatId
        ? { ...chat, messages: [...chat.messages, { role: "assistant", content: "Error talking to server." }] }
        : chat
    ));
  }
}   
 
    

  function selectChat(chatId) {
    setActiveChatId(chatId);
    setShowSidebar(false);
  }

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);









  // Swipe handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left - close sidebar
      setShowSidebar(false);
    }

    if (touchStart - touchEnd < -75 && touchStart < 50) {
      // Swipe right from left edge - open sidebar
      setShowSidebar(true);
    }
  };




  
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
          .chat-sidebar {
            position: fixed !important;
            left: -100% !important;
            top: 0 !important;
            z-index: 1000 !important;
            transition: left 0.3s ease !important;
          }
          
          .chat-sidebar.show {
            left: 0 !important;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3) !important;
          }
          
          .sidebar-overlay {
            display: block !important;
          }
          
          .swipe-indicator {
            display: flex !important;
          }
        }
      `}</style>

      {/* Swipe Indicator - Mobile Only */}
      <div 
        className="swipe-indicator"
        style={{
          position: 'fixed',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: brand.primary,
          padding: '12px 8px 12px 4px',
          borderRadius: '0 12px 12px 0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 998,
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          animation: 'pulse 2s infinite'
        }}
        onClick={() => setShowSidebar(true)}
      >
        <ChevronRight size={20} color="white" />
        <div style={{
          fontSize: '10px',
          color: 'white',
          fontWeight: 600,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing: '1px'
        }}>
          HISTORY
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Overlay */}
      {showSidebar && (
        <div 
          onClick={() => setShowSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'none'
          }}
          className="sidebar-overlay"
        />
      )}

      <div 
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          background: brand.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ChatBot Sidebar */}
        <div 
          className={`chat-sidebar ${showSidebar ? 'show' : ''}`}
          style={{
            width: '256px',
            minWidth: '256px',
            background: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100vh',
            position: 'sticky',
            top: 0
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={24} color={brand.primary} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: brand.text }}>Chat History</span>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>

          {/* Nav Buttons */}
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => createNewChat()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontWeight: 500,
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={20} color={brand.primary} />
              <span>New Chat</span>
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontWeight: 500,
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Search size={20} color={brand.primary} />
              <span>Search Chats</span>
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontWeight: 500,
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Image size={20} color={brand.primary} />
              <span>Library</span>
            </button>
          </div>

          {/* Chats Section */}
          <div style={{ marginTop: '24px', padding: '0 12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ 
              fontSize: '11px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              color: '#9ca3af', 
              padding: '0 12px', 
              marginBottom: '12px',
              fontWeight: 600
            }}>
              CHATS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: activeChatId === chat.id ? '#f3f4f6' : 'transparent',
                    color: activeChatId === chat.id ? '#111827' : '#6b7280',
                    fontWeight: activeChatId === chat.id ? 500 : 400,
                    border: 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => { 
                    if (activeChatId !== chat.id) e.currentTarget.style.background = '#f3f4f6' 
                  }}
                  onMouseOut={(e) => { 
                    if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent' 
                  }}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={20} color="white" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Username</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!activeChatId ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '20px' 
            }}>
              <BotLogo />

              <div style={{ width: '100%', maxWidth: '672px', marginTop: '32px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && input.trim()) {
                        createNewChat(input);
                      }
                    }}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      padding: '14px 56px 14px 20px',
                      fontSize: '14px',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Type or Ask anything"
                    onFocus={(e) => {
                      e.target.style.outline = `2px solid ${brand.primary}`;
                      e.target.style.outlineOffset = '0';
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = 'none';
                    }}
                  />
                  <button
                    onClick={() => {
                      if (input.trim()) {
                        createNewChat(input);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      borderRadius: '12px',
                      padding: '10px',
                      background: brand.primary,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Send size={18} color="white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid #e5e7eb', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <Sparkles size={18} color="#eab308" />
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{activeChat?.title || "Chat"}</span>
              </div>

              <div 
                ref={scrollerRef} 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}
              >
                {activeChat?.messages.length === 0 ? (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#9ca3af' 
                  }}>
                    Start the conversation
                  </div>
                ) : (
                  activeChat?.messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: m.role === "user" ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          borderRadius: '14px',
                          padding: '10px 14px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          background: m.role === "user" ? '#ffffff' : '#FFF7DA',
                          border: m.role === "user" ? '1px solid #e5e7eb' : '1px solid #FEF3C7',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative', maxWidth: '768px', margin: '0 auto' }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      padding: '10px 48px 10px 16px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Type your message…"
                    onFocus={(e) => {
                      e.target.style.outline = `2px solid ${brand.primary}`;
                      e.target.style.outlineOffset = '0';
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = 'none';
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      borderRadius: '12px',
                      padding: '8px',
                      background: brand.primary,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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