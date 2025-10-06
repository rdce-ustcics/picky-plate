import React, { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Search, Image as ImageIcon, Send, User, Sparkles, BookOpen } from "lucide-react";


const seedPrompts = [
  "What to eat today?",
  "What to eat tomorrow?",
  "What to eat next week?",
  "What to eat this Saturday?",
  "What to eat today?",
];

const brand = {
  primary: "#FFC42D",
  dark: "#FFB400",
  text: "#2b2b2b",
  subtle: "#A7A7A7",
  bg: "#F6F6F7",
};

function BotLogo() {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Bot icon */}
      <div className="relative">
        <div
          className="mx-auto rounded-full" 
          style={{ width: 88, height: 88, background: brand.primary }}
        />
        {/* face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-black/80" />
              <div className="w-2 h-2 rounded-full bg-black/80" />
            </div>
            <div className="w-8 h-2 rounded-b-full bg-black/80" />
          </div>
        </div>
        {/* antenna */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="w-8 h-1 bg-[--brandDark] rounded-full" style={{ background: brand.dark }} />
          <div className="w-3 h-3 rounded-full mx-auto -mt-2" style={{ background: brand.primary }} />
        </div>
      </div>
      {/* Wordmark */}
      <div className="text-center">
        <div className="text-2xl font-extrabold tracking-tight text-[--brandText]" style={{ color: brand.text }}>
          Pick<span className="text-black">A</span>Plate<span className="text-[--brandPrimary]" style={{ color: brand.primary }}>.</span>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition hover:bg-white hover:shadow-sm ${
        active ? "bg-white shadow-sm" : "bg-transparent"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-white border border-black/5"
            : "bg-[#fff7da] border border-amber-100"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function PickAPlateChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(seedPrompts.map((t, i) => ({ id: i + 1, title: t })));
  const [activeChatId, setActiveChatId] = useState(null);
  const scrollerRef = useRef(null);

  const activeChat = useMemo(() => {
    return chats.find(c => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  function startNewChat(template) {
    const id = Date.now();
    const title = template || "New chat";
    const chat = { id, title };
    setChats(prev => [chat, ...prev]);
    setActiveChatId(id);
    if (template) {
      handleSend(template);
    } else {
      setMessages([]);
    }
  }

  function handleSend(forcedText) {
    const text = (forcedText ?? input).trim();
    if (!text) return;
    setInput("");
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    // Fake assistant reply (front‑end only)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thanks! (frontend-only) Imagine a smart meal suggestion here. Hook this up to your API later.",
        },
      ]);
    }, 550);
  }

  useEffect(() => {
    // Auto-scroll to bottom on message add
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="min-h-screen w-full" style={{ background: brand.bg }}>
      {/* Shell */}
      <div className="mx-auto max-w-[1200px] px-3 py-4 md:py-8">
        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="sticky top-4 flex flex-col gap-4 bg-[#f9f9fa] border border-black/5 rounded-2xl p-3 md:p-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <BookOpen size={16} />
                  <span>Menu</span>
                </div>
              </div>

              <SidebarItem icon={Plus} label="New Chat" onClick={() => startNewChat()} />
              <SidebarItem icon={Search} label="Search Chats" onClick={() => {}} />
              <SidebarItem icon={ImageIcon} label="Library" onClick={() => {}} />

              {/* Chats */}
              <div className="mt-2">
                <div className="text-xs uppercase tracking-wide text-black/50 px-2 mb-2">Chats</div>
                <div className="flex flex-col gap-1">
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChatId(c.id);
                        setMessages([]);
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-sm hover:bg-white hover:shadow-sm transition ${
                        activeChatId === c.id ? "bg-white shadow-sm" : "bg-transparent"
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* User */}
              <div className="mt-3 border-t border-black/5 pt-3 flex items-center gap-2 text-sm text-black/70">
                <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="truncate">Username</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-9">
            <div className="bg-[#f9f9fa] border border-black/5 rounded-3xl min-h-[70vh] flex flex-col">
              {/* Empty state vs chat */}
              {messages.length === 0 ? (
                <div className="flex-1 grid place-items-center p-6">
                  <div className="flex flex-col items-center gap-6">
                    <BotLogo />

                    {/* Input Box (center) */}
                    <div className="w-full max-w-2xl">
                      <div className="relative">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          className="w-full rounded-2xl border border-black/5 bg-white px-4 py-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-[--brandPrimary]"
                          placeholder="Type or Ask anything"
                          style={{
                            boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                          }}
                        />
                        <button
                          onClick={() => handleSend()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 bg-[--brandPrimary] hover:bg-[--brandDark] transition"
                          style={{ background: brand.primary }}
                          aria-label="Send"
                        >
                          <Send size={18} className="text-white" />
                        </button>
                      </div>

                      {/* Quick templates */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {seedPrompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => startNewChat(p)}
                            className="text-xs px-3 py-2 rounded-full border border-black/10 bg-white hover:bg-[#fff7da] transition"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* header */}
                  <div className="px-4 md:px-6 py-3 border-b border-black/5 flex items-center gap-2 text-sm">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span className="font-medium">{activeChat?.title || "New chat"}</span>
                  </div>

                  {/* messages */}
                  <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {messages.map((m, idx) => (
                      <ChatBubble key={idx} role={m.role} content={m.content} />
                    ))}
                  </div>

                  {/* composer */}
                  <div className="p-3 md:p-4 border-t border-black/5 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="relative max-w-3xl mx-auto">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[--brandPrimary]"
                        placeholder="Type your message…"
                      />
                      <button
                        onClick={() => handleSend()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 bg-[--brandPrimary] hover:bg-[--brandDark] transition"
                        style={{ background: brand.primary }}
                        aria-label="Send"
                      >
                        <Send size={18} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
