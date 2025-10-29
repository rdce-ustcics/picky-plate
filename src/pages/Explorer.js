import { useEffect, useMemo, useState } from "react";
import "./Explorer.css";

const dishes = [
  {
    id: 1,
    name: "Sinigang na Baboy",
    desc: "Sinigang, a sour Filipino stew usually flavored with tamarind.",
    region: "Luzon",
    img: "/images/sinigang.png",
    recipe: [
      "1 kg pork belly or ribs",
      "8 cups water",
      "2 tomatoes, quartered",
      "1 onion, sliced",
      "1 radish, sliced",
      "Kangkong leaves",
      "Tamarind soup base (or fresh tamarind)",
      "Fish sauce, salt, pepper to taste",
    ],
  },
  {
    id: 2,
    name: "Adobong Manok",
    desc: "Adobo is chicken simmered in vinegar, soy sauce, garlic, and peppercorns.",
    region: "Luzon",
    img: "/images/adobo.png",
    recipe: [
      "1 kg chicken, cut into pieces",
      "1/2 cup soy sauce",
      "1/2 cup vinegar",
      "6 cloves garlic",
      "3 bay leaves",
      "Peppercorns",
    ],
  },
  {
    id: 3,
    name: "Kare-Kare",
    desc: "A peanut-based stew with oxtail and vegetables.",
    region: "Luzon",
    img: "/images/karekare.png",
    recipe: [
      "1 kg oxtail (or pork hocks)",
      "1/2 cup peanut butter",
      "1 banana heart, sliced",
      "String beans",
      "Eggplant",
      "Bagoong (shrimp paste) for serving",
    ],
  },
];

export default function Explorer() {
  const [region, setRegion] = useState("All");
  const [modalDish, setModalDish] = useState(null);
  const [favorites, setFavorites] = useState(() => loadFavs());

  // keep favorites in localStorage
  useEffect(() => {
    localStorage.setItem("pap_favorites", JSON.stringify(favorites));
    // notify other pages (Profile) that favorites changed
    window.dispatchEvent(new CustomEvent("pap:favorites-updated"));
  }, [favorites]);

  // ESC to close modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setModalDish(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(
    () => (region === "All" ? dishes : dishes.filter((d) => d.region === region)),
    [region]
  );

  const isFav = (id) => favorites.some((f) => f.id === id);
  const toggleFav = (dish) =>
    setFavorites((prev) =>
      isFav(dish.id) ? prev.filter((f) => f.id !== dish.id) : [...prev, dish]
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Explore Filipino Cuisine
            </h1>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all cursor-pointer hover:border-amber-300"
            >
              <option value="All">All Regions</option>
              <option value="Luzon">Luzon</option>
              <option value="Visayas">Visayas</option>
              <option value="Mindanao">Mindanao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dish) => (
            <div 
              key={dish.id} 
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-amber-100 hover:border-amber-300 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={dish.img} 
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-xl font-bold text-white">
                    {dish.name}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {dish.desc}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button 
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => setModalDish(dish)}
                  >
                    Show Recipe
                  </button>
                  <button
                    className={`w-full px-4 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                      isFav(dish.id)
                        ? "bg-amber-100 text-amber-800 border-2 border-amber-300 hover:bg-amber-200"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                    onClick={() => toggleFav(dish)}
                    aria-pressed={isFav(dish.id)}
                    title={isFav(dish.id) ? "Remove from favorites" : "Save for later"}
                  >
                    {isFav(dish.id) ? "★ Bookmarked" : "☆ Save for Later"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalDish && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-title"
          onClick={(e) => e.target === e.currentTarget && setModalDish(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-64 overflow-hidden rounded-t-3xl">
              <img 
                className="w-full h-full object-cover" 
                src={modalDish.img} 
                alt={modalDish.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button 
                className="absolute top-4 right-4 bg-white/95 hover:bg-white rounded-full p-2.5 transition-all shadow-lg"
                onClick={() => setModalDish(null)} 
                aria-label="Close"
              >
                <span className="text-gray-800 text-2xl leading-none">×</span>
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 id="recipe-title" className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                  {modalDish.name}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Description */}
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {modalDish.desc}
              </p>

              {/* Recipe Box */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-amber-500"></span>
                  Ingredients
                </h3>
                <ul className="space-y-3">
                  {modalDish.recipe.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-800">
                      <span className="text-amber-500 text-lg mt-0.5">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  className={`flex-1 px-6 py-3 font-semibold rounded-full transition-all duration-200 ${
                    isFav(modalDish.id)
                      ? "bg-amber-100 text-amber-800 border-2 border-amber-300 hover:bg-amber-200 shadow-sm"
                      : "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-md hover:shadow-lg"
                  }`}
                  onClick={() => toggleFav(modalDish)}
                >
                  {isFav(modalDish.id) ? "★ Remove Bookmark" : "☆ Save to Favorites"}
                </button>
                <button 
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  onClick={() => setModalDish(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers */
function loadFavs() {
  try {
    const raw = localStorage.getItem("pap_favorites");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}