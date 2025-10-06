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
    img: "/images/karakare.png",
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
    <div className="explorer">
      <div className="explorer-header">
        <h1>Explore Filipino Cuisine</h1>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="All">All Regions</option>
          <option value="Luzon">Luzon</option>
          <option value="Visayas">Visayas</option>
          <option value="Mindanao">Mindanao</option>
        </select>
      </div>

      <div className="explorer-grid">
        {filtered.map((dish) => (
          <div key={dish.id} className="dish-card">
            <img src={dish.img} alt={dish.name} />
            <h2>{dish.name}</h2>
            <p>{dish.desc}</p>

            <div className="card-actions">
              <button className="btn-primary" onClick={() => setModalDish(dish)}>
                Show Recipe
              </button>
              <button
                className={`btn-outline ${isFav(dish.id) ? "is-fav" : ""}`}
                onClick={() => toggleFav(dish)}
                aria-pressed={isFav(dish.id)}
                title={isFav(dish.id) ? "Remove from favorites" : "Save for later"}
              >
                {isFav(dish.id) ? "★ Bookmarked" : "☆ Save for Later"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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

            <div className="recipe-box">
              <h3>Recipe</h3>
              <ul>
                {modalDish.recipe.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => toggleFav(modalDish)}>
                {isFav(modalDish.id) ? "★ Remove Bookmark" : "☆ Save to Favorites"}
              </button>
              <button className="btn-ghost" onClick={() => setModalDish(null)}>
                Close
              </button>
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
