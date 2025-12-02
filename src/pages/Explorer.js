import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, Download, Camera, MapPin, Compass, ChevronDown } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import jsPDF from "jspdf";
import LoadingModal from "../components/LoadingModal";
import "./Explorer.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Explorer() {
  const { isAuthenticated, authHeaders, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [region, setRegion] = useState("All");
  const [modalDish, setModalDish] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin editing state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    desc: "",
    region: "Luzon",
    img: "",
    ingredients: [""],
    instructions: [""],
    recipe: [""]
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch cultural recipes from database
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (region !== "All") {
        params.set("region", region);
      }

      const res = await fetch(`${API_BASE}/api/cultural-recipes?${params}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const recipesWithPlaceholders = data.recipes.map(r => ({
          id: r._id,
          name: r.name,
          desc: r.desc,
          region: r.region,
          img: "/images/default-dish.png",
          recipe: r.recipe || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          isActive: r.isActive,
          imageLoading: true
        }));

        setDishes(recipesWithPlaceholders);
        setError(null);
        setLoading(false);

        loadImagesOneByOne(recipesWithPlaceholders);
      } else {
        setError("Failed to load recipes");
        setDishes([]);
        setLoading(false);
      }
    } catch (e) {
      setError("Failed to load recipes");
      setDishes([]);
      setLoading(false);
    }
  };

  const loadImagesOneByOne = async (recipes) => {
    const BATCH_SIZE = 10;

    for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
      const batch = recipes.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (recipe) => {
          try {
            const res = await fetch(`${API_BASE}/api/cultural-recipes/${recipe.id}`);
            const data = await res.json();

            if (res.ok && data.success) {
              setDishes(prevDishes =>
                prevDishes.map(dish =>
                  dish.id === recipe.id
                    ? {
                        ...dish,
                        img: data.recipe.img || "/images/default-dish.png",
                        imageLoading: false
                      }
                    : dish
                )
              );
            }
          } catch (e) {
            setDishes(prevDishes =>
              prevDishes.map(dish =>
                dish.id === recipe.id
                  ? { ...dish, imageLoading: false }
                  : dish
              )
            );
          }
        })
      );
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [region]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setModalDish(null);
        setShowEditForm(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fetchRecipeDetails = async (recipeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cultural-recipes/${recipeId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        return {
          id: data.recipe._id,
          name: data.recipe.name,
          desc: data.recipe.desc,
          region: data.recipe.region,
          img: data.recipe.img || "/images/default-dish.png",
          recipe: data.recipe.recipe || [],
          ingredients: data.recipe.ingredients || [],
          instructions: data.recipe.instructions || [],
          isActive: data.recipe.isActive
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const filtered = useMemo(
    () => (region === "All" ? dishes : dishes.filter((d) => d.region === region)),
    [region, dishes]
  );

  const downloadRecipeAsPDF = (dish) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(dish.name, margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text(`Region: ${dish.region}`, margin, y);
    y += 15;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(dish.desc, pageWidth - 2 * margin);
    doc.text(descLines, margin, y);
    y += descLines.length * 6 + 10;

    if (dish.ingredients && dish.ingredients.length > 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Ingredients", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      dish.ingredients.forEach((ingredient, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const ingredientText = `- ${ingredient}`;
        const lines = doc.splitTextToSize(ingredientText, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 6;
      });
      y += 10;
    }

    if (dish.instructions && dish.instructions.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Cooking Instructions", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      dish.instructions.forEach((step, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const stepText = `${i + 1}. ${step}`;
        const lines = doc.splitTextToSize(stepText, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 6 + 3;
      });
    }

    if ((!dish.ingredients || dish.ingredients.length === 0) &&
        (!dish.instructions || dish.instructions.length === 0) &&
        dish.recipe && dish.recipe.length > 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Recipe", margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      dish.recipe.forEach((step, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const stepText = `- ${step}`;
        const lines = doc.splitTextToSize(stepText, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 6;
      });
    }

    const fileName = `${dish.name.replace(/\s+/g, '_')}_Recipe.pdf`;
    doc.save(fileName);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setRecipeForm(prev => ({ ...prev, img: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddForm = () => {
    setEditingRecipe(null);
    setImagePreview(null);
    setRecipeForm({
      name: "",
      desc: "",
      region: "Luzon",
      img: "",
      ingredients: [""],
      instructions: [""],
      recipe: [""]
    });
    setShowEditForm(true);
  };

  const openEditForm = async (dish) => {
    setLoading(true);
    const fullRecipe = await fetchRecipeDetails(dish.id);
    setLoading(false);

    if (!fullRecipe) {
      alert("Failed to load recipe details");
      return;
    }

    setEditingRecipe(fullRecipe);
    setImagePreview(fullRecipe.img || null);
    setRecipeForm({
      name: fullRecipe.name,
      desc: fullRecipe.desc,
      region: fullRecipe.region,
      img: fullRecipe.img || "",
      ingredients: (fullRecipe.ingredients && fullRecipe.ingredients.length > 0) ? fullRecipe.ingredients : [""],
      instructions: (fullRecipe.instructions && fullRecipe.instructions.length > 0) ? fullRecipe.instructions : [""],
      recipe: (fullRecipe.recipe && fullRecipe.recipe.length > 0) ? fullRecipe.recipe : [""]
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingRecipe(null);
    setImagePreview(null);
    setRecipeForm({
      name: "",
      desc: "",
      region: "Luzon",
      img: "",
      ingredients: [""],
      instructions: [""],
      recipe: [""]
    });
  };

  const handleFormChange = (field, value) => {
    setRecipeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients[index] = value;
    setRecipeForm(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, ""] }));
  };

  const removeIngredient = (index) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...recipeForm.instructions];
    newInstructions[index] = value;
    setRecipeForm(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setRecipeForm(prev => ({ ...prev, instructions: [...prev.instructions, ""] }));
  };

  const removeInstruction = (index) => {
    setRecipeForm(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleRecipeItemChange = (index, value) => {
    const newRecipe = [...recipeForm.recipe];
    newRecipe[index] = value;
    setRecipeForm(prev => ({ ...prev, recipe: newRecipe }));
  };

  const addRecipeItem = () => {
    setRecipeForm(prev => ({ ...prev, recipe: [...prev.recipe, ""] }));
  };

  const removeRecipeItem = (index) => {
    setRecipeForm(prev => ({
      ...prev,
      recipe: prev.recipe.filter((_, i) => i !== index)
    }));
  };

  const saveRecipe = async () => {
    if (!isAdmin) {
      alert("You must be logged in as an admin to create cultural recipes");
      return;
    }

    if (!isAuthenticated) {
      alert("You must be logged in to create cultural recipes");
      return;
    }

    try {
      const cleanIngredients = recipeForm.ingredients.filter(item => item.trim());
      const cleanInstructions = recipeForm.instructions.filter(item => item.trim());
      const cleanRecipe = recipeForm.recipe.filter(item => item.trim());

      if (!recipeForm.name.trim() || !recipeForm.desc.trim()) {
        alert("Name and description are required");
        return;
      }

      const payload = {
        ...recipeForm,
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
        recipe: cleanRecipe
      };

      const headers = {
        ...authHeaders(),
        "Content-Type": "application/json"
      };

      const url = editingRecipe
        ? `${API_BASE}/api/cultural-recipes/${editingRecipe.id}`
        : `${API_BASE}/api/cultural-recipes`;

      const method = editingRecipe ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("Recipe saved successfully!");
        closeEditForm();
        await fetchRecipes();
      } else {
        alert(data.error || "Failed to save recipe");
      }
    } catch (e) {
      alert(`Failed to save recipe: ${e.message}`);
    }
  };

  const deleteRecipe = async (id) => {
    if (!isAdmin) return;

    if (!window.confirm("Are you sure you want to delete this cultural recipe?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/cultural-recipes/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await fetchRecipes();
        setModalDish(null);
      } else {
        alert(data.error || "Failed to delete recipe");
      }
    } catch (e) {
      alert("Failed to delete recipe");
    }
  };

  return (
    <>
      {loading && <LoadingModal message="Loading cultural recipes..." />}

      <div className="explorer">
        {/* New Unique Header */}
        <header className="explorer-header-v2">
          {/* Decorative background elements */}
          <div className="explorer-header-bg">
            <div className="header-pattern"></div>
            <div className="header-glow header-glow-1"></div>
            <div className="header-glow header-glow-2"></div>
          </div>

          {/* Left decorative border */}
          <div className="header-accent-bar"></div>

          <div className="explorer-header-content">
            {/* Title Section */}
            <div className="explorer-title-section">
              <div className="explorer-icon-badge">
                <Compass className="explorer-compass-icon" />
              </div>
              <div className="explorer-title-text">
                <h1>Explore Filipino Cuisine</h1>
                <p className="explorer-subtitle">
                  <MapPin className="subtitle-icon" />
                  <span>Discover authentic recipes from across the Philippines</span>
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="explorer-header-actions">
              {/* Region Selector */}
              <div className="region-selector">
                <MapPin className="region-icon" />
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="All">All Regions</option>
                  <option value="Luzon">Luzon</option>
                  <option value="Visayas">Visayas</option>
                  <option value="Mindanao">Mindanao</option>
                </select>
                <ChevronDown className="region-chevron" />
              </div>

              {/* Admin Add Button */}
              {isAdmin && (
                <button className="btn-admin-add" onClick={openAddForm}>
                  <Plus className="icon-sm" />
                  <span>Add Recipe</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="header-wave">
            <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
              <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill="#fffbeb"/>
            </svg>
          </div>
        </header>

      {loading ? (
        <div className="explorer-loading">Loading cultural recipes...</div>
      ) : error ? (
        <div className="explorer-error">{error}</div>
      ) : dishes.length === 0 ? (
        <div className="explorer-empty">
          {isAdmin ? (
            <>
              <p>No cultural recipes found for this region.</p>
              <button className="btn-primary" onClick={openAddForm} style={{ marginTop: "16px" }}>
                <Plus className="icon-sm" />
                Add Your First Recipe
              </button>
            </>
          ) : (
            <p>No cultural recipes found for this region.</p>
          )}
        </div>
      ) : (
        <div className="explorer-grid">
          {filtered.map((dish) => (
            <div key={dish.id} className="dish-card">
              <div style={{ position: 'relative' }}>
                <img
                  src={dish.img}
                  alt={dish.name}
                  style={{
                    opacity: dish.imageLoading ? 0.5 : 1,
                    transition: 'opacity 0.4s ease-in-out'
                  }}
                />
                {dish.imageLoading && (
                  <div style={{
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
                    pointerEvents: 'none'
                  }}>
                    Loading...
                  </div>
                )}
              </div>
              <h2>{dish.name}</h2>
              <p>{dish.desc}</p>

              <div className="card-actions">
                <button
                  className="btn-primary"
                  onClick={async () => {
                    setLoading(true);
                    const fullRecipe = await fetchRecipeDetails(dish.id);
                    setLoading(false);
                    if (fullRecipe) {
                      setModalDish(fullRecipe);
                    } else {
                      alert("Failed to load recipe details");
                    }
                  }}
                >
                  Click here to view recipe
                </button>
              </div>

              {isAdmin && (
                <div className="admin-controls">
                  <button
                    className="btn-admin-edit"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await openEditForm(dish);
                    }}
                    title="Edit recipe"
                  >
                    <Edit className="icon-xs" />
                  </button>
                  <button
                    className="btn-admin-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecipe(dish.id);
                    }}
                    title="Delete recipe"
                  >
                    <Trash2 className="icon-xs" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Recipe Modal */}
      {modalDish && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-title"
          onClick={(e) => e.target === e.currentTarget && setModalDish(null)}
        >
          <div className="modal">
            <div className="modal-header">
              <h2 id="recipe-title">{modalDish.name}</h2>
              <button className="icon-btn" onClick={() => setModalDish(null)} aria-label="Close">
                X
              </button>
            </div>
            <img className="modal-img" src={modalDish.img} alt={modalDish.name} />
            <p className="modal-desc">{modalDish.desc}</p>

            {modalDish.ingredients && modalDish.ingredients.length > 0 && (
              <div className="recipe-box">
                <h3>Ingredients</h3>
                <ul className="ingredients-list">
                  {modalDish.ingredients.map((ingredient, i) => (
                    <li key={i}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            {modalDish.instructions && modalDish.instructions.length > 0 && (
              <div className="recipe-box instructions-box">
                <h3>Instructions</h3>
                <ol className="instructions-list">
                  {modalDish.instructions.map((step, i) => (
                    <li key={i}>
                      <span className="step-number">{i + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {(!modalDish.ingredients || modalDish.ingredients.length === 0) &&
             (!modalDish.instructions || modalDish.instructions.length === 0) &&
             modalDish.recipe && modalDish.recipe.length > 0 && (
              <div className="recipe-box">
                <h3>Recipe</h3>
                <ul>
                  {modalDish.recipe.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => downloadRecipeAsPDF(modalDish)}>
                <Download className="icon-xs" />
                Download as PDF
              </button>
              {isAdmin && (
                <>
                  <button className="btn-admin-edit" onClick={async () => { setModalDish(null); await openEditForm(modalDish); }}>
                    <Edit className="icon-xs" />
                    Edit
                  </button>
                  <button className="btn-admin-delete" onClick={() => deleteRecipe(modalDish.id)}>
                    <Trash2 className="icon-xs" />
                    Delete
                  </button>
                </>
              )}
              <button className="btn-ghost" onClick={() => setModalDish(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit/Add Form Modal */}
      {showEditForm && isAdmin && (
        <div
          className="modal-backdrop"
          onClick={closeEditForm}
        >
          <div
            className="modal modal-form"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingRecipe ? "Edit Cultural Recipe" : "Add Cultural Recipe"}</h2>
              <button className="icon-btn" onClick={closeEditForm} aria-label="Close">
                X
              </button>
            </div>

            <div className="form-content">
              <div className="form-group">
                <label>Recipe Name *</label>
                <input
                  type="text"
                  value={recipeForm.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="e.g., Sinigang na Baboy"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={recipeForm.desc}
                  onChange={(e) => handleFormChange("desc", e.target.value)}
                  rows={3}
                  placeholder="Brief description of the dish"
                />
              </div>

              <div className="form-group">
                <label>Region *</label>
                <select
                  value={recipeForm.region}
                  onChange={(e) => handleFormChange("region", e.target.value)}
                >
                  <option value="Luzon">Luzon</option>
                  <option value="Visayas">Visayas</option>
                  <option value="Mindanao">Mindanao</option>
                </select>
              </div>

              <div className="form-group">
                <label>Recipe Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="cultural-photo-upload"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="cultural-photo-upload"
                  style={{
                    display: 'block',
                    border: '2px dashed #FCD34D',
                    borderRadius: '12px',
                    minHeight: '250px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F59E0B'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FCD34D'}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '250px',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '250px'
                    }}>
                      <Camera style={{ width: '64px', height: '64px', color: '#F59E0B', marginBottom: '12px' }} />
                      <p style={{ color: '#92400E', fontWeight: '500', margin: 0 }}>Upload a photo</p>
                      <p style={{ color: '#B45309', fontSize: '14px', marginTop: '4px' }}>Click to browse</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label>Ingredients</label>
                  <button className="btn-add-item" onClick={addIngredient}>
                    <Plus className="icon-xs" />
                    Add Ingredient
                  </button>
                </div>
                <div className="recipe-items">
                  {recipeForm.ingredients.map((item, index) => (
                    <div key={index} className="recipe-item">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        placeholder={`e.g., 1 kg chicken, cut into pieces`}
                      />
                      {recipeForm.ingredients.length > 1 && (
                        <button
                          className="btn-remove-item"
                          onClick={() => removeIngredient(index)}
                        >
                          <X className="icon-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label>Cooking Instructions</label>
                  <button className="btn-add-item" onClick={addInstruction}>
                    <Plus className="icon-xs" />
                    Add Step
                  </button>
                </div>
                <div className="recipe-items">
                  {recipeForm.instructions.map((item, index) => (
                    <div key={index} className="recipe-item">
                      <span className="step-label">{index + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                      />
                      {recipeForm.instructions.length > 1 && (
                        <button
                          className="btn-remove-item"
                          onClick={() => removeInstruction(index)}
                        >
                          <X className="icon-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={closeEditForm}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveRecipe}>
                {editingRecipe ? "Update Recipe" : "Create Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}