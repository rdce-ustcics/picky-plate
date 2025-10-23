import React, { useState, useEffect } from 'react';
import { Flag, Globe, Link2, Plus, Check, X, Edit, Trash2, Search } from 'lucide-react';

const API_BASE = "http://localhost:4000";

export default function Admin() {
  const [activeTab, setActiveTab] = useState('flagged');
  const [flaggedRecipes, setFlaggedRecipes] = useState([]);
  const [culturalRecipes, setCulturalRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cultural Explorer States
  const [editingCultural, setEditingCultural] = useState(null);
  const [showAddCultural, setShowAddCultural] = useState(false);
  const [culturalForm, setCulturalForm] = useState({
    title: '',
    description: '',
    culture: '',
    linkedRecipeIds: []
  });

  // Link Recipe States
  const [linkingRecipe, setLinkingRecipe] = useState(null);
  const [selectedRecipes, setSelectedRecipes] = useState([]);

  // Fetch data
  useEffect(() => {
    fetchFlaggedRecipes();
    fetchCulturalRecipes();
    fetchAllRecipes();
  }, []);

  const fetchFlaggedRecipes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/flagged-recipes`);
      const data = await res.json();
      if (res.ok) setFlaggedRecipes(data.recipes || []);
    } catch (e) {
      console.error('Error fetching flagged recipes:', e);
    }
  };

  const fetchCulturalRecipes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cultural-recipes`);
      const data = await res.json();
      if (res.ok) setCulturalRecipes(data.recipes || []);
    } catch (e) {
      console.error('Error fetching cultural recipes:', e);
    }
  };

  const fetchAllRecipes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recipes?limit=100`);
      const data = await res.json();
      if (res.ok) setAllRecipes(data.items || []);
    } catch (e) {
      console.error('Error fetching all recipes:', e);
    }
  };

  // Flagged Recipe Actions
  const handleApprove = async (recipeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-recipe/${recipeId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setFlaggedRecipes(prev => prev.filter(r => r._id !== recipeId));
      }
    } catch (e) {
      console.error('Error approving recipe:', e);
    }
  };

  const handleReject = async (recipeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-recipe/${recipeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFlaggedRecipes(prev => prev.filter(r => r._id !== recipeId));
      }
    } catch (e) {
      console.error('Error rejecting recipe:', e);
    }
  };

  // Cultural Recipe Actions
  const handleSaveCultural = async () => {
    try {
      const method = editingCultural ? 'PUT' : 'POST';
      const url = editingCultural 
        ? `${API_BASE}/api/cultural-recipes/${editingCultural._id}`
        : `${API_BASE}/api/cultural-recipes`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(culturalForm)
      });

      if (res.ok) {
        fetchCulturalRecipes();
        setShowAddCultural(false);
        setEditingCultural(null);
        setCulturalForm({ title: '', description: '', culture: '', linkedRecipeIds: [] });
      }
    } catch (e) {
      console.error('Error saving cultural recipe:', e);
    }
  };

  const handleDeleteCultural = async (id) => {
    if (!window.confirm('Delete this cultural recipe?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/cultural-recipes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchCulturalRecipes();
    } catch (e) {
      console.error('Error deleting cultural recipe:', e);
    }
  };

  const handleEditCultural = (recipe) => {
    setEditingCultural(recipe);
    setCulturalForm({
      title: recipe.title,
      description: recipe.description,
      culture: recipe.culture,
      linkedRecipeIds: recipe.linkedRecipeIds || []
    });
    setShowAddCultural(true);
  };

  // Link Recipes
  const handleLinkRecipes = async (culturalId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cultural-recipes/${culturalId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: selectedRecipes })
      });
      if (res.ok) {
        fetchCulturalRecipes();
        setLinkingRecipe(null);
        setSelectedRecipes([]);
      }
    } catch (e) {
      console.error('Error linking recipes:', e);
    }
  };

  const toggleRecipeSelection = (recipeId) => {
    setSelectedRecipes(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const filteredRecipes = allRecipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage recipes and cultural content</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('flagged')}
              className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                activeTab === 'flagged'
                  ? 'text-yellow-600 border-b-2 border-yellow-500'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Flag className="w-5 h-5" />
              Flagged Recipes
              {flaggedRecipes.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {flaggedRecipes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cultural')}
              className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                activeTab === 'cultural'
                  ? 'text-yellow-600 border-b-2 border-yellow-500'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Globe className="w-5 h-5" />
              Cultural Explorer
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'flagged' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Flagged Recipes</h2>
              <p className="text-gray-600">Review and approve or reject flagged content</p>
            </div>

            {flaggedRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Flag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No flagged recipes to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedRecipes.map(recipe => (
                  <div key={recipe._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <img
                        src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400'}
                        alt={recipe.title}
                        className="w-full md:w-64 h-48 object-cover"
                      />
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{recipe.title}</h3>
                            <p className="text-sm text-gray-600">By {recipe.author || 'Anonymous'}</p>
                          </div>
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            Flagged
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{recipe.description}</p>
                        
                        {recipe.tags && recipe.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {recipe.tags.slice(0, 5).map((tag, i) => (
                              <span key={i} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs border border-yellow-200">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(recipe._id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(recipe._id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cultural' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Cultural Recipe Explorer</h2>
                <p className="text-gray-600">Manage cultural recipes and link community recipes</p>
              </div>
              <button
                onClick={() => {
                  setShowAddCultural(true);
                  setEditingCultural(null);
                  setCulturalForm({ title: '', description: '', culture: '', linkedRecipeIds: [] });
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                Add Cultural Recipe
              </button>
            </div>

            {/* Cultural Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {culturalRecipes.map(recipe => (
                <div key={recipe._id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.title}</h3>
                        <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                          {recipe.culture}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCultural(recipe)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCultural(recipe._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{recipe.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-gray-600">
                        {recipe.linkedRecipeIds?.length || 0} linked recipes
                      </span>
                      <button
                        onClick={() => {
                          setLinkingRecipe(recipe);
                          setSelectedRecipes(recipe.linkedRecipeIds || []);
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition"
                      >
                        <Link2 className="w-4 h-4" />
                        Link Recipes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {culturalRecipes.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-4">No cultural recipes yet</p>
                <button
                  onClick={() => setShowAddCultural(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-full inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Cultural Recipe
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Cultural Recipe Modal */}
      {showAddCultural && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  {editingCultural ? 'Edit' : 'Add'} Cultural Recipe
                </h2>
                <button
                  onClick={() => {
                    setShowAddCultural(false);
                    setEditingCultural(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={culturalForm.title}
                    onChange={(e) => setCulturalForm({...culturalForm, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                    placeholder="e.g., Filipino Adobo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Culture</label>
                  <input
                    type="text"
                    value={culturalForm.culture}
                    onChange={(e) => setCulturalForm({...culturalForm, culture: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                    placeholder="e.g., Filipino"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={culturalForm.description}
                    onChange={(e) => setCulturalForm({...culturalForm, description: e.target.value})}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none"
                    placeholder="Describe the cultural significance and history..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddCultural(false);
                      setEditingCultural(null);
                    }}
                    className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCultural}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    {editingCultural ? 'Save Changes' : 'Create Recipe'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Recipes Modal */}
      {linkingRecipe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Link Recipes</h2>
                  <p className="text-gray-600">to {linkingRecipe.title}</p>
                </div>
                <button
                  onClick={() => setLinkingRecipe(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                    placeholder="Search recipes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-3">
                {filteredRecipes.map(recipe => (
                  <div
                    key={recipe._id}
                    onClick={() => toggleRecipeSelection(recipe._id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedRecipes.includes(recipe._id)
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                      selectedRecipes.includes(recipe._id)
                        ? 'bg-yellow-400 border-yellow-400'
                        : 'border-gray-300'
                    }`}>
                      {selectedRecipes.includes(recipe._id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <img
                      src={recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=100'}
                      alt={recipe.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{recipe.title}</h4>
                      <p className="text-sm text-gray-600">By {recipe.author || 'Anonymous'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">
                  {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setLinkingRecipe(null)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLinkRecipes(linkingRecipe._id)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  Link Recipes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}