// client/src/pages/CommunityRecipes.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Clock, TrendingUp, X, ChefHat, Users, ChevronDown, PlusCircle
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";


// ===== PDF MODE CSS (injected once) =====
const pdfModeStyles = `
  .pdf-mode * { animation: none !important; transition: none !important; box-shadow: none !important; }
  .pdf-mode .no-pdf { display: none !important; }
  .pdf-mode .svg-only { display: none !important; }
  .circle-badge { display: inline-flex; align-items: center; justify-content: center; line-height: 1 !important; border-radius: 9999px; }
  .chip { display: inline-flex; align-items: center; justify-content: center; line-height: 1.2; }
`;

const API_BASE = "http://localhost:4000";

const TAG_OPTIONS = [
  "filipino","american","italian","japanese","korean","chinese","thai","indian",
  "burger","pizza","pasta","ramen","sushi","bbq","seafood","vegan","vegetarian",
  "dessert","breakfast","lunch","dinner","snack","spicy","noodles","rice"
];

const ALLERGENS = [
  "peanut","tree nut","egg","milk","dairy","fish","shellfish","soy","wheat","gluten","sesame"
];

const PREP_TIME_OPTIONS = [
  "5-10 min","10-15 min","15-20 min","20-30 min","30-45 min","45-60 min","1-2 hours","2+ hours"
];

const COOK_TIME_OPTIONS = [
  "10-20 min","20-30 min","30-40 min","40-50 min","50-60 min",
  "1-2 hours","2-3 hours","3+ hours"
];

const SERVING_SIZE_OPTIONS = ["1","1-2","3-4","5-6","7-8","9+"];

const REPORT_REASONS = [
  "Inappropriate content",
  "Spam / Advertising",
  "Copyright / Plagiarism",
  "Offensive language",
  "Health or safety risk",
  "Other",
];


