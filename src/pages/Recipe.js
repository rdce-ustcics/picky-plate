// client/src/pages/CommunityRecipes.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Clock, TrendingUp, X, ChefHat, Users, ChevronDown, PlusCircle,
  Filter, Search, FileText, Download, Flag, Edit, Trash2, AlertCircle, Loader
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import LoadingModal from "../components/LoadingModal";
import { useNavigate } from "react-router-dom";
import "./CommunityRecipes.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Default placeholder for fast initial render
const PLACEHOLDER_IMAGE = "/images/default-dish.png";
// Batch size for progressive image loading (load N images at a time)
const IMAGE_BATCH_SIZE = 4;

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
  const { isAuthenticated, authHeaders, user } = useAuth();

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
  const [loading, setLoading] = useState(false);

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

  // NEW: "My Recipes" toggle
  const [showMine, setShowMine] = useState(false);

  // NEW: Advanced filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportComment, setReportComment] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    prepTime: "",
    cookTime: "",
    difficulty: "Easy",
    servings: "",
    notes: "",
    ingredients: [""],
    instructions: [""],
    tags: [],
    allergens: [],
    image: ""
  });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const navigate = useNavigate();

  // Check if any filters are active (for badge count)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTags.length) count += selectedTags.length;
    if (excludeAllergens.length) count += excludeAllergens.length;
    if (excludeTerms.length) count += excludeTerms.length;
    if (prepFilter) count += 1;
    if (cookFilter) count += 1;
    if (difficultyFilter) count += 1;
    if (servingsFilter) count += 1;
    return count;
  }, [selectedTags, excludeAllergens, excludeTerms, prepFilter, cookFilter, difficultyFilter, servingsFilter]);

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

  // Progressive image loading - load images one by one in batches
  const loadImagesProgressively = useCallback(async (recipes) => {
    // Process images in small batches for faster perceived loading
    for (let i = 0; i < recipes.length; i += IMAGE_BATCH_SIZE) {
      const batch = recipes.slice(i, i + IMAGE_BATCH_SIZE);

      // Activate this batch - set imageActivated to true so images start loading
      setItems(prevItems =>
        prevItems.map(item => {
          const inBatch = batch.some(r => r._id === item._id);
          return inBatch ? { ...item, imageActivated: true } : item;
        })
      );

      // Wait for this batch to load before starting the next
      // This creates a visual "one by one" effect
      await Promise.all(
        batch.map(recipe =>
          new Promise((resolve) => {
            // If no image, resolve immediately
            if (!recipe.image) {
              setItems(prev =>
                prev.map(item =>
                  item._id === recipe._id
                    ? { ...item, imageLoading: false }
                    : item
                )
              );
              resolve();
              return;
            }

            // Preload the image
            const img = new Image();
            img.onload = () => {
              setItems(prev =>
                prev.map(item =>
                  item._id === recipe._id
                    ? { ...item, imageLoading: false }
                    : item
                )
              );
              resolve();
            };
            img.onerror = () => {
              setItems(prev =>
                prev.map(item =>
                  item._id === recipe._id
                    ? { ...item, imageLoading: false }
                    : item
                )
              );
              resolve();
            };
            // Start loading
            img.src = recipe.image;
          })
        )
      );

      // Small delay between batches for smoother visual effect
      if (i + IMAGE_BATCH_SIZE < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, []);

  // fetch recipes with progressive image loading
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const headers = isAuthenticated ? authHeaders() : {};
        // Send x-user-id to match your server pattern (useful for /mine and auth)
        headers["x-user-id"] = activeUserId;

        const res = await fetch(`${API_BASE}/api/recipes?${query}`, { headers });
        const data = await res.json();
        if (res.ok) {
          // Step 1: Set recipes with placeholder images for instant display
          const recipesWithPlaceholders = (data.items || []).map(recipe => ({
            ...recipe,
            imageActivated: false, // Image not yet activated for loading
            imageLoading: true,    // Will show loading state when activated
            actualImage: recipe.image // Store actual image URL
          }));
          setItems(recipesWithPlaceholders);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
          setLoading(false);

          // Step 2: Load images progressively one batch at a time
          loadImagesProgressively(recipesWithPlaceholders);
        } else {
          console.error("recipes_list_error:", data);
          setItems([]); setTotal(0); setPages(1);
          setLoading(false);
        }
      } catch (e) {
        console.error("recipes_list_error:", e);
        setItems([]); setTotal(0); setPages(1);
        setLoading(false);
      }
    })();
  }, [query, isAuthenticated, authHeaders, activeUserId, loadImagesProgressively]);

  // Handle image load completion for progressive loading
  const handleImageLoad = useCallback((recipeId) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item._id === recipeId
          ? { ...item, imageLoading: false }
          : item
      )
    );
  }, []);

  // Handle image error - mark as loaded to remove loading state
  const handleImageError = useCallback((recipeId) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item._id === recipeId
          ? { ...item, imageLoading: false }
          : item
      )
    );
  }, []);

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
    setShowMine(false);
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
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (selectedRecipe.reportedByMe) return;
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
      headers["x-user-id"] = (localStorage.getItem("pap:activeUserId") || "global");

      const res = await fetch(`${API_BASE}/api/recipes/${selectedRecipe._id}/report`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: reportReason.trim(), comment: reportComment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "already_reported") {
          setSelectedRecipe((r) => (r ? { ...r, reportedByMe: true } : r));
          setItems((prev) => prev.map((it) => it._id === selectedRecipe._id ? { ...it, reportedByMe: true } : it));
          closeReport();
          return;
        }
        console.error("report_failed:", data);
        alert("Failed to report. Please try again.");
        return;
      }

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

  // Check if current user is the creator of the recipe
  const isRecipeOwner = (recipe) => {
    if (!user || !recipe) return false;
    const userId = String(user._id || user.id || "");
    const recipeCreatorId = String(recipe.createdBy || "");
    return userId === recipeCreatorId;
  };

  // Open edit modal with recipe data
  function handleEditRecipe(recipe) {
    if (!isRecipeOwner(recipe)) {
      alert("You can only edit your own recipes");
      return;
    }

    setEditingRecipe(recipe);
    setEditForm({
      title: recipe.title || "",
      description: recipe.description || "",
      prepTime: recipe.prepTime || "",
      cookTime: recipe.cookTime || "",
      difficulty: recipe.difficulty || "Easy",
      servings: recipe.servings || "",
      notes: recipe.notes || "",
      ingredients: recipe.ingredients?.length > 0 ? recipe.ingredients : [""],
      instructions: recipe.instructions?.length > 0 ? recipe.instructions : [""],
      tags: recipe.tags || [],
      allergens: recipe.allergens || [],
      image: recipe.image || ""
    });
    setEditImagePreview(recipe.image || null);
    setEditErrors({});
    setShowEditModal(true);
    setSelectedRecipe(null); // Close detail modal
  }

  // Close edit modal
  function closeEditModal() {
    setShowEditModal(false);
    setEditingRecipe(null);
    setEditForm({
      title: "",
      description: "",
      prepTime: "",
      cookTime: "",
      difficulty: "Easy",
      servings: "",
      notes: "",
      ingredients: [""],
      instructions: [""],
      tags: [],
      allergens: [],
      image: ""
    });
    setEditImagePreview(null);
    setEditErrors({});
  }

  // Validate image is landscape
  const validateImageOrientation = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          if (width > height) {
            resolve(true); // Landscape
          } else {
            reject(new Error("Image must be landscape (width > height)"));
          }
        };
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload for edit
  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setEditErrors(prev => ({ ...prev, image: "Please upload an image file" }));
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setEditErrors(prev => ({ ...prev, image: "Image must be less than 5MB" }));
      return;
    }

    try {
      await validateImageOrientation(file);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditForm(prev => ({ ...prev, image: reader.result }));
        setEditErrors(prev => ({ ...prev, image: null }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setEditErrors(prev => ({ ...prev, image: error.message }));
      e.target.value = ""; // Clear file input
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors = {};

    if (!editForm.title.trim()) {
      errors.title = "Title is required";
    }

    if (!editForm.description.trim()) {
      errors.description = "Description is required";
    }

    const validIngredients = editForm.ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      errors.ingredients = "At least one ingredient is required";
    }

    const validInstructions = editForm.instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      errors.instructions = "At least one instruction is required";
    }

    return errors;
  };

  // Submit edit form
  async function submitEditForm() {
    const errors = validateEditForm();

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditLoading(true);

    try {
      const cleanedData = {
        ...editForm,
        ingredients: editForm.ingredients.filter(ing => ing.trim()),
        instructions: editForm.instructions.filter(inst => inst.trim())
      };

      const res = await fetch(`${API_BASE}/api/recipes/${editingRecipe._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(cleanedData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to update recipe");
        return;
      }

      // Update recipe in list
      setItems(prev => prev.map(item =>
        item._id === editingRecipe._id ? { ...item, ...data.recipe } : item
      ));

      alert("Recipe updated successfully!");
      closeEditModal();
    } catch (e) {
      console.error("update_recipe_error:", e);
      alert("Failed to update recipe. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  // Edit form handlers
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addEditIngredient = () => {
    setEditForm(prev => ({ ...prev, ingredients: [...prev.ingredients, ""] }));
  };

  const removeEditIngredient = (index) => {
    setEditForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleEditIngredientChange = (index, value) => {
    const newIngredients = [...editForm.ingredients];
    newIngredients[index] = value;
    setEditForm(prev => ({ ...prev, ingredients: newIngredients }));
    if (editErrors.ingredients) {
      setEditErrors(prev => ({ ...prev, ingredients: null }));
    }
  };

  const addEditInstruction = () => {
    setEditForm(prev => ({ ...prev, instructions: [...prev.instructions, ""] }));
  };

  const removeEditInstruction = (index) => {
    setEditForm(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleEditInstructionChange = (index, value) => {
    const newInstructions = [...editForm.instructions];
    newInstructions[index] = value;
    setEditForm(prev => ({ ...prev, instructions: newInstructions }));
    if (editErrors.instructions) {
      setEditErrors(prev => ({ ...prev, instructions: null }));
    }
  };

  const toggleEditTag = (tag) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleEditAllergen = (allergen) => {
    setEditForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  // Delete recipe
  async function handleDeleteRecipe(recipe) {
    if (!isRecipeOwner(recipe)) {
      alert("You can only delete your own recipes");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/recipes/${recipe._id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete recipe");
        return;
      }

      // Remove from list and close modal
      setItems((prev) => prev.filter((it) => it._id !== recipe._id));
      setSelectedRecipe(null);
      alert("Recipe deleted successfully");
    } catch (e) {
      console.error("delete_recipe_error:", e);
      alert("Failed to delete recipe. Please try again.");
    }
  }

  return (
    <>
      {loading && <LoadingModal message="Loading community recipes..." />}

      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #FEF3C7 0%, #FDE68A 50%, #FEF3C7 100%)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 whitespace-nowrap">
                  Community Recipes
                </h1>
                <p className="text-amber-100 text-sm sm:text-base">
                  Discover and share delicious meals with the community
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => { setShowMine((v) => !v); setPage(1); }}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-md whitespace-nowrap ${
                    showMine
                      ? "bg-white text-amber-600 shadow-lg scale-105"
                      : "bg-amber-300 text-amber-800 hover:bg-amber-200"
                  }`}
                  title="Show only recipes you uploaded"
                >
                  {showMine ? "My Recipes" : "All Recipes"}
                </button>

                <Link
                  to="/recipes/upload"
                  className="bg-white hover:bg-amber-50 text-amber-600 font-bold px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload Recipe
                </Link>
              </div>
            </div>

            {/* FILTERS SECTION */}
            <div className="mt-8 space-y-4">
              {/* Main Search Bar */}
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full bg-white border-2 border-amber-200 rounded-3xl pl-14 pr-6 py-4 text-base outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-400 transition shadow-md placeholder-amber-400"
                  placeholder="Search for delicious recipes..."
                />
              </div>

              {/* Quick Filters Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Tag Picker */}
                <div className="relative" ref={tagMenuRef}>
                  <button
                    onClick={() => setShowTagMenu((s) => !s)}
                    className="bg-white border-2 border-amber-200 rounded-2xl px-5 py-3 text-sm font-semibold flex items-center gap-2 hover:bg-amber-50 hover:border-amber-300 transition shadow-md text-amber-800"
                  >
                    <span>
                      {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Filter by Tags"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-amber-600 transition ${showTagMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showTagMenu && (
                    <div className="absolute z-20 mt-2 w-80 bg-white border-2 border-amber-200 rounded-2xl shadow-2xl p-5 max-h-96 overflow-auto">
                      <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map((tag) => {
                          const active = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-4 py-2 rounded-full text-sm border-2 transition font-semibold
                                ${active 
                                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-400 shadow-md"
                                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                                }`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  className={`border-2 rounded-2xl px-5 py-3 text-sm flex items-center gap-2 transition font-semibold shadow-md
                    ${showAdvancedFilters || activeFiltersCount > 0
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300"
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Clear Filters */}
                {(search || activeFiltersCount > 0 || showMine) && (
                  <button
                    onClick={resetFilters}
                    className="bg-white border-2 border-amber-200 rounded-2xl px-5 py-3 text-sm hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition font-semibold shadow-md"
                  >
                    <X className="w-4 h-4 inline mr-1" /> Clear All
                  </button>
                )}
              </div>

              {/* Advanced Filters - Collapsible */}
              {showAdvancedFilters && (
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 space-y-5 shadow-lg">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Advanced Filters</h3>
                  
                  {/* Time & Difficulty Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <select
                      value={prepFilter}
                      onChange={(e) => { setPrepFilter(e.target.value); setPage(1); }}
                      className="border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-amber-50 hover:border-amber-300 transition font-medium text-amber-900"
                    >
                      <option value="">Prep Time (Any)</option>
                      {PREP_TIME_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    
                    <select
                      value={cookFilter}
                      onChange={(e) => { setCookFilter(e.target.value); setPage(1); }}
                      className="border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-amber-50 hover:border-amber-300 transition font-medium text-amber-900"
                    >
                      <option value="">Cook Time (Any)</option>
                      {COOK_TIME_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    
                    <select
                      value={difficultyFilter}
                      onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                      className="border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-amber-50 hover:border-amber-300 transition font-medium text-amber-900"
                    >
                      <option value="">Difficulty (Any)</option>
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                    
                    <select
                      value={servingsFilter}
                      onChange={(e) => { setServingsFilter(e.target.value); setPage(1); }}
                      className="border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-amber-50 hover:border-amber-300 transition font-medium text-amber-900"
                    >
                      <option value="">Servings (Any)</option>
                      {SERVING_SIZE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Allergen Exclusions */}
                  <div>
                    <div className="relative" ref={allergenMenuRef}>
                      <button
                        onClick={() => setShowAllergenMenu((s) => !s)}
                        className="w-full sm:w-auto bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-3 text-sm flex items-center gap-2 hover:bg-white hover:border-amber-300 transition font-semibold text-amber-900"
                      >
                        <span>
                          {excludeAllergens.length > 0 
                            ? `Excluding ${excludeAllergens.length} allergen${excludeAllergens.length > 1 ? 's' : ''}`
                            : "Exclude Allergens"
                          }
                        </span>
                        <ChevronDown className={`w-4 h-4 text-amber-600 transition ${showAllergenMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showAllergenMenu && (
                        <div className="absolute z-20 mt-2 w-full sm:w-96 bg-white border-2 border-amber-200 rounded-2xl shadow-2xl p-5 max-h-72 overflow-auto">
                          <div className="flex flex-wrap gap-2">
                            {ALLERGENS.map((a) => {
                              const active = excludeAllergens.includes(a);
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => toggleExcludeAllergen(a)}
                                  className={`px-4 py-2 rounded-full text-sm border-2 transition font-semibold
                                    ${active 
                                      ? "bg-red-500 text-white border-red-500 shadow-md"
                                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                                    }`}
                                >
                                  {a}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Exclude Terms */}
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-2 uppercase tracking-wide">
                      Exclude Custom Terms
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={excludeInput}
                        onChange={(e) => setExcludeInput(e.target.value)}
                        onKeyDown={onExcludeInputKeyDown}
                        className="flex-1 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-400 transition placeholder-amber-400 font-medium"
                        placeholder="e.g., cilantro, mushroom..."
                      />
                      <button
                        type="button"
                        onClick={addExcludeTerm}
                        className="px-5 py-3 bg-white border-2 border-amber-200 rounded-2xl text-sm hover:bg-amber-50 hover:border-amber-300 transition font-semibold flex items-center gap-2 shadow-md text-amber-900"
                        title="Add exclude term"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Filter Chips */}
              {(selectedTags.length > 0 || excludeAllergens.length > 0 || excludeTerms.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedTags.map((tag) => (
                    <span key={`tag-${tag}`} className="chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md">
                      #{tag}
                      <button className="hover:bg-white/30 rounded-full p-1 transition" onClick={() => removeTagChip(tag)} aria-label={`Remove tag ${tag}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {excludeAllergens.map((a) => (
                    <span key={`alg-${a}`} className="chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                      No {a}
                      <button className="hover:bg-white/30 rounded-full p-1 transition" onClick={() => removeAllergenChip(a)} aria-label={`Remove allergen ${a}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {excludeTerms.map((t) => (
                    <span key={`ext-${t}`} className="chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-amber-200 text-amber-900 shadow-md">
                      No {t}
                      <button className="hover:bg-amber-300 rounded-full p-1 transition" onClick={() => removeExcludeTermChip(t)} aria-label={`Remove exclude term ${t}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-semibold text-amber-900">
                  {total === 0 ? "No recipes found" : (
                    <>
                      <span className="text-amber-700 font-bold text-base">{total}</span> delicious recipe{total === 1 ? "" : "s"} found
                    </>
                  )}
                </p>
                {pages > 1 && (
                  <p className="text-sm text-amber-700 font-medium">
                    Page {page} of {pages}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Grid - NOW FULL WIDTH WITH 4 COLUMNS */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-lg border-2 border-amber-200">
              <div className="mb-6">
                <ChefHat className="w-20 h-20 mx-auto text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-3">No recipes found</h3>
              <p className="text-amber-700 mb-6 text-lg">
                Try adjusting your filters or{" "}
                <Link to="/recipes/upload" className="text-amber-600 font-bold hover:underline">
                  be the first to add one!
                </Link>
              </p>
            </div>
          ) : (
            <>
              {/* Recipe Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {items.map((recipe) => (
                  <div
                    key={recipe._id}
                    className="recipe-card bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer group border-2 border-amber-100 hover:border-amber-300"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <div
                      className={`relative overflow-hidden ${!recipe.imageActivated || recipe.imageLoading ? 'image-skeleton' : ''}`}
                      style={{ minHeight: '224px', backgroundColor: '#fef3c7' }}
                    >
                      {/* Show placeholder until image is activated */}
                      {!recipe.imageActivated ? (
                        <div className="w-full h-56 flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-100">
                          <div className="text-center">
                            <ChefHat className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                            <span className="text-amber-400 text-sm font-medium">Waiting...</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          crossOrigin="anonymous"
                          src={recipe.actualImage || recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                          alt={recipe.title}
                          className="recipe-card-image w-full h-56 object-cover"
                          onLoad={() => handleImageLoad(recipe._id)}
                          onError={() => handleImageError(recipe._id)}
                          style={{
                            opacity: recipe.imageLoading ? 0.5 : 1,
                            transition: 'opacity 0.4s ease-in-out'
                          }}
                        />
                      )}
                      {/* Loading indicator overlay - show when activated but still loading */}
                      {recipe.imageActivated && recipe.imageLoading && (
                        <div
                          className="image-loading-indicator"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            pointerEvents: 'none',
                            zIndex: 10
                          }}>
                          Loading...
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-amber-900 mb-2 group-hover:text-amber-600 transition line-clamp-2">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-amber-700 mb-4">
                        By{" "}
                        <span className="text-amber-900 font-semibold">
                          {recipe.author || "anonymous"}
                        </span>
                      </p>

                      {/* tags */}
                      {recipe.tags?.length ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {recipe.tags.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="chip text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-4 text-sm text-amber-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>Prep: {recipe.prepTime || "—"}</span>
                        </div>
                        <span className="text-amber-400">•</span>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          <span>{recipe.difficulty || "Easy"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ENHANCED PAGINATION */}
              {pages > 1 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Page Info */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-semibold text-amber-900">
                        Showing <span className="text-amber-600 font-bold">{((page - 1) * 20) + 1}</span> - <span className="text-amber-600 font-bold">{Math.min(page * 20, total)}</span> of <span className="text-amber-600 font-bold">{total}</span> recipes
                      </p>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      {/* First Page */}
                      <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded-xl bg-white border-2 border-amber-200 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition shadow-sm text-amber-900 hidden sm:block"
                        title="First page"
                      >
                        ««
                      </button>

                      {/* Previous */}
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-5 py-2.5 rounded-xl bg-white border-2 border-amber-200 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition shadow-sm text-amber-900"
                      >
                        ← Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-2">
                        {/* Show page numbers with ellipsis for many pages */}
                        {pages <= 7 ? (
                          // Show all pages if 7 or fewer
                          Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`w-10 h-10 rounded-xl font-bold text-sm transition shadow-sm ${
                                page === p
                                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-2 border-amber-400"
                                  : "bg-white text-amber-900 border-2 border-amber-200 hover:bg-amber-50"
                              }`}
                            >
                              {p}
                            </button>
                          ))
                        ) : (
                          // Show first, last, current, and neighbors with ellipsis
                          <>
                            {page > 3 && (
                              <>
                                <button
                                  onClick={() => setPage(1)}
                                  className="w-10 h-10 rounded-xl font-bold text-sm transition shadow-sm bg-white text-amber-900 border-2 border-amber-200 hover:bg-amber-50"
                                >
                                  1
                                </button>
                                {page > 4 && <span className="text-amber-600 font-bold">…</span>}
                              </>
                            )}

                            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                              const start = Math.max(1, Math.min(page - 2, pages - 4));
                              return start + i;
                            }).map((p) => (
                              <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-xl font-bold text-sm transition shadow-sm ${
                                  page === p
                                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-2 border-amber-400"
                                    : "bg-white text-amber-900 border-2 border-amber-200 hover:bg-amber-50"
                                }`}
                              >
                                {p}
                              </button>
                            ))}

                            {page < pages - 2 && (
                              <>
                                {page < pages - 3 && <span className="text-amber-600 font-bold">…</span>}
                                <button
                                  onClick={() => setPage(pages)}
                                  className="w-10 h-10 rounded-xl font-bold text-sm transition shadow-sm bg-white text-amber-900 border-2 border-amber-200 hover:bg-amber-50"
                                >
                                  {pages}
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Next */}
                      <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page >= pages}
                        className="px-5 py-2.5 rounded-xl bg-white border-2 border-amber-200 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition shadow-sm text-amber-900"
                      >
                        Next →
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => setPage(pages)}
                        disabled={page >= pages}
                        className="px-4 py-2 rounded-xl bg-white border-2 border-amber-200 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition shadow-sm text-amber-900 hidden sm:block"
                        title="Last page"
                      >
                        »»
                      </button>
                    </div>

                    {/* Quick Jump (Optional) */}
                    <div className="hidden lg:flex items-center gap-2">
                      <label className="text-sm font-semibold text-amber-900">Jump to:</label>
                      <select
                        value={page}
                        onChange={(e) => setPage(Number(e.target.value))}
                        className="px-3 py-2 border-2 border-amber-200 rounded-xl bg-white text-sm font-semibold text-amber-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition"
                      >
                        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                          <option key={p} value={p}>
                            Page {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            ref={modalRef}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl my-4 border-4 border-amber-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-64">
              <img
                crossOrigin="anonymous"
                src={selectedRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-4 right-4 bg-white hover:bg-amber-50 rounded-full p-2.5 transition shadow-lg"
              >
                <X className="w-6 h-6 text-amber-900" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center w-[90%]">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {selectedRecipe.title}
                </h2>
                <p className="text-base text-white/95 font-medium">
                  By {selectedRecipe.author || "anonymous"}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              {/* Description */}
              {selectedRecipe.description && (
                <div className="mb-6 bg-white rounded-2xl p-5 shadow-md border-2 border-amber-200">
                  <p className="text-amber-900 text-base leading-relaxed text-center font-medium">
                    {selectedRecipe.description}
                  </p>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl shadow-lg">
                <div className="text-center">
                  <Clock className="svg-only w-6 h-6 mx-auto mb-2 text-white" />
                  <p className="text-xs text-white/90 mb-1 font-semibold">Prep Time</p>
                  <p className="text-sm font-bold text-white">{selectedRecipe.prepTime || "—"}</p>
                </div>

                <div className="text-center">
                  <Clock className="svg-only w-6 h-6 mx-auto mb-2 text-white" />
                  <p className="text-xs text-white/90 mb-1 font-semibold">Cook Time</p>
                  <p className="text-sm font-bold text-white">{selectedRecipe.cookTime || "—"}</p>
                </div>

                <div className="text-center">
                  <TrendingUp className="svg-only w-6 h-6 mx-auto mb-2 text-white" />
                  <p className="text-xs text-white/90 mb-1 font-semibold">Difficulty</p>
                  <p className="text-sm font-bold text-white">{selectedRecipe.difficulty || "Easy"}</p>
                </div>

                <div className="text-center">
                  <Users className="svg-only w-6 h-6 mx-auto mb-2 text-white" />
                  <p className="text-xs text-white/90 mb-1 font-semibold">Servings</p>
                  <p className="text-sm font-bold text-white">{selectedRecipe.servings || "—"}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedRecipe.tags?.length ? (
                <div className="mb-6 flex flex-wrap gap-2 justify-center">
                  {selectedRecipe.tags.map((t, i) => (
                    <span
                      key={i}
                      className="chip text-xs px-3 py-1.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 font-bold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Ingredients */}
              {selectedRecipe.ingredients?.length ? (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-amber-900 mb-4 flex items-center justify-center gap-2">
                    <ChefHat className="w-6 h-6 text-amber-600" />
                    Ingredients
                  </h3>
                  <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-amber-200">
                    <ul className="space-y-3">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-amber-500 font-bold text-lg mt-0.5">•</span>
                          <span className="text-base text-amber-900 font-medium">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* Instructions */}
              {selectedRecipe.instructions?.length ? (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-amber-900 mb-4 text-center flex items-center justify-center gap-2">
                    <FileText className="w-6 h-6 text-amber-600" />
                    Step-by-Step Instructions
                  </h3>
                  <div className="space-y-4">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-4 items-start bg-white rounded-2xl p-5 shadow-md border-2 border-amber-200">
                        <div className="circle-badge rounded-full w-9 h-9 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-base leading-none flex items-center justify-center shadow-md flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-base text-amber-900 leading-relaxed font-medium pt-1">
                          {instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              {selectedRecipe.notes ? (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-2xl mb-6 shadow-md">
                  <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-700" />
                    Chef's Notes
                  </h3>
                  <p className="text-base text-blue-800 leading-relaxed font-medium">
                    {selectedRecipe.notes}
                  </p>
                </div>
              ) : null}

              {/* PDF Actions */}
              <div className="no-pdf flex flex-wrap justify-center gap-3 mt-6 mb-4">
                <button
                  onClick={previewRecipePdf}
                  className="bg-white border-2 border-amber-400 text-amber-700 hover:bg-amber-50 font-bold px-6 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Preview PDF
                </button>
                <button
                  onClick={downloadRecipePdf}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>

                {/* Edit button - Only show for recipe owner */}
                {isRecipeOwner(selectedRecipe) && (
                  <button
                    onClick={() => handleEditRecipe(selectedRecipe)}
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2"
                    title="Edit your recipe"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Recipe
                  </button>
                )}

                {/* Delete button - Only show for recipe owner */}
                {isRecipeOwner(selectedRecipe) && (
                  <button
                    onClick={() => handleDeleteRecipe(selectedRecipe)}
                    className="bg-white hover:bg-red-50 text-red-700 border-2 border-red-300 hover:border-red-400 font-bold px-6 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
                    title="Delete your recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}

                {/* Report button - Only show if NOT the owner */}
                {!isRecipeOwner(selectedRecipe) && (
                  <button
                    onClick={openReport}
                    disabled={!!selectedRecipe?.reportedByMe}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl shadow-md transition border-2 font-bold
                      ${selectedRecipe?.reportedByMe
                        ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white hover:bg-red-50 text-amber-700 border-amber-200 hover:border-red-300 hover:text-red-700"
                      }`}
                    title={selectedRecipe?.reportedByMe ? "You have already reported this recipe" : "Report this recipe"}
                  >
                    <Flag className="w-4 h-4" />
                    {selectedRecipe?.reportedByMe ? "Reported" : "Report Recipe"}
                  </button>
                )}
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
            className="w-full max-w-md bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl shadow-2xl p-6 border-4 border-amber-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center shadow-md">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-900">Report Recipe</h3>
            </div>

            <p className="text-sm text-amber-800 mb-5 font-medium">
              Help us keep the community healthy. Choose a reason and (optionally) add more details.
            </p>

            <label className="block text-sm font-bold text-amber-900 mb-2">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white mb-4 outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
            >
              <option value="">Select a reason…</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <label className="block text-sm font-bold text-amber-900 mb-2">Additional comment (optional)</label>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              rows={4}
              className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm mb-5 outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
              placeholder="Add more context (optional)…"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeReport}
                className="px-5 py-2.5 text-sm rounded-2xl border-2 border-amber-200 hover:bg-white font-bold text-amber-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportLoading}
                className={`px-5 py-2.5 text-sm rounded-2xl text-white font-bold shadow-lg transition ${
                  (!reportReason || reportLoading)
                    ? "bg-amber-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600"
                }`}
              >
                {reportLoading ? "Submitting…" : "Submit Report"}
              </button>
            </div>

            <p className="text-xs text-amber-700 mt-4 font-medium">
              You can report a recipe only once. Reaching 20 total reports (lifetime) or 5 reports in a week flags it for review.
            </p>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {showEditModal && editingRecipe && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-4xl bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl shadow-2xl p-6 sm:p-8 border-4 border-amber-300 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900">Edit Recipe</h3>
              </div>
              <button
                onClick={closeEditModal}
                className="w-10 h-10 rounded-xl bg-white hover:bg-amber-50 flex items-center justify-center transition shadow-md"
              >
                <X className="w-5 h-5 text-amber-900" />
              </button>
            </div>

            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  Recipe Image (Landscape only) <span className="text-red-600">*</span>
                </label>
                <div className="space-y-3">
                  {editImagePreview && (
                    <div className="relative rounded-2xl overflow-hidden border-4 border-amber-300">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  />
                  {editErrors.image && (
                    <p className="text-sm text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {editErrors.image}
                    </p>
                  )}
                  <p className="text-xs text-amber-700 font-medium">
                    Image must be landscape orientation (width &gt; height). Max size: 5MB
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  Recipe Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => handleEditFormChange("title", e.target.value)}
                  className={`w-full border-2 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900 ${
                    editErrors.title ? "border-red-500" : "border-amber-200"
                  }`}
                  placeholder="Enter recipe title..."
                />
                {editErrors.title && (
                  <p className="text-sm text-red-600 font-semibold mt-1">{editErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange("description", e.target.value)}
                  rows={4}
                  className={`w-full border-2 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900 ${
                    editErrors.description ? "border-red-500" : "border-amber-200"
                  }`}
                  placeholder="Describe your recipe..."
                />
                {editErrors.description && (
                  <p className="text-sm text-red-600 font-semibold mt-1">{editErrors.description}</p>
                )}
              </div>

              {/* Recipe Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-2">Prep Time</label>
                  <select
                    value={editForm.prepTime}
                    onChange={(e) => handleEditFormChange("prepTime", e.target.value)}
                    className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  >
                    <option value="">Select prep time...</option>
                    {PREP_TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-2">Cook Time</label>
                  <select
                    value={editForm.cookTime}
                    onChange={(e) => handleEditFormChange("cookTime", e.target.value)}
                    className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  >
                    <option value="">Select cook time...</option>
                    {COOK_TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-2">Difficulty</label>
                  <select
                    value={editForm.difficulty}
                    onChange={(e) => handleEditFormChange("difficulty", e.target.value)}
                    className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-2">Servings</label>
                  <select
                    value={editForm.servings}
                    onChange={(e) => handleEditFormChange("servings", e.target.value)}
                    className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  >
                    <option value="">Select servings...</option>
                    {SERVING_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 p-4 bg-white border-2 border-amber-200 rounded-2xl max-h-48 overflow-y-auto">
                  {TAG_OPTIONS.map((tag) => {
                    const isSelected = editForm.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleEditTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                          isSelected
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-400"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300"
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">Allergens</label>
                <div className="flex flex-wrap gap-2 p-4 bg-white border-2 border-amber-200 rounded-2xl">
                  {ALLERGENS.map((allergen) => {
                    const isSelected = editForm.allergens.includes(allergen);
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleEditAllergen(allergen)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                          isSelected
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-red-50 text-red-700 border-red-200 hover:border-red-300"
                        }`}
                      >
                        {allergen}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  Ingredients <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {editForm.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleEditIngredientChange(index, e.target.value)}
                        className="flex-1 border-2 border-amber-200 rounded-2xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                        placeholder={`Ingredient ${index + 1}...`}
                      />
                      {editForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditIngredient(index)}
                          className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditIngredient}
                    className="w-full bg-white hover:bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-amber-900 flex items-center justify-center gap-2 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>
                {editErrors.ingredients && (
                  <p className="text-sm text-red-600 font-semibold mt-1">{editErrors.ingredients}</p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">
                  Instructions <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {editForm.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="w-8 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {index + 1}
                      </div>
                      <textarea
                        value={instruction}
                        onChange={(e) => handleEditInstructionChange(index, e.target.value)}
                        rows={2}
                        className="flex-1 border-2 border-amber-200 rounded-2xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                        placeholder={`Step ${index + 1}...`}
                      />
                      {editForm.instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditInstruction(index)}
                          className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditInstruction}
                    className="w-full bg-white hover:bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-amber-900 flex items-center justify-center gap-2 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Step
                  </button>
                </div>
                {editErrors.instructions && (
                  <p className="text-sm text-red-600 font-semibold mt-1">{editErrors.instructions}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-amber-900 mb-2">Chef's Notes (Optional)</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleEditFormChange("notes", e.target.value)}
                  rows={3}
                  className="w-full border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm bg-white outline-none focus:ring-4 focus:ring-amber-300 font-medium text-amber-900"
                  placeholder="Any tips or variations..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t-2 border-amber-200">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 text-sm rounded-2xl border-2 border-amber-200 hover:bg-white font-bold text-amber-900 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitEditForm}
                disabled={editLoading}
                className={`px-6 py-3 text-sm rounded-2xl text-white font-bold shadow-lg transition flex items-center gap-2 ${
                  editLoading
                    ? "bg-amber-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600"
                }`}
              >
                {editLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}