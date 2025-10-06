import { useEffect, useState } from "react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Load all items from API
  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to load items");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Add a new item
  const addItem = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) throw new Error("Add failed");
      const created = await res.json();
      setItems((prev) => [created, ...prev]); // optimistic prepend
      setText("");
    } catch (e) {
      setError(e.message || "Add failed");
    } finally {
      setSending(false);
    }
  };

  // Delete an item by id
  const deleteItem = async (id) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Dashboard</h1>

      <form onSubmit={addItem} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item…"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button
          disabled={sending}
          style={{ padding: "10px 16px", borderRadius: 10 }}
          type="submit"
        >
          {sending ? "Adding…" : "Add"}
        </button>
      </form>

      {error && (
        <div style={{ background: "#ffeaea", border: "1px solid #ffb3b3", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div>No items yet. Add one! ✨</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li
              key={it._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#fff",
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{it.text}</div>
                {it.createdAt && (
                  <small style={{ color: "#666" }}>
                    {new Date(it.createdAt).toLocaleString()}
                  </small>
                )}
              </div>
              <button
                onClick={() => deleteItem(it._id)}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
