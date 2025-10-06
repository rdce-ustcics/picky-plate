const API = process.env.REACT_APP_API_URL || ''; // with CRA proxy, '' is fine

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include', // send/receive auth cookie
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}
