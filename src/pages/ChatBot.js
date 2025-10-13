import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Plus, Search, Image, User, Send, Sparkles } from "lucide-react";

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', userSelect: 'none' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ 
          width: 120, 
          height: 120, 
          background: brand.primary,
          borderRadius: '50%',
          margin: '0 auto'
        }} />
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'black' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'black' }} />
            </div>
            <div style={{ width: 48, height: 16, borderRadius: '0 0 24px 24px', background: 'black', marginTop: '4px' }} />
          </div>
        </div>
        <div style={{ 
          position: 'absolute', 
          top: -16, 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: brand.primary }} />
          <div style={{ width: 4, height: 20, background: brand.dark }} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em', color: brand.text }}>
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createNewChat(initialMessage = null) {
    const newChat = {
      id: Date.now(),
      title: initialMessage || "New Chat",
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    
    if (initialMessage) {
      sendMessage(initialMessage, newChat.id);
    }
  }

  function sendMessage(text = null, chatId = null) {
    const messageText = text || input.trim();
    const targetChatId = chatId || activeChatId;
    
    if (!messageText) return;
    
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

    setTimeout(() => {
      setChats(prev => prev.map(chat => {
        if (chat.id === targetChatId) {
          const aiResponse = generateResponse(messageText);
          return {
            ...chat,
            messages: [...chat.messages, { role: "assistant", content: aiResponse }]
          };
        }
        return chat;
      }));
    }, 800);
  }

  function generateResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes("today")) {
      return "For today, I'd suggest trying a fresh Greek salad with grilled chicken! It's healthy, filling, and quick to prepare. Would you like the recipe?";
    } else if (message.includes("tomorrow")) {
      return "How about some homemade pasta carbonara tomorrow? It's creamy, delicious, and takes only 20 minutes to make!";
    } else if (message.includes("week")) {
      return "For the week ahead, I can create a meal plan with variety! Think: Monday - Tacos, Tuesday - Stir-fry, Wednesday - Salmon, Thursday - Pizza night, Friday - BBQ. Sound good?";
    } else if (message.includes("saturday")) {
      return "Saturday calls for something special! How about trying a new recipe - maybe some Korean bibimbap or Italian risotto? Perfect for a relaxed weekend cooking session!";
    } else {
      return "That's a great question! I can help you decide what to eat based on your preferences, dietary needs, or what you have in the fridge. What sounds good to you?";
    }
  }

  function selectChat(chatId) {
    setActiveChatId(chatId);
  }

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  // Container styles - reset everything
  const containerStyle = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    background: brand.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  };

  // Sidebar styles
  const sidebarStyle = {
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
  };

  const buttonBaseStyle = {
    all: 'unset',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'transparent',
    fontWeight: 500,
    boxSizing: 'border-box',
    transition: 'background 0.2s'
  };

  return (
    <div style={containerStyle}>
      {/* ChatBot Sidebar */}
      <div style={sidebarStyle}>
        {/* Header */}
        <div style={{ padding: '20px' }}>
          <BookOpen size={28} color={brand.primary} />
        </div>

        {/* Nav Buttons */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => createNewChat()}
            style={buttonBaseStyle}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={20} color={brand.primary} />
            <span>New Chat</span>
          </button>

          <button
            style={buttonBaseStyle}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Search size={20} color={brand.primary} />
            <span>Search Chats</span>
          </button>

          <button
            style={buttonBaseStyle}
            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Image size={20} color={brand.primary} />
            <span>Library</span>
          </button>
        </div>

        {/* Chats Section */}
        <div style={{ marginTop: '32px', padding: '0 12px', flex: 1, overflowY: 'auto' }}>
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
                  all: 'unset',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: activeChatId === chat.id ? '#f3f4f6' : 'transparent',
                  color: activeChatId === chat.id ? '#111827' : '#6b7280',
                  fontWeight: activeChatId === chat.id ? 500 : 400,
                  boxSizing: 'border-box',
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <BotLogo />

            <div style={{ width: '100%', maxWidth: '672px', marginTop: '48px' }}>
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
                    padding: '16px 64px 16px 24px',
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
                    all: 'unset',
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '12px',
                    padding: '10px',
                    background: brand.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Send size={20} color="white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#eab308" />
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{activeChat?.title || "Chat"}</span>
            </div>

            <div ref={scrollerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeChat?.messages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
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
                        maxWidth: '70%',
                        borderRadius: '16px',
                        padding: '12px 16px',
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

            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
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
                    padding: '12px 56px 12px 20px',
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
                    all: 'unset',
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderRadius: '12px',
                    padding: '8px',
                    background: brand.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={18} color="white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}