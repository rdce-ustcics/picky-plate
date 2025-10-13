import React, { useState } from 'react';
import { Plus, X, Camera } from 'lucide-react';

export default function UploadRecipe() {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['', '', '']);
  const [instructions, setInstructions] = useState(['', '', '']);
  const [prepCookTime, setPrepCookTime] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [personalNotes, setPersonalNotes] = useState('');
  const [image, setImage] = useState(null);

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const recipeData = {
      dishName,
      description,
      ingredients: ingredients.filter(i => i.trim() !== ''),
      instructions: instructions.filter(i => i.trim() !== ''),
      prepCookTime,
      difficulty,
      personalNotes,
      image
    };
    console.log('Recipe submitted:', recipeData);
    alert('Recipe submitted successfully!');
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
            <label className="block text-gray-800 font-semibold mb-2">
              Dish Name
            </label>
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
            <label className="block text-gray-800 font-semibold mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition"
              placeholder="Brief description of your dish"
            />
          </div>

          {/* Ingredients and Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ingredients */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Ingredients
              </label>
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
                Add Ingredients
              </button>
            </div>

            {/* Upload Photo */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2 opacity-0">
                Photo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                />
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
              <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs">
                ?
              </span>
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

          {/* Bottom Row: Time, Difficulty, Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Prep/Cook Time */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Prep/Cook Time
              </label>
              <input
                type="text"
                value={prepCookTime}
                onChange={(e) => setPrepCookTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition"
                placeholder="e.g., 30 min"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-gray-800 font-semibold mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition bg-white appearance-none cursor-pointer"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {/* Personal Notes */}
            <div className="lg:col-span-1">
              <label className="block text-gray-800 font-semibold mb-2">
                Personal Notes
              </label>
              <textarea
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition resize-none h-12"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Submit Button */}
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