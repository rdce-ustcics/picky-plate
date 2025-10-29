// If you don't use a proxy, set REACT_APP_API_BASE=http://localhost:4000/api/admin
const BASE = process.env.REACT_APP_API_BASE || '/api/admin';

export async function apiGet(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('admin GET fail', res.status, txt);
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPatch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('admin PATCH fail', res.status, txt);
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}