export default function CommunityRecipes() {
  const { isAuthenticated, authHeaders } = useAuth();

  // Identify active user (used for "My Recipes")
  const activeUserId = (() => {
    try { return localStorage.getItem("pap:activeUserId") || "global"; }
    catch { return "global"; }
  })();

  const tagMenuRef = useRef(null);
  const allergenMenuRef = useRef(null);
  const modalRef = useRef(null);

  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // list state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // filters
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const [excludeAllergens, setExcludeAllergens] = useState([]);
  const [excludeTerms, setExcludeTerms] = useState([]);
  const [excludeInput, setExcludeInput] = useState("");

  const [prepFilter, setPrepFilter] = useState("");
  const [cookFilter, setCookFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [servingsFilter, setServingsFilter] = useState("");

  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showAllergenMenu, setShowAllergenMenu] = useState(false);

  // NEW: “My Recipes” toggle
  const [showMine, setShowMine] = useState(false);

    // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportComment, setReportComment] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const navigate = useNavigate();


  // Inject pdf mode CSS once
  useEffect(() => {
    const id = "pdf-mode-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = pdfModeStyles;
      document.head.appendChild(style);
    }
  }, []);

  // close menus on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (showTagMenu && tagMenuRef.current && !tagMenuRef.current.contains(e.target)) {
        setShowTagMenu(false);
      }
      if (showAllergenMenu && allergenMenuRef.current && !allergenMenuRef.current.contains(e.target)) {
        setShowAllergenMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showTagMenu, showAllergenMenu]);

  // build query string
  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (selectedTags.length) q.set("tags", selectedTags.join(","));

    const excludeMerged = [...excludeAllergens, ...excludeTerms];
    if (excludeMerged.length) q.set("exclude", excludeMerged.join(","));

    if (prepFilter) q.set("prep", prepFilter);
    if (cookFilter) q.set("cook", cookFilter);
    if (difficultyFilter) q.set("diff", difficultyFilter);
    if (servingsFilter) q.set("servings", servingsFilter);

    // NEW: limit to authorId when toggled
    if (showMine && activeUserId) q.set("authorId", activeUserId);

    q.set("page", String(page));
    q.set("limit", "20");
    return q.toString();
  }, [
    search, selectedTags,
    excludeAllergens, excludeTerms,
    prepFilter, cookFilter, difficultyFilter, servingsFilter,
    showMine, activeUserId,
    page
  ]);

  // fetch recipes
  useEffect(() => {
    (async () => {
      try {
        const headers = isAuthenticated ? authHeaders() : {};
        // Send x-user-id to match your server pattern (useful for /mine and auth)
        headers["x-user-id"] = activeUserId;

        const res = await fetch(`${API_BASE}/api/recipes?${query}`, { headers });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items || []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        } else {
          console.error("recipes_list_error:", data);
          setItems([]); setTotal(0); setPages(1);
        }
      } catch (e) {
        console.error("recipes_list_error:", e);
        setItems([]); setTotal(0); setPages(1);
      }
    })();
  }, [query, isAuthenticated, authHeaders, activeUserId]);

  // toggles
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };
  const removeTagChip = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setPage(1);
  };

  const toggleExcludeAllergen = (a) => {
    const t = a.toLowerCase();
    setExcludeAllergens((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    setPage(1);
  };
  const removeAllergenChip = (a) => {
    setExcludeAllergens((prev) => prev.filter((x) => x !== a));
    setPage(1);
  };

  const addExcludeTerm = () => {
    const clean = excludeInput.trim().toLowerCase();
    if (!clean) return;
    if (!excludeTerms.includes(clean)) {
      setExcludeTerms((p) => [...p, clean]);
      setPage(1);
    }
    setExcludeInput("");
  };
  const removeExcludeTermChip = (term) => {
    setExcludeTerms((p) => p.filter((t) => t !== term));
    setPage(1);
  };
  const onExcludeInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExcludeTerm();
    }
  };

  // reset all
  const resetFilters = () => {
    setSearch("");
    setSelectedTags([]);
    setExcludeAllergens([]);
    setExcludeTerms([]);
    setExcludeInput("");
    setPrepFilter("");
    setCookFilter("");
    setDifficultyFilter("");
    setServingsFilter("");
    setShowMine(false); // also reset "Mine"
    setPage(1);
  };

  // ===== PDF helpers =====
  async function captureToPdfBlob() {
    if (!modalRef.current || !selectedRecipe) return null;
    const node = modalRef.current;

    node.classList.add("pdf-mode");
    const prevBg = node.style.background;
    node.style.background = "#ffffff";

    const scale = window.devicePixelRatio ? Math.min(3, window.devicePixelRatio) : 2;

    try {
      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 0.95);
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        let yShift = 0;
        let remaining = imgHeight;
        while (remaining > 0) {
          pdf.addImage(imgData, "PNG", 0, yShift, imgWidth, imgHeight);
          remaining -= pageHeight;
          if (remaining > 0) {
            pdf.addPage();
            yShift -= pageHeight;
          }
        }
      }

      return pdf;
    } catch (err) {
      console.error("PDF generation failed:", err);
      return null;
    } finally {
      node.classList.remove("pdf-mode");
      node.style.background = prevBg;
    }
  }

  const downloadRecipePdf = async () => {
    const pdf = await captureToPdfBlob();
    if (!pdf) return;
    pdf.save(`${selectedRecipe?.title?.trim() || "recipe"}.pdf`);
  };

  const previewRecipePdf = async () => {
    const pdf = await captureToPdfBlob();
    if (!pdf) return;
    try {
      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch {
      pdf.output("dataurlnewwindow");
    }
  };

  function openReport() {
  if (!selectedRecipe) return;
  // if logged out → to login
  if (!isAuthenticated) {
    navigate("/login");
    return;
  }
  if (selectedRecipe.reportedByMe) return; // already reported, no-op
  setReportReason("");
  setReportComment("");
  setShowReportModal(true);
}

function closeReport() {
  setShowReportModal(false);
  setReportReason("");
  setReportComment("");
}

async function submitReport() {
  if (!selectedRecipe || !isAuthenticated || !reportReason.trim()) return;
  setReportLoading(true);
  try {
    const headers = { "Content-Type": "application/json", ...(authHeaders ? authHeaders() : {}) };
    // keep x-user-id header in case your server uses it elsewhere
    headers["x-user-id"] = (localStorage.getItem("pap:activeUserId") || "global");

    const res = await fetch(`${API_BASE}/api/recipes/${selectedRecipe._id}/report`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason: reportReason.trim(), comment: reportComment.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data?.error === "already_reported") {
        // harden UI state
        setSelectedRecipe((r) => (r ? { ...r, reportedByMe: true } : r));
        setItems((prev) => prev.map((it) => it._id === selectedRecipe._id ? { ...it, reportedByMe: true } : it));
        closeReport();
        return;
      }
      console.error("report_failed:", data);
      alert("Failed to report. Please try again.");
      return;
    }

    // success → mark as reported in both modal recipe + grid items
    setSelectedRecipe((r) => (r ? { ...r, reportedByMe: true, reportsCount: (r.reportsCount || 0) + 1, state: data?.state || r.state } : r));
    setItems((prev) =>
      prev.map((it) =>
        it._id === selectedRecipe._id
          ? { ...it, reportedByMe: true, reportsCount: (it.reportsCount || 0) + 1, state: data?.state || it.state }
          : it
      )
    );

    closeReport();
  } catch (e) {
    console.error("report_error:", e);
    alert("Failed to report. Please try again.");
  } finally {
    setReportLoading(false);
  }
}


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              Community Recipes
            </h1>

            <div className="flex items-center gap-2">
              {/* NEW: Mine toggle */}
              <button
                onClick={() => { setShowMine((v) => !v); setPage(1); }}
                className={`px-4 py-2 rounded-full border text-sm transition ${
                  showMine
                    ? "bg-yellow-400 text-white border-yellow-400"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                }`}
                title="Show only recipes you uploaded"
              >
                {showMine ? "Showing: My Recipes" : "Show: My Recipes"}
              </button>

              <Link
                to="/recipes/upload"
                className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-full flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Upload Recipe
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Search title, description, ingredients…"
            />

            {/* TAG PICKER */}
            <div className="relative" ref={tagMenuRef}>
              <button
                onClick={() => setShowTagMenu((s) => !s)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50"
              >
                <span>Select tags</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showTagMenu && (
                <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg p-2 max-h-72 overflow-auto">
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-sm border transition
                            ${active ? "bg-yellow-500 text-white border-yellow-500"
                                     : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ALLERGEN PICKER */}
            <div className="relative" ref={allergenMenuRef}>
              <button
                onClick={() => setShowAllergenMenu((s) => !s)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50"
              >
                <span>Exclude allergens</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {showAllergenMenu && (
                <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg p-2 max-h-72 overflow-auto">
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map((a) => {
                      const active = excludeAllergens.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleExcludeAllergen(a)}
                          className={`px-3 py-1 rounded-full text-sm border transition
                            ${active ? "bg-red-500 text-white border-red-500"
                                     : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* EXTRA EXCLUDE TERMS → chips */}
            <div className="flex gap-2">
              <input
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={onExcludeInputKeyDown}
                className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Add exclude term…"
              />
              <button
                type="button"
                onClick={addExcludeTerm}
                className="px-3 py-2.5 border rounded-xl text-sm hover:bg-gray-50 flex items-center gap-1"
                title="Add exclude term"
              >
                <PlusCircle className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Secondary filter row: prep, cook, difficulty, servings + reset */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select
              value={prepFilter}
              onChange={(e) => { setPrepFilter(e.target.value); setPage(1); }}
              className="border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Prep time (any)</option>
              {PREP_TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={cookFilter}
              onChange={(e) => { setCookFilter(e.target.value); setPage(1); }}
              className="border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Cook time (any)</option>
              {COOK_TIME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              className="border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Difficulty (any)</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select
              value={servingsFilter}
              onChange={(e) => { setServingsFilter(e.target.value); setPage(1); }}
              className="border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Servings (any)</option>
              {SERVING_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <button onClick={resetFilters} className="border rounded-xl px-4 py-2.5 text-sm hover:bg-gray-50">
              Clear all filters
            </button>
          </div>

          {/* Selected chips row */}
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span key={`tag-${tag}`} className="chip inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                #{tag}
                <button className="ml-1" onClick={() => removeTagChip(tag)} aria-label={`Remove tag ${tag}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {excludeAllergens.map((a) => (
              <span key={`alg-${a}`} className="chip inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
                exclude: {a}
                <button className="ml-1" onClick={() => removeAllergenChip(a)} aria-label={`Remove allergen ${a}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {excludeTerms.map((t) => (
              <span key={`ext-${t}`} className="chip inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                exclude: {t}
                <button className="ml-1" onClick={() => removeExcludeTermChip(t)} aria-label={`Remove exclude term ${t}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-3 text-sm text-gray-500">
            {total} recipe{total === 1 ? "" : "s"} • Page {page} of {pages}
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            No recipes found. Try different filters, or{" "}
            <Link to="/recipes/upload" className="text-yellow-600 font-semibold">
              add one
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {items.map((recipe) => (
              <div
                key={recipe._id}
                className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative overflow-hidden">
                  <img
                    crossOrigin="anonymous"
                    src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                    alt={recipe.title}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-yellow-500 transition">
                    {recipe.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">
                    By{" "}
                    <span className="text-gray-700 font-medium">
                      {recipe.author || "anonymous"}
                    </span>
                  </p>

                  {/* tags */}
                  {recipe.tags?.length ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {recipe.tags.slice(0, 6).map((t, i) => (
                        <span
                          key={i}
                          className="chip text-[11px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Prep: {recipe.prepTime || "—"}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{recipe.difficulty || "Easy"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-gray-600">
              Page {page} / {pages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-48 sm:h-64">
              <img
                crossOrigin="anonymous"
                src={selectedRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 hover:bg-white rounded-full p-2 transition"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 text-center w-[90%]">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {selectedRecipe.title}
                </h2>
                <p className="text-sm sm:text-base text-white/90">
                  By {selectedRecipe.author || "anonymous"}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 md:p-8">
              {/* Description */}
              {selectedRecipe.description && (
                <div className="mb-4 sm:mb-6">
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed text-center">
                    {selectedRecipe.description}
                  </p>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <div className="text-center">
                  <Clock className="svg-only w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Prep Time</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.prepTime || "—"}</p>
                </div>

                <div className="text-center">
                  <Clock className="svg-only w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Cook Time</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.cookTime || "—"}</p>
                </div>

                <div className="text-center">
                  <TrendingUp className="svg-only w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.difficulty || "Easy"}</p>
                </div>

                <div className="text-center">
                  <Users className="svg-only w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                  <p className="text-xs text-gray-600 mb-1">Servings</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedRecipe.servings || "—"}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedRecipe.tags?.length ? (
                <div className="mb-6 flex flex-wrap gap-2 justify-center">
                  {selectedRecipe.tags.map((t, i) => (
                    <span
                      key={i}
                      className="chip text-[11px] px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Ingredients */}
              {selectedRecipe.ingredients?.length ? (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center gap-2">
                    <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                    Ingredients
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span className="text-sm sm:text-base text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* Instructions */}
              {selectedRecipe.instructions?.length ? (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                    Step-by-Step Instructions
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3 sm:gap-4 items-start">
                        <div className="circle-badge rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 text-white font-bold text-sm sm:text-base leading-none">
                          {index + 1}
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          {instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              {selectedRecipe.notes ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-r-xl mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                    💡 Chef's Notes
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {selectedRecipe.notes}
                  </p>
                </div>
              ) : null}

              {/* PDF Actions (hidden while capturing) */}
              <div className="no-pdf flex flex-wrap justify-center gap-3 mt-6 mb-4">
                <button
                  onClick={previewRecipePdf}
                  className="bg-white border border-yellow-500 text-yellow-700 hover:bg-yellow-50 font-semibold px-6 py-2 rounded-full shadow-sm transition"
                >
                  Preview PDF
                </button>
                <button
                  onClick={downloadRecipePdf}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-full shadow transition"
                >
                  Download PDF
                </button>

                {/* Report button */}
                <button
                  onClick={openReport}
                  disabled={!!selectedRecipe?.reportedByMe}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full shadow-sm transition border
                    ${selectedRecipe?.reportedByMe
                      ? "bg-gray-200 border-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  title={selectedRecipe?.reportedByMe ? "You have already reported this recipe" : "Report this recipe"}
                >
                  <Flag className="w-4 h-4" />
                  {selectedRecipe?.reportedByMe ? "Reported" : "Report recipe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
  <div
    className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
    onClick={closeReport}
  >
    <div
      className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center">
          <Flag className="w-4 h-4 text-yellow-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Report recipe</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Help us keep the community healthy. Choose a reason and (optionally) add more details.
      </p>

      <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
      <select
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white mb-3 outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <option value="">Select a reason…</option>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700 mb-1">Additional comment (optional)</label>
      <textarea
        value={reportComment}
        onChange={(e) => setReportComment(e.target.value)}
        rows={4}
        className="w-full border rounded-xl px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Add more context (optional)…"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={closeReport}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={submitReport}
          disabled={!reportReason || reportLoading}
          className={`px-4 py-2 text-sm rounded-xl text-white ${
            (!reportReason || reportLoading)
              ? "bg-yellow-300 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          {reportLoading ? "Submitting…" : "Submit report"}
        </button>
      </div>

      <p className="text-[11px] text-gray-500 mt-3">
        You can report a recipe only once. Reaching 20 total reports (lifetime) or 5 reports in a week flags it for review.
      </p>
    </div>
  </div>
)}

    </div>
  );
}
