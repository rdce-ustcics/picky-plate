// client/src/pages/UploadRecipe.js
import React, { useState } from 'react';
import { Plus, X, Camera } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../auth/AuthContext';

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

export default function UploadRecipe() {
  const { isAuthenticated, authHeaders } = useAuth();

  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');

  // keep 3 defaults
  const [ingredients, setIngredients] = useState(['', '', '']);
  const [instructions, setInstructions] = useState(['', '', '']);

  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [personalNotes, setPersonalNotes] = useState('');
  const [image, setImage] = useState(null);
  const [servings, setServings] = useState('');

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index) => {
    if (ingredients.length > 1) setIngredients(ingredients.filter((_, i) => i !== index));
  };
  const updateIngredient = (index, value) => {
    const next = [...ingredients]; next[index] = value; setIngredients(next);
  };

  const addInstruction = () => setInstructions([...instructions, '']);
  const removeInstruction = (index) => {
    if (instructions.length > 1) setInstructions(instructions.filter((_, i) => i !== index));
  };
  const updateInstruction = (index, value) => {
    const next = [...instructions]; next[index] = value; setInstructions(next);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const toggleAllergen = (a) => {
    setSelectedAllergens((prev) => prev.includes(a) ? prev.filter(t => t !== a) : [...prev, a]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs = [];
    if (!dishName.trim()) errs.push("Dish name is required");
    if (!description.trim()) errs.push("Description is required");

    const cleanIngredients = ingredients.map(s => s.trim()).filter(Boolean);
    if (cleanIngredients.length === 0) errs.push("At least one ingredient is required");

    const cleanInstructions = instructions.map(s => s.trim()).filter(Boolean);
    if (cleanInstructions.length === 0) errs.push("At least one instruction is required");

    if (!prepTime) errs.push("Prep time is required");
    if (!cookTime) errs.push("Cook time is required");
    if (!servings) errs.push("Serving size is required");
    if (!difficulty) errs.push("Difficulty is required");

    if (errs.length) {
      Swal.fire({
        icon: 'error',
        title: 'Please fix these',
        html: `<ul style="text-align:left;margin:0;padding-left:18px;">${errs.map(e => `<li>${e}</li>`).join("")}</ul>`
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const recipeData = {
      title: dishName.trim(),
      description: description.trim(),
      image: image || "",
      ingredients: ingredients.map(i => i.trim()).filter(Boolean),
      instructions: instructions.map(i => i.trim()).filter(Boolean),
      prepTime,
      cookTime,
      difficulty,
      notes: personalNotes.trim(),
      servings,
      tags: selectedTags,
      allergens: selectedAllergens
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (isAuthenticated) Object.assign(headers, authHeaders());

      const res = await fetch("http://localhost:4000/api/recipes", {
        method: "POST",
        headers,
        body: JSON.stringify(recipeData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Login required',
            text: 'Please log in to upload a recipe.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Upload failed',
            text: data?.error || 'Something went wrong.',
          });
        }
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Recipe uploaded!',
        showConfirmButton: true,
      }).then(() => {
        window.location.href = "/recipes";
      });
    } catch (err) {
      // console.error("Error uploading recipe:", err);
      Swal.fire({
        icon: 'error',
        title: 'Network error',
        text: 'Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF3C7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border-2 border-[#FCD34D] p-6 sm:p-8">
          {/* Header */}
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#B45309] mb-2">
            Add <span className="text-[#FFBF00]">A</span> Plate
          </h1>
          <p className="text-center text-[#92400E] mb-8">Share your culinary creation with the community</p>

          {/* Dish Name */}
          <div className="mb-6">
            <label className="block text-[#92400E] font-semibold mb-2">Dish Name</label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white"
              placeholder="Enter dish name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-[#92400E] font-semibold mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white"
              placeholder="Brief description of your dish"
            />
          </div>

          {/* Ingredients + Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ingredients */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Ingredients</label>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white"
                      placeholder="e.g., ½ cup coconut milk"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="w-12 h-12 flex items-center justify-center bg-[#FEF3C7] hover:bg-[#FCD34D] rounded-xl transition border-2 border-[#FCD34D]"
                    >
                      <X className="w-5 h-5 text-[#92400E]" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-3 text-[#F59E0B] hover:text-[#D97706] font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {/* Upload Photo */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Photo (optional)</label>
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="photo-upload" />
                <label
                  htmlFor="photo-upload"
                  className="block border-2 border-dashed border-[#FCD34D] rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-[#F59E0B] transition bg-white"
                >
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Camera className="w-16 h-16 text-[#F59E0B] mb-3" />
                      <p className="text-[#92400E] font-medium">Upload a photo</p>
                      <p className="text-[#B45309] text-sm mt-1">Click to browse</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <label className="block text-[#92400E] font-semibold mb-2">
              Instructions
            </label>
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center font-bold text-white text-sm mt-2">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white"
                    placeholder={`Step ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[#FEF3C7] rounded-xl transition"
                  >
                    <X className="w-5 h-5 text-[#92400E]" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInstruction}
              className="mt-3 text-[#F59E0B] hover:text-[#D97706] font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              Add Instruction
            </button>
          </div>

          {/* Times / Difficulty / Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Prep Time */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Prep Time</label>
              <select
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white text-[#92400E]"
              >
                <option value="">Select range…</option>
                {PREP_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Cook Time */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Cook Time</label>
              <select
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white text-[#92400E]"
              >
                <option value="">Select range…</option>
                {COOK_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white text-[#92400E]"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {/* Servings */}
            <div>
              <label className="block text-[#92400E] font-semibold mb-2">Serving Size</label>
              <select
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition bg-white text-[#92400E]"
              >
                <option value="">Select…</option>
                {SERVING_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag chips */}
          <div className="mb-6">
            <label className="block text-[#92400E] font-semibold mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition font-semibold
                      ${active
                        ? "bg-[#F59E0B] text-white border-[#F59E0B]"
                        : "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] hover:border-[#F59E0B]"}`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergen chips */}
          <div className="mb-6">
            <label className="block text-[#92400E] font-semibold mb-2">Allergens (optional)</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const active = selectedAllergens.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAllergen(a)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition font-semibold
                      ${active
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] hover:border-[#F59E0B]"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Notes */}
          <div className="mb-8">
            <label className="block text-[#92400E] font-semibold mb-2">Personal Notes (optional)</label>
            <textarea
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#FCD34D] rounded-xl focus:border-[#F59E0B] focus:outline-none transition resize-none h-24 bg-white"
              placeholder="Add any cooking tips or variations..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-4 rounded-xl transition"
          >
            Upload Recipe
          </button>
        </div>
      </div>
    </div>
  );
}