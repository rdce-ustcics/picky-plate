// client/src/pages/Admin.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Globe, Clock, TrendingUp, Users, X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import LoadingModal from "../components/LoadingModal";
import "./Admin.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Admin() {
  const { authHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState("review");
  const [reviewRecipes, setReviewRecipes] = useState([]);
  const [selectedReviewRecipe, setSelectedReviewRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Confirmation modal state
  const [confirm, setConfirm] = useState({
    open: false,
    action: null,
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
      await fetchReviewRecipes();
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

      <div className="admin-page">
        {/* HEADER */}
        <div className="admin-header">
          {/* Decorative circles */}
          <div className="admin-header-decoration admin-header-decoration-1"></div>
          <div className="admin-header-decoration admin-header-decoration-2"></div>
          <div className="admin-header-decoration admin-header-decoration-3"></div>
          <div className="admin-header-decoration admin-header-decoration-4"></div>

          <div className="admin-header-content">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage for-review recipes and cultural content</p>
          </div>
        </div>

        {/* TABS */}
        <div className="admin-tabs">
          <div className="admin-tabs-inner">
            <button
              onClick={() => setActiveTab("review")}
              className={`admin-tab ${activeTab === "review" ? "active" : ""}`}
            >
              Recipes
              {reviewRecipes.length > 0 && (
                <span className="admin-tab-badge">{reviewRecipes.length}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("cultural")}
              className={`admin-tab ${activeTab === "cultural" ? "active" : ""}`}
            >
              <Globe className="w-5 h-5" />
              Cultural
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="admin-content">
          {error && (
            <div className="admin-error">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* REVIEW TAB */}
          {activeTab === "review" && (
            <>
              <div className="admin-section-header">
                <h2 className="admin-section-title">Recipes for Review</h2>
                <button onClick={fetchReviewRecipes} className="admin-refresh-btn">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="admin-loading">
                  <div className="admin-loading-spinner"></div>
                  <p className="admin-loading-text">Loading recipes...</p>
                </div>
              ) : reviewRecipes.length === 0 ? (
                <div className="admin-empty">
                  <CheckCircle className="admin-empty-icon" />
                  <p className="admin-empty-title">No recipes awaiting review</p>
                  <p className="admin-empty-text">All clear! 🎉</p>
                </div>
              ) : (
                <div className="admin-recipes-grid">
                  {reviewRecipes.map((r) => (
                    <div
                      key={r._id}
                      className="admin-recipe-card"
                      onClick={() => setSelectedReviewRecipe(r)}
                    >
                      <div className="admin-recipe-card-image">
                        <img
                          src={r.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"}
                          alt={r.title}
                        />
                        <div className="admin-recipe-card-overlay"></div>
                        <span className="admin-recipe-card-badge review">For Review</span>
                      </div>
                      <div className="admin-recipe-card-content">
                        <h3 className="admin-recipe-card-title">{r.title}</h3>
                        <p className="admin-recipe-card-author">By {r.author || "anonymous"}</p>
                        <div className="admin-recipe-card-meta">
                          <span className="admin-recipe-card-meta-item">
                            <Clock /> {r.prepTime || "—"}
                          </span>
                          <span className="admin-recipe-card-meta-item">
                            <TrendingUp /> {r.difficulty || "Easy"}
                          </span>
                          <span className="admin-recipe-card-meta-item">
                            <Users /> {r.servings || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* REVIEW MODAL */}
              {selectedReviewRecipe && (
                <div
                  className="admin-modal-overlay"
                  onClick={() => setSelectedReviewRecipe(null)}
                >
                  <div
                    ref={modalRef}
                    className="admin-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="admin-modal-image">
                      <img
                        src={selectedReviewRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"}
                        alt={selectedReviewRecipe.title}
                      />
                      <button
                        onClick={() => setSelectedReviewRecipe(null)}
                        className="admin-modal-close"
                      >
                        <X />
                      </button>
                    </div>

                    <div className="admin-modal-content">
                      <h2 className="admin-modal-title">{selectedReviewRecipe.title}</h2>
                      <p className="admin-modal-author">By {selectedReviewRecipe.author || "anonymous"}</p>

                      {selectedReviewRecipe.description && (
                        <p className="admin-modal-description">{selectedReviewRecipe.description}</p>
                      )}

                      {/* Quick info */}
                      <div className="admin-modal-info-grid">
                        <div className="admin-modal-info-item">
                          <Clock />
                          <p className="admin-modal-info-label">Prep Time</p>
                          <p className="admin-modal-info-value">{selectedReviewRecipe.prepTime || "—"}</p>
                        </div>
                        <div className="admin-modal-info-item">
                          <Clock />
                          <p className="admin-modal-info-label">Cook Time</p>
                          <p className="admin-modal-info-value">{selectedReviewRecipe.cookTime || "—"}</p>
                        </div>
                        <div className="admin-modal-info-item">
                          <TrendingUp />
                          <p className="admin-modal-info-label">Difficulty</p>
                          <p className="admin-modal-info-value">{selectedReviewRecipe.difficulty || "Easy"}</p>
                        </div>
                        <div className="admin-modal-info-item">
                          <Users />
                          <p className="admin-modal-info-label">Servings</p>
                          <p className="admin-modal-info-value">{selectedReviewRecipe.servings || "—"}</p>
                        </div>
                      </div>

                      {/* Ingredients */}
                      {selectedReviewRecipe.ingredients?.length > 0 && (
                        <div className="admin-modal-section">
                          <h3 className="admin-modal-section-title">Ingredients</h3>
                          <div className="admin-modal-ingredients">
                            {selectedReviewRecipe.ingredients.map((i, idx) => (
                              <div key={idx} className="admin-modal-ingredient">{i}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {selectedReviewRecipe.instructions?.length > 0 && (
                        <div className="admin-modal-section">
                          <h3 className="admin-modal-section-title">Instructions</h3>
                          <div className="admin-modal-instructions">
                            {selectedReviewRecipe.instructions.map((step, idx) => (
                              <div key={idx} className="admin-modal-instruction">
                                <div className="admin-modal-instruction-num">{idx + 1}</div>
                                <p className="admin-modal-instruction-text">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="admin-modal-actions">
                        <button
                          onClick={() => requestReinstate(selectedReviewRecipe)}
                          className="admin-action-btn reinstate"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Reinstate
                        </button>
                        <button
                          onClick={() => requestDelete(selectedReviewRecipe)}
                          className="admin-action-btn delete"
                        >
                          <X className="w-5 h-5" />
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
            <div className="admin-cultural-card">
              <Globe className="admin-cultural-icon" />
              <h2 className="admin-cultural-title">Cultural Recipe Management</h2>
              <p className="admin-cultural-text">
                Cultural recipes are now managed directly on the Cultural Explorer page.
                Visit the page to add, edit, or delete Filipino cultural recipes.
              </p>
              <a href="/explorer" className="admin-cultural-btn">
                <Globe className="w-5 h-5" />
                Go to Cultural Explorer
              </a>
            </div>
          )}
        </div>

        {/* CONFIRM MODAL */}
        {confirm.open && confirm.recipe && (
          <div className="admin-confirm-overlay" onClick={handleCancelConfirm}>
            <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="admin-confirm-title">
                {confirm.action === "reinstate" ? "Reinstate Recipe" : "Delete Recipe"}
              </h3>
              <p className="admin-confirm-text">
                {confirm.action === "reinstate"
                  ? `Are you sure you want to reinstate "${confirm.recipe.title}"? This will set the state to "active".`
                  : `Are you sure you want to delete "${confirm.recipe.title}"? This will permanently remove it from the database.`}
              </p>
              <div className="admin-confirm-actions">
                <button onClick={handleCancelConfirm} className="admin-confirm-btn cancel">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`admin-confirm-btn confirm ${confirm.action}`}
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