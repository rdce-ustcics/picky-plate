import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiGet, apiPatch } from '../../api/admin';

function ReportedRecipesTab() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/reported-recipes?status=pending', token);
      setRows(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load reported recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, type) => {
    try {
      if (type === 'delete') await apiPatch(`/recipes/${id}/soft-delete`, {}, token);
      if (type === 'reinstate') await apiPatch(`/recipes/${id}/reinstate`, {}, token);
      await load();
    } catch (e) {
      console.error(e);
      alert('Action failed');
    }
  };

  if (loading) return <div>Loading…</div>;
  if (!rows.length) return <div>No pending reports 🎉</div>;

  return (
    <div className="space-y-3">
      {rows.map(({ recipe, reportCount, lastReportedAt }) => (
        <div key={recipe._id} className="p-3 rounded-xl border flex items-center justify-between">
          <div>
            <div className="font-semibold">{recipe.title} {recipe.isDeleted && <span className="ml-2 text-red-600">(deleted)</span>}</div>
            <div className="text-sm opacity-70">
              Reports: {reportCount} · Last: {new Date(lastReportedAt).toLocaleString()}
            </div>
          </div>
          <div className="space-x-2">
            {!recipe.isDeleted && (
              <button className="px-3 py-1 rounded-lg border hover:opacity-80"
                      onClick={() => act(recipe._id, 'delete')}>
                Delete
              </button>
            )}
            {recipe.isDeleted && (
              <button className="px-3 py-1 rounded-lg border hover:opacity-80"
                      onClick={() => act(recipe._id, 'reinstate')}>
                Reinstate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CulturalExplorerTab() {
  const { token } = useAuth();
  const [form, setForm] = useState({ enabled: true, featuredRegions: [], rotationDays: 7, description: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/cultural-explorer', token);
      setForm(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const payload = {
        ...form,
        featuredRegions: (typeof form.featuredRegions === 'string'
          ? form.featuredRegions.split(',').map(s => s.trim()).filter(Boolean)
          : form.featuredRegions)
      };
      await apiPatch('/cultural-explorer', payload, token);
      alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    }
  };

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form.enabled}
          onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
        />
        <span>Enable Cultural Food Explorer</span>
      </label>

      <div>
        <div className="text-sm mb-1">Featured Regions/Tags (comma-separated)</div>
        <input
          className="w-full p-2 rounded-lg border"
          value={Array.isArray(form.featuredRegions) ? form.featuredRegions.join(', ') : (form.featuredRegions || '')}
          onChange={e => setForm(f => ({ ...f, featuredRegions: e.target.value }))}
          placeholder="e.g., Ilocano, Kapampangan, Bicolano, Cebuano"
        />
      </div>

      <div>
        <div className="text-sm mb-1">Rotation Days</div>
        <input
          type="number"
          min="1"
          className="w-32 p-2 rounded-lg border"
          value={form.rotationDays}
          onChange={e => setForm(f => ({ ...f, rotationDays: Number(e.target.value || 7) }))}
        />
      </div>

      <div>
        <div className="text-sm mb-1">Description (optional)</div>
        <textarea
          className="w-full p-2 rounded-lg border"
          rows={3}
          value={form.description || ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      <button className="px-4 py-2 rounded-xl border hover:opacity-80" onClick={save}>
        Save Settings
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('reports');

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <button
            onClick={() => setTab('reports')}
            className={`px-3 py-1 rounded-lg border ${tab==='reports' ? 'bg-black text-white' : ''}`}
          >
            Reported Recipes
          </button>
          <button
            onClick={() => setTab('cultural')}
            className={`px-3 py-1 rounded-lg border ${tab==='cultural' ? 'bg-black text-white' : ''}`}
          >
            Cultural Explorer
          </button>
        </div>
      </div>

      {tab === 'reports' ? <ReportedRecipesTab/> : <CulturalExplorerTab/>}
    </div>
  );
}
