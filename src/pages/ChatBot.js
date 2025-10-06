import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Plus, Search, Image, User, Send, Sparkles } from "lucide-react";

const brand = {
  primary: "#FFC42D",
  dark: "#FFB400",
  text: "#2b2b2b",
  bg: "#F6F6F7",
};

function BotLogo() {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Bot icon */}
      <div className="relative">
        <div
          className="mx-auto rounded-full" 
          style={{ width: 120, height: 120, background: brand.primary }}
        />
        {/* face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-5 mb-2">
              <div className="w-3 h-3 rounded-full bg-black" />
              <div className="w-3 h-3 rounded-full bg-black" />
            </div>
            <div className="w-12 h-4 rounded-b-full bg-black mt-1" />
          </div>
        </div>
        {/* antenna */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-3 h-3 rounded-full" style={{ background: brand.primary }} />
          <div className="w-1 h-5" style={{ background: brand.dark }} />
        </div>
      </div>
      {/* Wordmark */}
      <div className="text-center">
        <div className="text-5xl font-extrabold tracking-tight" style={{ color: brand.text }}>
          Pick<span style={{ color: brand.primary }}>A</span>Plate<span style={{ color: brand.primary }}>.</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const scrollerRef = useRef(null);

  const seedChats = [
    "What to eat today?",
    "What to eat tomorrow?",
    "What to eat next week?",
    "What to eat this saturday?",
    "What to eat today?",
  ];

  // Initialize with seed chats on mount
  useEffect(() => {
    if (chats.length === 0) {
      const initialChats = seedChats.map((title, index) => ({
        id: index + 1,
        title,
        messages: []
      }));
      setChats(initialChats);
    }
  }, []);

  const activeChat = chats.find(c => c.id === activeChatId);

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

  return (
    <div className="min-h-screen w-full flex" style={{ background: brand.bg }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Menu Icon */}
        <div className="p-4">
          <BookOpen size={28} style={{ color: brand.primary }} />
        </div>

        {/* Nav Items */}
        <div className="px-3 space-y-1">
          <button
            onClick={() => createNewChat()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition hover:bg-gray-50"
          >
            <Plus size={20} style={{ color: brand.primary }} />
            <span className="font-medium">New Chat</span>
          </button>

          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition hover:bg-gray-50"
          >
            <Search size={20} style={{ color: brand.primary }} />
            <span className="font-medium">Search Chats</span>
          </button>

          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition hover:bg-gray-50"
          >
            <Image size={20} style={{ color: brand.primary }} />
            <span className="font-medium">Library</span>
          </button>
        </div>

        {/* Chats Section */}
        <div className="mt-8 px-3 flex-1 overflow-y-auto">
          <div className="text-xs uppercase tracking-wide text-gray-400 px-3 mb-3">Chats</div>
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  activeChatId === chat.id 
                    ? "bg-gray-50 text-gray-900 font-medium" 
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: brand.primary }}
            >
              <User size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium">Username</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <BotLogo />

            {/* Input Box */}
            <div className="w-full max-w-2xl mt-12">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      createNewChat(input);
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-6 py-4 pr-16 text-sm outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
                  placeholder="Type or Ask anything"
                />
                <button
                  onClick={() => {
                    if (input.trim()) {
                      createNewChat(input);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2.5 transition hover:opacity-90"
                  style={{ background: brand.primary }}
                  aria-label="Send"
                >
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500" />
              <span className="font-medium text-sm">{activeChat?.title || "Chat"}</span>
            </div>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat?.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Start the conversation
                </div>
              ) : (
                activeChat?.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user"
                          ? "bg-white border border-gray-200 shadow-sm"
                          : "shadow-sm"
                      }`}
                      style={m.role === "assistant" ? { background: "#FFF7DA" } : {}}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="relative max-w-3xl mx-auto">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 pr-14 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Type your message…"
                />
                <button
                  onClick={() => sendMessage()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 transition"
                  style={{ background: brand.primary }}
                  aria-label="Send"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}