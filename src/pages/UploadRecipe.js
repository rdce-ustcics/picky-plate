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
      prepTime,          // dropdown value
      cookTime,          // dropdown value
      difficulty,
      notes: personalNotes.trim(),
      servings,          // dropdown value
      author: "anonymous",
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
      console.error("Error uploading recipe:", err);
      Swal.fire({
        icon: 'error',
        title: 'Network error',
        text: 'Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Header */}
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Add <span className="text-yellow-400">A</span> Plate
          </h1>

          {/* Dish Name */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">Dish Name</label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition"
              placeholder="Enter dish name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition"
              placeholder="Brief description of your dish"
            />
          </div>

          {/* Ingredients + Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ingredients */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2">Ingredients</label>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-400 focus:outline-none transition"
                      placeholder="e.g., ½ cup coconut milk"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="w-12 h-12 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 rounded-lg transition"
                    >
                      <X className="w-5 h-5 text-yellow-600" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-3 text-yellow-500 hover:text-yellow-600 font-medium flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {/* Upload Photo */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2 opacity-0">Photo</label>
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="photo-upload" />
                <label
                  htmlFor="photo-upload"
                  className="block border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 transition"
                >
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Camera className="w-16 h-16 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">Upload a photo</p>
                      <p className="text-gray-400 text-sm">(optional)</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2 flex items-center gap-2">
              Instructions
              <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs">?</span>
            </label>
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-white text-sm mt-2">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition"
                    placeholder={`Step ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInstruction}
              className="mt-3 text-yellow-500 hover:text-yellow-600 font-medium flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              Add Instruction
            </button>
          </div>

          {/* Times / Difficulty / Servings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Prep Time (DROPDOWN) */}
            <div className="md:col-span-1">
              <label className="block text-gray-800 font-semibold mb-2">Prep Time</label>
              <select
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition bg-white"
              >
                <option value="">Select range…</option>
                {PREP_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Cook Time */}
            <div className="md:col-span-1">
              <label className="block text-gray-800 font-semibold mb-2">Cook Time</label>
              <select
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition bg-white"
              >
                <option value="">Select range…</option>
                {COOK_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="md:col-span-1">
              <label className="block text-gray-800 font-semibold mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition bg-white"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {/* Servings */}
            <div className="md:col-span-1">
              <label className="block text-gray-800 font-semibold mb-2">Serving Size</label>
              <select
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition bg-white"
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
            <label className="block text-gray-800 font-semibold mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition
                      ${active
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergen chips */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">Allergens (optional)</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => {
                const active = selectedAllergens.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAllergen(a)}
                    className={`px-3 py-1 rounded-full text-sm border transition
                      ${active
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Notes */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-2">Personal Notes (optional)</label>
            <textarea
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition resize-none h-20"
              placeholder="Optional notes..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 rounded-full transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
