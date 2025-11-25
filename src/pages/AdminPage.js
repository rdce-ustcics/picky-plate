import React, { useState, useEffect, useCallback, useRef } from "react";
import { Globe, Clock, TrendingUp, Users, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import LoadingModal from "../components/LoadingModal";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Admin() {
  const { authHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState("review"); // "review" | "cultural"
  const [reviewRecipes, setReviewRecipes] = useState([]);
  const [selectedReviewRecipe, setSelectedReviewRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Confirmation modal state
  const [confirm, setConfirm] = useState({
    open: false,
    action: null, // 'reinstate' | 'delete'
    recipe: null,
  });

  const modalRef = useRef(null);

  // -------- helpers --------
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // -------- fetchers --------
  const fetchReviewRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJSON(`${API_BASE}/api/admin/review-recipes`, {
        headers: authHeaders(),
      });
      setReviewRecipes(data.recipes || []);
    } catch (e) {
      console.error("review fetch error:", e);
      setError(e.message || "Failed to fetch recipes for review");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchReviewRecipes();
  }, [fetchReviewRecipes]);

  // -------- actions (with confirm) --------
  const requestReinstate = (recipe) =>
    setConfirm({ open: true, action: "reinstate", recipe });

  const requestDelete = (recipe) =>
    setConfirm({ open: true, action: "delete", recipe });

  const handleConfirm = async () => {
    if (!confirm.open || !confirm.recipe) return;
    const id = confirm.recipe._id;

    try {
      if (confirm.action === "reinstate") {
        await fetchJSON(`${API_BASE}/api/admin/recipes/${id}/reinstate`, {
          method: "POST",
          headers: authHeaders(),
        });
      } else if (confirm.action === "delete") {
        await fetchJSON(`${API_BASE}/api/admin/recipes/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
      }
      // Refresh the list to reflect DB state
      await fetchReviewRecipes();
      // Close recipe modal too if it's the same one
      if (selectedReviewRecipe?._id === id) setSelectedReviewRecipe(null);
    } catch (e) {
      alert(e.message || "Action failed");
    } finally {
      setConfirm({ open: false, action: null, recipe: null });
    }
  };

  const handleCancelConfirm = () =>
    setConfirm({ open: false, action: null, recipe: null });

  // -------- render --------
  return (
    <>
      {loading && <LoadingModal message="Loading review recipes..." />}

      <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage for-review recipes and cultural content</p>
        </div>
      </div>

      {/* TABS (Flagged removed) */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("review")}
              className={`px-6 py-4 font-semibold ${activeTab === "review"
                ? "text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-800"}`}
            >
              Recipes
              {reviewRecipes.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {reviewRecipes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("cultural")}
              className={`px-6 py-4 font-semibold flex items-center gap-2 ${activeTab === "cultural"
                ? "text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-800"}`}
            >
              <Globe className="w-5 h-5" />
              Cultural
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* REVIEW TAB */}
        {activeTab === "review" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Recipes for Review</h2>
              <button
                onClick={fetchReviewRecipes}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-yellow-400" />
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : reviewRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-500 text-lg">No recipes awaiting review</p>
                <p className="text-gray-400 text-sm mt-2">All clear! 🎉</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reviewRecipes.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group"
                    onClick={() => setSelectedReviewRecipe(r)}
                  >
                    <div className="relative">
                      <img
                        src={r.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"}
                        alt={r.title}
                        className="w-full h-56 object-cover group-hover:scale-110 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-yellow-500">
                        {r.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">By {r.author || "anonymous"}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4" /> {r.prepTime || "—"}
                        <TrendingUp className="w-4 h-4" /> {r.difficulty || "Easy"}
                        <Users className="w-4 h-4" /> {r.servings || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* REVIEW MODAL */}
            {selectedReviewRecipe && (
              <div
                className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50"
                onClick={() => setSelectedReviewRecipe(null)}
              >
                <div
                  ref={modalRef}
                  className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <img
                      src={
                        selectedReviewRecipe.image ||
                        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"
                      }
                      alt={selectedReviewRecipe.title}
                      className="w-full h-56 object-cover"
                    />
                    <button
                      onClick={() => setSelectedReviewRecipe(null)}
                      className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white"
                    >
                      <X className="w-6 h-6 text-gray-800" />
                    </button>
                  </div>

                  <div className="p-6">
                    <h2 className="text-3xl font-bold text-center mb-2">
                      {selectedReviewRecipe.title}
                    </h2>
                    <p className="text-center text-gray-600 mb-6">
                      By {selectedReviewRecipe.author || "anonymous"}
                    </p>

                    {selectedReviewRecipe.description && (
                      <p className="text-gray-700 text-center mb-4">
                        {selectedReviewRecipe.description}
                      </p>
                    )}

                    {/* Quick info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                      <div className="text-center">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                        <p className="text-xs text-gray-600 mb-1">Prep Time</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedReviewRecipe.prepTime || "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                        <p className="text-xs text-gray-600 mb-1">Cook Time</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedReviewRecipe.cookTime || "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                        <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedReviewRecipe.difficulty || "Easy"}
                        </p>
                      </div>
                      <div className="text-center">
                        <Users className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                        <p className="text-xs text-gray-600 mb-1">Servings</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedReviewRecipe.servings || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Ingredients */}
                    {selectedReviewRecipe.ingredients?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Ingredients</h3>
                        <ul className="bg-gray-50 rounded-xl p-4 space-y-2">
                          {selectedReviewRecipe.ingredients.map((i, idx) => (
                            <li key={idx} className="text-gray-700">• {i}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {selectedReviewRecipe.instructions?.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Instructions</h3>
                        <ol className="space-y-2">
                          {selectedReviewRecipe.instructions.map((step, idx) => (
                            <li key={idx} className="flex gap-3 items-start">
                              <div className="rounded-full bg-yellow-400 text-white w-7 h-7 flex items-center justify-center font-bold">
                                {idx + 1}
                              </div>
                              <p className="text-gray-700">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-center gap-4 mt-8">
                      <button
                        onClick={() => requestReinstate(selectedReviewRecipe)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-full"
                      >
                        Reinstate
                      </button>
                      <button
                        onClick={() => requestDelete(selectedReviewRecipe)}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* CULTURAL TAB */}
        {activeTab === "cultural" && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Globe className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Cultural Recipe Management</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Cultural recipes are now managed directly on the Cultural Explorer page.
              Visit the page to add, edit, or delete Filipino cultural recipes.
            </p>
            <a
              href="/explorer"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Go to Cultural Explorer
            </a>
          </div>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirm.open && confirm.recipe && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]"
          onClick={handleCancelConfirm}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {confirm.action === "reinstate" ? "Reinstate Recipe" : "Delete Recipe"}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirm.action === "reinstate"
                ? `Are you sure you want to reinstate "${confirm.recipe.title}"? This will set the state to "active".`
                : `Are you sure you want to delete "${confirm.recipe.title}"? This will permanently remove it from the database.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-white ${
                  confirm.action === "reinstate"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirm.action === "reinstate" ? "Reinstate" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
