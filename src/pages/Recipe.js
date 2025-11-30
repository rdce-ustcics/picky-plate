// client/src/pages/CommunityRecipes.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus, Clock, TrendingUp, X, ChefHat, Users, ChevronDown, PlusCircle,
  Filter, Search, FileText, Download, Flag, Edit, Trash2, AlertCircle, Loader,
  Heart, BookmarkPlus, Share2, Flame, Timer, UtensilsCrossed, Copy, Check
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import LoadingModal from "../components/LoadingModal";
import "./Recipe.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Batch size for progressive image loading (larger = faster loading)
const IMAGE_BATCH_SIZE = 10;

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
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get URL params for deep linking
  const urlRecipeId = searchParams.get("id");
  const urlSearchQuery = searchParams.get("q");

  const activeUserId = (() => {
    try { return localStorage.getItem("pap:activeUserId") || "global"; }
    catch { return "global"; }
  })();

  const tagMenuRef = useRef(null);
  const allergenMenuRef = useRef(null);
  const modalRef = useRef(null);
  
  // NEW: Refs for dropdown buttons to calculate position
  const tagButtonRef = useRef(null);
  const allergenButtonRef = useRef(null);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // list state
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // filters - initialize from URL params for deep linking from chatbot
  const [search, setSearch] = useState(urlSearchQuery || "");
  const [searchInput, setSearchInput] = useState(urlSearchQuery || "");
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
  const [showMine, setShowMine] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // NEW: State for dropdown positions
  const [tagMenuPosition, setTagMenuPosition] = useState({ top: 0, left: 0 });
  const [allergenMenuPosition, setAllergenMenuPosition] = useState({ top: 0, left: 0 });

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

  // NEW: Favorites/Bookmarks (local storage for demo)
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recipe_favorites") || "[]");
    } catch {
      return [];
    }
  });

  // Active filters count
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

  // NEW: Function to calculate dropdown position
  const calculateDropdownPosition = useCallback((buttonRef) => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Calculate left position, ensuring dropdown doesn't go off-screen
    let left = rect.left;
    const dropdownWidth = Math.min(380, viewportWidth - 32); // max width or viewport - padding
    
    // If dropdown would go off right edge, adjust
    if (left + dropdownWidth > viewportWidth - 16) {
      left = viewportWidth - dropdownWidth - 16;
    }
    
    // Ensure it doesn't go off left edge
    if (left < 16) {
      left = 16;
    }
    
    return {
      top: rect.bottom + 8, // 8px gap below button
      left: left,
    };
  }, []);

  // NEW: Handle tag menu toggle with position calculation
  const handleTagMenuToggle = useCallback(() => {
    if (!showTagMenu) {
      setTagMenuPosition(calculateDropdownPosition(tagButtonRef));
    }
    setShowTagMenu((s) => !s);
  }, [showTagMenu, calculateDropdownPosition]);

  // NEW: Handle allergen menu toggle with position calculation
  const handleAllergenMenuToggle = useCallback(() => {
    if (!showAllergenMenu) {
      setAllergenMenuPosition(calculateDropdownPosition(allergenButtonRef));
    }
    setShowAllergenMenu((s) => !s);
  }, [showAllergenMenu, calculateDropdownPosition]);

  // Close menus on outside click
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

  // NEW: Update dropdown position on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (showTagMenu && tagButtonRef.current) {
        setTagMenuPosition(calculateDropdownPosition(tagButtonRef));
      }
      if (showAllergenMenu && allergenButtonRef.current) {
        setAllergenMenuPosition(calculateDropdownPosition(allergenButtonRef));
      }
    };

    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [showTagMenu, showAllergenMenu, calculateDropdownPosition]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("recipe_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync search state with URL param ?q= (handles browser back/forward and external navigation)
  useEffect(() => {
    const urlQuery = urlSearchQuery || "";
    if (urlQuery !== search) {
      setSearch(urlQuery);
      setSearchInput(urlQuery);
    }
  }, [urlSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open recipe from URL param ?id= (deep linking)
  useEffect(() => {
    if (urlRecipeId && items.length > 0 && !selectedRecipe) {
      // First check if recipe is in current items
      const found = items.find(r => r._id === urlRecipeId);
      if (found) {
        setSelectedRecipe(found);
      } else {
        // Fetch recipe directly if not in current list
        (async () => {
          try {
            const res = await fetch(`${API_BASE}/api/recipes/${urlRecipeId}`);
            const data = await res.json();
            if (res.ok && data.success && data.recipe) {
              setSelectedRecipe(data.recipe);
            }
          } catch (e) {
            // console.error("Failed to load shared recipe:", e);
          }
        })();
      }
    }
  }, [urlRecipeId, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when opening/closing recipe modal
  const openRecipeModal = useCallback((recipe) => {
    setSelectedRecipe(recipe);
    // Update URL with recipe ID (preserves other params)
    const newParams = new URLSearchParams(searchParams);
    newParams.set("id", recipe._id);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeRecipeModal = useCallback(() => {
    setSelectedRecipe(null);
    setLinkCopied(false);
    // Remove recipe ID from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("id");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Get shareable link for current recipe
  const getShareableLink = useCallback((recipe) => {
    const url = new URL(window.location.href);
    url.searchParams.set("id", recipe._id);
    url.searchParams.delete("q"); // Remove search from share link
    return url.toString();
  }, []);

  // Copy link to clipboard
  const copyShareLink = useCallback(async (recipe) => {
    const link = getShareableLink(recipe);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [getShareableLink]);

  // Build query string
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

  // Load images progressively by fetching individual recipes (like Cultural Recipes)
  const loadImagesProgressively = useCallback(async (recipes) => {
    for (let i = 0; i < recipes.length; i += IMAGE_BATCH_SIZE) {
      const batch = recipes.slice(i, i + IMAGE_BATCH_SIZE);

      // Activate this batch (show loading state)
      setItems(prevItems =>
        prevItems.map(item => {
          const inBatch = batch.some(r => r._id === item._id);
          return inBatch ? { ...item, imageActivated: true } : item;
        })
      );

      // Fetch images for this batch in parallel
      await Promise.all(
        batch.map(async (recipe) => {
          try {
            // Fetch the full recipe to get the image
            const res = await fetch(`${API_BASE}/api/recipes/${recipe._id}`);
            const data = await res.json();

            if (res.ok && data.success && data.recipe?.image) {
              // Preload the image
              const img = new Image();
              img.onload = () => {
                setItems(prev =>
                  prev.map(item =>
                    item._id === recipe._id
                      ? { ...item, image: data.recipe.image, actualImage: data.recipe.image, imageLoading: false }
                      : item
                  )
                );
              };
              img.onerror = () => {
                setItems(prev =>
                  prev.map(item =>
                    item._id === recipe._id ? { ...item, imageLoading: false } : item
                  )
                );
              };
              img.src = data.recipe.image;
            } else {
              // No image or error - mark as done
              setItems(prev =>
                prev.map(item =>
                  item._id === recipe._id ? { ...item, imageLoading: false } : item
                )
              );
            }
          } catch (e) {
            // Error fetching - mark as done
            setItems(prev =>
              prev.map(item =>
                item._id === recipe._id ? { ...item, imageLoading: false } : item
              )
            );
          }
        })
      );

      // Small delay between batches
      if (i + IMAGE_BATCH_SIZE < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }, []);

  // Fetch recipes (lite mode first for instant display, then load images)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const headers = isAuthenticated ? authHeaders() : {};
        headers["x-user-id"] = activeUserId;

        // Fetch in lite mode (no images) for instant display
        const res = await fetch(`${API_BASE}/api/recipes?${query}&lite=true`, { headers });
        const data = await res.json();
        if (res.ok) {
          // Set recipes with placeholders immediately (instant display!)
          const recipesWithPlaceholders = (data.items || []).map(recipe => ({
            ...recipe,
            imageActivated: false,
            imageLoading: true,
            image: null, // Will be loaded progressively
            actualImage: null
          }));
          setItems(recipesWithPlaceholders);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
          setLoading(false); // Hide loading modal immediately

          // Then load images progressively in background
          loadImagesProgressively(recipesWithPlaceholders);
        } else {
          // console.error("recipes_list_error:", data);
          setItems([]); setTotal(0); setPages(1);
          setLoading(false);
        }
      } catch (e) {
        // console.error("recipes_list_error:", e);
        setItems([]); setTotal(0); setPages(1);
        setLoading(false);
      }
    })();
  }, [query, isAuthenticated, authHeaders, activeUserId, loadImagesProgressively]);

  const handleImageLoad = useCallback((recipeId) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item._id === recipeId ? { ...item, imageLoading: false } : item
      )
    );
  }, []);

  const handleImageError = useCallback((recipeId) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item._id === recipeId ? { ...item, imageLoading: false } : item
      )
    );
  }, []);

  // Toggle functions
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

  const handleSearchSubmit = () => {
    const trimmedSearch = searchInput.trim();
    setSearch(trimmedSearch);
    setPage(1);
    // Update URL with search query
    const newParams = new URLSearchParams(searchParams);
    if (trimmedSearch) {
      newParams.set("q", trimmedSearch);
    } else {
      newParams.delete("q");
    }
    newParams.delete("id"); // Remove recipe ID when searching
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
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
    // Clear URL params
    setSearchParams({}, { replace: true });
  };

  // NEW: Favorites functions
  const toggleFavorite = (recipeId, e) => {
    e?.stopPropagation();
    setFavorites(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const isFavorite = (recipeId) => favorites.includes(recipeId);

  // Share function with unique shareable link
  const handleShare = async (recipe, e) => {
    e?.stopPropagation();
    const shareableLink = getShareableLink(recipe);
    const shareData = {
      title: recipe.title,
      text: `Check out this recipe: ${recipe.title}`,
      url: shareableLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyShareLink(recipe);
      }
    } else {
      // Fallback: copy to clipboard
      copyShareLink(recipe);
    }
  };

  // PDF helpers
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
      // console.error("PDF generation failed:", err);
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
        // console.error("report_failed:", data);
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
      // console.error("report_error:", e);
      alert("Failed to report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  const isRecipeOwner = (recipe) => {
    if (!user || !recipe) return false;

    // Get user ID (frontend returns 'id', not '_id')
    const userId = String(user.id || user._id || "").trim();

    // Get recipe creator ID (handle ObjectId object or string)
    let recipeCreatorId = "";
    if (recipe.createdBy) {
      // Handle both ObjectId object and string
      recipeCreatorId = typeof recipe.createdBy === 'object'
        ? String(recipe.createdBy._id || recipe.createdBy.$oid || recipe.createdBy)
        : String(recipe.createdBy);
    }
    recipeCreatorId = recipeCreatorId.trim();

    // Debug log (commented out for performance)
    // console.log("isRecipeOwner check:", { userId, recipeCreatorId, match: userId === recipeCreatorId });

    return userId && recipeCreatorId && userId === recipeCreatorId;
  };

  // Check if user can modify recipe (owner OR admin)
  const canModifyRecipe = (recipe) => {
    if (!user || !recipe) return false;
    return isRecipeOwner(recipe) || isAdmin;
  };

  function handleEditRecipe(recipe) {
    if (!canModifyRecipe(recipe)) {
      alert("You don't have permission to edit this recipe");
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
    setSelectedRecipe(null);
  }

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

  const validateImageOrientation = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          if (width > height) {
            resolve(true);
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

  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditErrors(prev => ({ ...prev, image: "Please upload an image file" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditErrors(prev => ({ ...prev, image: "Image must be less than 5MB" }));
      return;
    }

    try {
      await validateImageOrientation(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
        setEditForm(prev => ({ ...prev, image: reader.result }));
        setEditErrors(prev => ({ ...prev, image: null }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setEditErrors(prev => ({ ...prev, image: error.message }));
      e.target.value = "";
    }
  };

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

      setItems(prev => prev.map(item =>
        item._id === editingRecipe._id ? { ...item, ...data.recipe } : item
      ));

      alert("Recipe updated successfully!");
      closeEditModal();
    } catch (e) {
      // console.error("update_recipe_error:", e);
      alert("Failed to update recipe. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

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

  async function handleDeleteRecipe(recipe) {
    if (!canModifyRecipe(recipe)) {
      alert("You don't have permission to delete this recipe");
      return;
    }

    const confirmMsg = isAdmin && !isRecipeOwner(recipe)
      ? `Admin: Are you sure you want to delete "${recipe.title}" by ${recipe.author || "anonymous"}? This action cannot be undone.`
      : `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) {
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

      setItems((prev) => prev.filter((it) => it._id !== recipe._id));
      setSelectedRecipe(null);
      alert("Recipe deleted successfully");
    } catch (e) {
      // console.error("delete_recipe_error:", e);
      alert("Failed to delete recipe. Please try again.");
    }
  }

  // Get difficulty color class
  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'easy';
      case 'medium': return 'medium';
      case 'hard': return 'hard';
      default: return 'easy';
    }
  };

  return (
    <>
      {loading && <LoadingModal message="Loading community recipes..." />}

      <div className="community-recipes-page">
        {/* Header */}
        <div className="cr-header">
          <div className="cr-header-content">
            <div>
              <h1 className="cr-title">Community Recipes</h1>
              <p className="cr-subtitle">Discover and share delicious meals with the community</p>
            </div>

            <div className="cr-header-actions">
              <button
                onClick={() => { setShowMine((v) => !v); setPage(1); }}
                className={`cr-btn-toggle ${showMine ? 'active' : ''}`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                {showMine ? "My Recipes" : "All Recipes"}
              </button>

              <Link to="/recipes/upload" className="cr-btn-upload">
                <Plus className="w-4 h-4" />
                Upload Recipe
              </Link>
            </div>
          </div>

          {/* Filters Section */}
          <div className="cr-filters-section">
            {/* Search Bar */}
            <div className="cr-search-container">
              <div className="cr-search-wrapper">
                <Search className="cr-search-icon" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="cr-search-input"
                  placeholder="Search for delicious recipes..."
                />
              </div>
              <button onClick={handleSearchSubmit} className="cr-search-btn">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filters */}
            <div className="cr-quick-filters">
              {/* Tag Dropdown - FIXED with position calculation */}
              <div className="cr-dropdown" ref={tagMenuRef}>
                <button
                  ref={tagButtonRef}
                  onClick={handleTagMenuToggle}
                  className={`cr-filter-btn ${selectedTags.length > 0 ? 'active' : ''}`}
                >
                  <span>{selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Filter by Tags"}</span>
                  <ChevronDown className={`w-4 h-4 transition ${showTagMenu ? 'rotate-180' : ''}`} />
                </button>
                {showTagMenu && (
                  <div 
                    className="cr-dropdown-menu"
                    style={{
                      top: `${tagMenuPosition.top}px`,
                      left: `${tagMenuPosition.left}px`,
                    }}
                  >
                    <div className="cr-dropdown-grid">
                      {TAG_OPTIONS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`cr-dropdown-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters((v) => !v)}
                className={`cr-filter-btn ${showAdvancedFilters || activeFiltersCount > 0 ? 'active' : ''}`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="cr-filter-badge">{activeFiltersCount}</span>
                )}
              </button>

              {/* Clear Filters */}
              {(search || searchInput || activeFiltersCount > 0 || showMine) && (
                <button onClick={resetFilters} className="cr-clear-btn">
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="cr-advanced-panel">
                <h3 className="cr-advanced-title">Advanced Filters</h3>
                
                <div className="cr-advanced-grid">
                  <select
                    value={prepFilter}
                    onChange={(e) => { setPrepFilter(e.target.value); setPage(1); }}
                    className="cr-select"
                  >
                    <option value="">Prep Time</option>
                    {PREP_TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  
                  <select
                    value={cookFilter}
                    onChange={(e) => { setCookFilter(e.target.value); setPage(1); }}
                    className="cr-select"
                  >
                    <option value="">Cook Time</option>
                    {COOK_TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  
                  <select
                    value={difficultyFilter}
                    onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                    className="cr-select"
                  >
                    <option value="">Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  
                  <select
                    value={servingsFilter}
                    onChange={(e) => { setServingsFilter(e.target.value); setPage(1); }}
                    className="cr-select"
                  >
                    <option value="">Servings</option>
                    {SERVING_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Allergen Exclusions - FIXED with position calculation */}
                <div className="cr-dropdown cr-allergen-dropdown" ref={allergenMenuRef}>
                  <button
                    ref={allergenButtonRef}
                    onClick={handleAllergenMenuToggle}
                    className="cr-dropdown-btn"
                  >
                    <span>
                      {excludeAllergens.length > 0 
                        ? `Excluding ${excludeAllergens.length} allergen${excludeAllergens.length > 1 ? 's' : ''}`
                        : "Exclude Allergens"
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 transition ${showAllergenMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showAllergenMenu && (
                    <div 
                      className="cr-dropdown-menu"
                      style={{
                        top: `${allergenMenuPosition.top}px`,
                        left: `${allergenMenuPosition.left}px`,
                      }}
                    >
                      <div className="cr-dropdown-grid">
                        {ALLERGENS.map((a) => (
                          <button
                            key={a}
                            onClick={() => toggleExcludeAllergen(a)}
                            className={`cr-dropdown-item allergen ${excludeAllergens.includes(a) ? 'selected' : ''}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Exclude Terms */}
                <div className="cr-exclude-section">
                  <label className="cr-exclude-label">Exclude Custom Terms</label>
                  <div className="cr-exclude-input-row">
                    <input
                      value={excludeInput}
                      onChange={(e) => setExcludeInput(e.target.value)}
                      onKeyDown={onExcludeInputKeyDown}
                      className="cr-exclude-input"
                      placeholder="e.g., cilantro, mushroom..."
                    />
                    <button onClick={addExcludeTerm} className="cr-exclude-add-btn">
                      <PlusCircle className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filter Chips */}
            {(search || selectedTags.length > 0 || excludeAllergens.length > 0 || excludeTerms.length > 0) && (
              <div className="cr-active-chips">
                {search && (
                  <span className="cr-chip cr-chip-search">
                    <Search className="w-3 h-3" />
                    "{search}"
                    <button className="cr-chip-remove" onClick={() => { setSearch(""); setSearchInput(""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <span key={`tag-${tag}`} className="cr-chip cr-chip-tag">
                    #{tag}
                    <button className="cr-chip-remove" onClick={() => removeTagChip(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {excludeAllergens.map((a) => (
                  <span key={`alg-${a}`} className="cr-chip cr-chip-allergen">
                    No {a}
                    <button className="cr-chip-remove" onClick={() => removeAllergenChip(a)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {excludeTerms.map((t) => (
                  <span key={`ext-${t}`} className="cr-chip cr-chip-exclude">
                    No {t}
                    <button className="cr-chip-remove" onClick={() => removeExcludeTermChip(t)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="cr-stats-bar">
              <p className="cr-stats-text">
                {total === 0 ? "No recipes found" : (
                  <>
                    <span className="cr-stats-count">{total}</span> recipe{total === 1 ? "" : "s"} found
                  </>
                )}
              </p>
              {pages > 1 && (
                <p className="cr-stats-text">
                  Page {page} of {pages}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="cr-grid-container">
          {items.length === 0 ? (
            <div className="cr-empty-state">
              <ChefHat className="cr-empty-icon" />
              <h3 className="cr-empty-title">No recipes found</h3>
              <p className="cr-empty-text">
                Try adjusting your filters or{" "}
                <Link to="/recipes/upload" className="cr-empty-link">
                  be the first to add one!
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="cr-recipe-grid">
                {items.map((recipe) => (
                  <div
                    key={recipe._id}
                    className="recipe-card"
                    onClick={() => openRecipeModal(recipe)}
                  >
                    <div className={`recipe-card-image-container ${!recipe.imageActivated || recipe.imageLoading ? 'image-skeleton' : ''}`}>
                      {!recipe.imageActivated ? (
                        <div className="recipe-card-placeholder">
                          <ChefHat className="recipe-card-placeholder-icon" />
                          <span className="recipe-card-placeholder-text">Loading...</span>
                        </div>
                      ) : (
                        <img
                          crossOrigin="anonymous"
                          src={recipe.actualImage || recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                          alt={recipe.title}
                          className="recipe-card-image"
                          onLoad={() => handleImageLoad(recipe._id)}
                          onError={() => handleImageError(recipe._id)}
                          style={{ opacity: recipe.imageLoading ? 0.5 : 1 }}
                        />
                      )}
                      {recipe.imageActivated && recipe.imageLoading && (
                        <div className="recipe-card-loading">Loading...</div>
                      )}
                      
                      {/* Difficulty Badge */}
                      {recipe.difficulty && (
                        <span className={`recipe-card-difficulty ${getDifficultyClass(recipe.difficulty)}`}>
                          {recipe.difficulty}
                        </span>
                      )}

                      {/* Favorite Button - NEW */}
                      <button
                        onClick={(e) => toggleFavorite(recipe._id, e)}
                        className="recipe-card-favorite-btn"
                        aria-label={isFavorite(recipe._id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${isFavorite(recipe._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                        />
                      </button>
                    </div>

                    <div className="recipe-card-content">
                      <h3 className="recipe-card-title line-clamp-2">{recipe.title}</h3>
                      <p className="recipe-card-author">
                        By <span className="recipe-card-author-name">{recipe.author || "anonymous"}</span>
                      </p>

                      {recipe.tags?.length ? (
                        <div className="recipe-card-tags">
                          {recipe.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="recipe-card-tag">#{t}</span>
                          ))}
                          {recipe.tags.length > 3 && (
                            <span className="recipe-card-tag">+{recipe.tags.length - 3}</span>
                          )}
                        </div>
                      ) : null}

                      <div className="recipe-card-meta">
                        <div className="recipe-card-meta-item">
                          <Timer className="recipe-card-meta-icon" />
                          <span>{recipe.prepTime || "—"}</span>
                        </div>
                        <div className="recipe-card-meta-item">
                          <Flame className="recipe-card-meta-icon" />
                          <span>{recipe.cookTime || "—"}</span>
                        </div>
                        <div className="recipe-card-meta-item">
                          <Users className="recipe-card-meta-icon" />
                          <span>{recipe.servings || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="cr-pagination">
                  <div className="cr-pagination-info">
                    Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total} recipes
                  </div>
                  <div className="cr-pagination-controls">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="cr-pagination-btn"
                    >
                      ← Prev
                    </button>

                    <div className="cr-pagination-numbers">
                      {pages <= 5 ? (
                        Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`cr-pagination-num ${page === p ? 'active' : ''}`}
                          >
                            {p}
                          </button>
                        ))
                      ) : (
                        <>
                          {page > 2 && (
                            <>
                              <button onClick={() => setPage(1)} className="cr-pagination-num">1</button>
                              {page > 3 && <span className="cr-pagination-ellipsis">…</span>}
                            </>
                          )}
                          {Array.from({ length: 3 }, (_, i) => {
                            const start = Math.max(1, Math.min(page - 1, pages - 2));
                            return start + i;
                          }).filter(p => p <= pages).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`cr-pagination-num ${page === p ? 'active' : ''}`}
                            >
                              {p}
                            </button>
                          ))}
                          {page < pages - 1 && (
                            <>
                              {page < pages - 2 && <span className="cr-pagination-ellipsis">…</span>}
                              <button onClick={() => setPage(pages)} className="cr-pagination-num">{pages}</button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page >= pages}
                      className="cr-pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="cr-modal-overlay" onClick={closeRecipeModal}>
          <div ref={modalRef} className="cr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-image">
              <img
                crossOrigin="anonymous"
                src={selectedRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&auto=format&fit=crop"}
                alt={selectedRecipe.title}
              />
              <div className="cr-modal-image-overlay" />
              <button onClick={closeRecipeModal} className="cr-modal-close">
                <X className="w-6 h-6 text-gray-700" />
              </button>
              <div className="cr-modal-title-section">
                <h2 className="cr-modal-title">{selectedRecipe.title}</h2>
                <p className="cr-modal-author">By {selectedRecipe.author || "anonymous"}</p>
              </div>
            </div>

            <div className="cr-modal-content">
              {selectedRecipe.description && (
                <div className="cr-modal-description">
                  <p>{selectedRecipe.description}</p>
                </div>
              )}

              <div className="cr-modal-info-grid">
                <div className="cr-modal-info-item">
                  <Timer className="cr-modal-info-icon svg-only" />
                  <p className="cr-modal-info-label">Prep Time</p>
                  <p className="cr-modal-info-value">{selectedRecipe.prepTime || "—"}</p>
                </div>
                <div className="cr-modal-info-item">
                  <Flame className="cr-modal-info-icon svg-only" />
                  <p className="cr-modal-info-label">Cook Time</p>
                  <p className="cr-modal-info-value">{selectedRecipe.cookTime || "—"}</p>
                </div>
                <div className="cr-modal-info-item">
                  <TrendingUp className="cr-modal-info-icon svg-only" />
                  <p className="cr-modal-info-label">Difficulty</p>
                  <p className="cr-modal-info-value">{selectedRecipe.difficulty || "Easy"}</p>
                </div>
                <div className="cr-modal-info-item">
                  <Users className="cr-modal-info-icon svg-only" />
                  <p className="cr-modal-info-label">Servings</p>
                  <p className="cr-modal-info-value">{selectedRecipe.servings || "—"}</p>
                </div>
              </div>

              {selectedRecipe.tags?.length ? (
                <div className="cr-modal-tags">
                  {selectedRecipe.tags.map((t, i) => (
                    <span key={i} className="cr-modal-tag">#{t}</span>
                  ))}
                </div>
              ) : null}

              {selectedRecipe.ingredients?.length ? (
                <div className="cr-modal-section">
                  <h3 className="cr-modal-section-title">
                    <ChefHat className="cr-modal-section-icon" />
                    Ingredients
                  </h3>
                  <div className="cr-modal-ingredients">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="cr-modal-ingredient">
                        <div className="cr-modal-ingredient-bullet" />
                        <span className="cr-modal-ingredient-text">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedRecipe.instructions?.length ? (
                <div className="cr-modal-section">
                  <h3 className="cr-modal-section-title">
                    <FileText className="cr-modal-section-icon" />
                    Instructions
                  </h3>
                  <div className="cr-modal-instructions">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <div key={index} className="cr-modal-instruction">
                        <div className="cr-modal-instruction-num">{index + 1}</div>
                        <p className="cr-modal-instruction-text">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedRecipe.notes && (
                <div className="cr-modal-notes">
                  <h3 className="cr-modal-notes-title">
                    <FileText className="w-4 h-4" />
                    Chef's Notes
                  </h3>
                  <p className="cr-modal-notes-text">{selectedRecipe.notes}</p>
                </div>
              )}

              <div className="cr-modal-actions no-pdf">
                {/* Favorite Button */}
                <button
                  onClick={(e) => toggleFavorite(selectedRecipe._id, e)}
                  className={`cr-modal-btn ${isFavorite(selectedRecipe._id) ? 'cr-modal-btn-primary' : 'cr-modal-btn-secondary'}`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(selectedRecipe._id) ? 'fill-current' : ''}`} />
                  {isFavorite(selectedRecipe._id) ? 'Favorited' : 'Favorite'}
                </button>

                {/* Share Button with Copy Link */}
                <button
                  onClick={(e) => handleShare(selectedRecipe, e)}
                  className={`cr-modal-btn ${linkCopied ? 'cr-modal-btn-primary' : 'cr-modal-btn-secondary'}`}
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {linkCopied ? "Link Copied!" : "Share"}
                </button>

                <button onClick={previewRecipePdf} className="cr-modal-btn cr-modal-btn-secondary">
                  <FileText className="w-4 h-4" />
                  Preview PDF
                </button>
                
                <button onClick={downloadRecipePdf} className="cr-modal-btn cr-modal-btn-primary">
                  <Download className="w-4 h-4" />
                  Download
                </button>

                {canModifyRecipe(selectedRecipe) && (
                  <>
                    <button onClick={() => handleEditRecipe(selectedRecipe)} className="cr-modal-btn cr-modal-btn-primary">
                      <Edit className="w-4 h-4" />
                      {isAdmin && !isRecipeOwner(selectedRecipe) ? "Admin Edit" : "Edit"}
                    </button>
                    <button onClick={() => handleDeleteRecipe(selectedRecipe)} className="cr-modal-btn cr-modal-btn-danger">
                      <Trash2 className="w-4 h-4" />
                      {isAdmin && !isRecipeOwner(selectedRecipe) ? "Admin Delete" : "Delete"}
                    </button>
                  </>
                )}

                {!isRecipeOwner(selectedRecipe) && !isAdmin && (
                  <button
                    onClick={openReport}
                    disabled={!!selectedRecipe?.reportedByMe}
                    className="cr-modal-btn cr-modal-btn-report"
                  >
                    <Flag className="w-4 h-4" />
                    {selectedRecipe?.reportedByMe ? "Reported" : "Report"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="cr-report-modal" onClick={closeReport}>
          <div className="cr-report-content" onClick={(e) => e.stopPropagation()}>
            <div className="cr-report-header">
              <div className="cr-report-icon-box">
                <Flag className="cr-report-icon" />
              </div>
              <h3 className="cr-report-title">Report Recipe</h3>
            </div>

            <p className="cr-report-desc">
              Help us keep the community healthy. Choose a reason and add details if needed.
            </p>

            <label className="cr-report-label">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="cr-report-select"
            >
              <option value="">Select a reason…</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <label className="cr-report-label">Additional comment (optional)</label>
            <textarea
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              className="cr-report-textarea"
              placeholder="Add more context…"
            />

            <div className="cr-report-actions">
              <button onClick={closeReport} className="cr-modal-btn cr-modal-btn-secondary">
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportLoading}
                className={`cr-modal-btn ${(!reportReason || reportLoading) ? 'opacity-50 cursor-not-allowed' : ''} cr-modal-btn-primary`}
              >
                {reportLoading ? "Submitting…" : "Submit Report"}
              </button>
            </div>

            <p className="cr-report-hint">
              You can report a recipe only once. Multiple reports flag it for review.
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecipe && (
        <div className="cr-modal-overlay" onClick={closeEditModal}>
          <div className="cr-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cr-edit-modal-header">
              <div className="cr-edit-modal-header-content">
                <div className="cr-edit-modal-icon-box">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <h3 className="cr-edit-modal-title">Edit Recipe</h3>
              </div>
              <button onClick={closeEditModal} className="cr-edit-modal-close">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="cr-edit-modal-body">
              {/* Image Upload */}
              <div className="cr-form-group">
                <label className="cr-form-label">
                  Recipe Image (Landscape only)
                </label>
                {editImagePreview && (
                  <div className="cr-image-preview-container">
                    <img src={editImagePreview} alt="Preview" className="cr-image-preview" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="cr-file-input"
                />
                {editErrors.image && (
                  <p className="cr-error-text">
                    <AlertCircle className="w-4 h-4" />
                    {editErrors.image}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="cr-form-group">
                <label className="cr-form-label">Recipe Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => handleEditFormChange("title", e.target.value)}
                  className={`cr-text-input ${editErrors.title ? 'error' : ''}`}
                  placeholder="Enter recipe title..."
                />
                {editErrors.title && (
                  <p className="cr-error-text-small">{editErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="cr-form-group">
                <label className="cr-form-label">Description *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange("description", e.target.value)}
                  rows={3}
                  className={`cr-textarea-input ${editErrors.description ? 'error' : ''}`}
                  placeholder="Describe your recipe..."
                />
                {editErrors.description && (
                  <p className="cr-error-text-small">{editErrors.description}</p>
                )}
              </div>

              {/* Recipe Details Grid */}
              <div className="cr-advanced-grid">
                <select
                  value={editForm.prepTime}
                  onChange={(e) => handleEditFormChange("prepTime", e.target.value)}
                  className="cr-select"
                >
                  <option value="">Prep Time...</option>
                  {PREP_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <select
                  value={editForm.cookTime}
                  onChange={(e) => handleEditFormChange("cookTime", e.target.value)}
                  className="cr-select"
                >
                  <option value="">Cook Time...</option>
                  {COOK_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                <select
                  value={editForm.difficulty}
                  onChange={(e) => handleEditFormChange("difficulty", e.target.value)}
                  className="cr-select"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <select
                  value={editForm.servings}
                  onChange={(e) => handleEditFormChange("servings", e.target.value)}
                  className="cr-select"
                >
                  <option value="">Servings...</option>
                  {SERVING_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Ingredients */}
              <div className="cr-form-group">
                <label className="cr-form-label">Ingredients *</label>
                <div className="cr-ingredient-list">
                  {editForm.ingredients.map((ingredient, index) => (
                    <div key={index} className="cr-ingredient-row">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleEditIngredientChange(index, e.target.value)}
                        className="cr-text-input"
                        placeholder={`Ingredient ${index + 1}...`}
                      />
                      {editForm.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditIngredient(index)}
                          className="cr-remove-btn"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addEditIngredient} className="cr-add-btn">
                    <PlusCircle className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>
                {editErrors.ingredients && (
                  <p className="cr-error-text-small">{editErrors.ingredients}</p>
                )}
              </div>

              {/* Instructions */}
              <div className="cr-form-group">
                <label className="cr-form-label">Instructions *</label>
                <div className="cr-instruction-list">
                  {editForm.instructions.map((instruction, index) => (
                    <div key={index} className="cr-instruction-row">
                      <div className="cr-instruction-number">{index + 1}</div>
                      <textarea
                        value={instruction}
                        onChange={(e) => handleEditInstructionChange(index, e.target.value)}
                        rows={2}
                        className="cr-textarea-input"
                        placeholder={`Step ${index + 1}...`}
                      />
                      {editForm.instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditInstruction(index)}
                          className="cr-remove-btn"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addEditInstruction} className="cr-add-btn">
                    <PlusCircle className="w-4 h-4" />
                    Add Step
                  </button>
                </div>
                {editErrors.instructions && (
                  <p className="cr-error-text-small">{editErrors.instructions}</p>
                )}
              </div>

              {/* Notes */}
              <div className="cr-form-group">
                <label className="cr-form-label">Chef's Notes (Optional)</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleEditFormChange("notes", e.target.value)}
                  rows={2}
                  className="cr-textarea-input"
                  placeholder="Any tips or variations..."
                />
              </div>
            </div>

            <div className="cr-edit-modal-footer">
              <button onClick={closeEditModal} className="cr-modal-btn cr-modal-btn-secondary">
                Cancel
              </button>
              <button
                onClick={submitEditForm}
                disabled={editLoading}
                className={`cr-modal-btn cr-modal-btn-primary ${editLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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