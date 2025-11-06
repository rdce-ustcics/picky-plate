const SESSION_KEY = "pp_session";
const CHATS_KEY = "pp_chats";
const ACTIVE_CHAT_KEY = "pp_active";

export function getSessionId() {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    const gen = (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    s = gen;
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

export function resetSessionId() {
  localStorage.removeItem(SESSION_KEY);
  const s = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  localStorage.setItem(SESSION_KEY, s);
  return s;
}

export function clearChatCache() {
  try {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  } catch {}
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

export function saveChatsToLocal(chats) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function loadChatsFromLocal() {
  const d = localStorage.getItem(CHATS_KEY);
  return d ? JSON.parse(d) : [];
}
export function saveActiveChatId(id) {
  if (id != null) localStorage.setItem(ACTIVE_CHAT_KEY, String(id));
}

export function loadActiveChatId() {
  return localStorage.getItem(ACTIVE_CHAT_KEY);
}

export function clearLocalChats() {
  try {
    localStorage.removeItem("pap:chats");         // stored chat list (anon)
    localStorage.removeItem("pap:activeChatId");  // last selected chat id
  } catch {
    // ignore
  }
}
