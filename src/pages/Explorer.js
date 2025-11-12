import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, Download } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import jsPDF from "jspdf";
import "./Explorer.css";

const API_BASE = "http://localhost:4000";

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
    recipe: [""] // Backward compatibility
  });

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
        setDishes(data.recipes.map(r => ({
          id: r._id,
          name: r.name,
          desc: r.desc,
          region: r.region,
          img: r.img || "/images/default-dish.png",
          recipe: r.recipe,
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          isActive: r.isActive
        })));
        setError(null);
      } else {
        setError("Failed to load recipes");
        setDishes([]);
      }
    } catch (e) {
      console.error("Error fetching cultural recipes:", e);
      setError("Failed to load recipes");
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [region]);

  // ESC to close modals
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

  const filtered = useMemo(
    () => (region === "All" ? dishes : dishes.filter((d) => d.region === region)),
    [region, dishes]
  );

  // PDF Download function
  const downloadRecipeAsPDF = (dish) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(dish.name, margin, y);
    y += 10;

    // Region
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text(`Region: ${dish.region}`, margin, y);
    y += 15;

    // Description
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(dish.desc, pageWidth - 2 * margin);
    doc.text(descLines, margin, y);
    y += descLines.length * 6 + 10;

    // Ingredients Section
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
        const ingredientText = `• ${ingredient}`;
        const lines = doc.splitTextToSize(ingredientText, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 6;
      });
      y += 10;
    }

    // Instructions Section
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

    // Fallback to old recipe format if new fields don't exist
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
        const stepText = `• ${step}`;
        const lines = doc.splitTextToSize(stepText, pageWidth - 2 * margin - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 6;
      });
    }

    // Save the PDF
    const fileName = `${dish.name.replace(/\s+/g, '_')}_Recipe.pdf`;
    doc.save(fileName);
  };

  // Admin functions
  const openAddForm = () => {
    setEditingRecipe(null);
    setRecipeForm({
      name: "",
      desc: "",
      region: "Luzon",
      img: "",
      ingredients: [""],
      instructions: [""],
      recipe: [""] // Backward compatibility
    });
    setShowEditForm(true);
  };

  const openEditForm = (dish) => {
    setEditingRecipe(dish);
    setRecipeForm({
      name: dish.name,
      desc: dish.desc,
      region: dish.region,
      img: dish.img || "",
      ingredients: (dish.ingredients && dish.ingredients.length > 0) ? dish.ingredients : [""],
      instructions: (dish.instructions && dish.instructions.length > 0) ? dish.instructions : [""],
      recipe: (dish.recipe && dish.recipe.length > 0) ? dish.recipe : [""] // Backward compatibility
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingRecipe(null);
    setRecipeForm({
      name: "",
      desc: "",
      region: "Luzon",
      img: "",
      ingredients: [""],
      instructions: [""],
      recipe: [""] // Backward compatibility
    });
  };

  const handleFormChange = (field, value) => {
    setRecipeForm(prev => ({ ...prev, [field]: value }));
  };

  // Handlers for ingredients
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

  // Handlers for instructions
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

  // Legacy recipe handlers (for backward compatibility)
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
    if (!isAdmin) return;

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
        recipe: cleanRecipe // Backward compatibility
      };

      const url = editingRecipe
        ? `${API_BASE}/api/cultural-recipes/${editingRecipe.id}`
        : `${API_BASE}/api/cultural-recipes`;

      const method = editingRecipe ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        closeEditForm();
        await fetchRecipes();
      } else {
        alert(data.error || "Failed to save recipe");
      }
    } catch (e) {
      console.error("Save recipe error:", e);
      alert("Failed to save recipe");
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
      console.error("Delete recipe error:", e);
      alert("Failed to delete recipe");
    }
  };

  return (
    <div className="explorer">
      <div className="explorer-header">
        <h1>Explore Filipino Cuisine</h1>
        <div className="explorer-header-actions">
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="All">All Regions</option>
            <option value="Luzon">Luzon</option>
            <option value="Visayas">Visayas</option>
            <option value="Mindanao">Mindanao</option>
          </select>
          {isAdmin && (
            <button className="btn-admin-add" onClick={openAddForm}>
              <Plus className="icon-sm" />
              Add Recipe
            </button>
          )}
        </div>
      </div>

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
              <img src={dish.img} alt={dish.name} />
              <h2>{dish.name}</h2>
              <p>{dish.desc}</p>

              <div className="card-actions">
                <button className="btn-primary" onClick={() => setModalDish(dish)}>
                  Click here to view recipe
                </button>
              </div>

              {isAdmin && (
                <div className="admin-controls">
                  <button
                    className="btn-admin-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(dish);
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
                ×
              </button>
            </div>
            <img className="modal-img" src={modalDish.img} alt={modalDish.name} />
            <p className="modal-desc">{modalDish.desc}</p>

            {/* Ingredients Section */}
            {modalDish.ingredients && modalDish.ingredients.length > 0 && (
              <div className="recipe-box">
                <h3>Ingredients</h3>
                <ul>
                  {modalDish.ingredients.map((ingredient, i) => (
                    <li key={i}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions Section */}
            {modalDish.instructions && modalDish.instructions.length > 0 && (
              <div className="recipe-box">
                <h3>Instructions</h3>
                <ol>
                  {modalDish.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Fallback to old recipe array if new fields aren't available */}
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
                  <button className="btn-admin-edit" onClick={() => { setModalDish(null); openEditForm(modalDish); }}>
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
                ×
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
                <label>Image URL</label>
                <input
                  type="text"
                  value={recipeForm.img}
                  onChange={(e) => handleFormChange("img", e.target.value)}
                  placeholder="/images/dish.png"
                />
              </div>

              {/* Ingredients Section */}
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

              {/* Instructions Section */}
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
  );
}

