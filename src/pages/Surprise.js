import { useState } from 'react';
import { Heart, RefreshCw } from 'lucide-react';

export default function Surprise() {
  const foodItems = [
    {
      id: 1,
      name: "Spaghetti Carbonara",
      restaurant: "Pasta House",
      price: "₱280.00",
      image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80"
    },
    {
      id: 2,
      name: "Beef Bulgogi Bowl",
      restaurant: "Korean Kitchen",
      price: "₱350.00",
      image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800&q=80"
    },
    {
      id: 3,
      name: "Margherita Pizza",
      restaurant: "Italian Corner",
      price: "₱420.00",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"
    },
    {
      id: 4,
      name: "Chicken Teriyaki",
      restaurant: "Tokyo Express",
      price: "₱295.00",
      image: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80"
    },
    {
      id: 5,
      name: "Caesar Salad",
      restaurant: "Green Bistro",
      price: "₱245.00",
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80"
    },
    {
      id: 6,
      name: "Pad Thai",
      restaurant: "Thai Delights",
      price: "₱315.00",
      image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80"
    },
    {
      id: 7,
      name: "Beef Burger",
      restaurant: "Burger Junction",
      price: "₱380.00",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
    },
    {
      id: 8,
      name: "Chicken Adobo",
      restaurant: "Filipino Eats",
      price: "₱260.00",
      image: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80"
    },
    {
      id: 9,
      name: "Salmon Sushi Platter",
      restaurant: "Sushi Bar",
      price: "₱520.00",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80"
    },
    {
      id: 10,
      name: "Grilled Lamb Chops",
      restaurant: "Steakhouse Prime",
      price: "₱680.00",
      image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80"
    }
  ];

  const [currentFood, setCurrentFood] = useState(foodItems[0]);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const surpriseMe = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * foodItems.length);
      setCurrentFood(foodItems[randomIndex]);
      setIsLiked(false);
      setIsAnimating(false);
    }, 300);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800 mb-3" style={{ letterSpacing: '-0.5px' }}>
            Don't Know What to Eat?
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Let us surprise you with something delicious
          </p>
          
          <button
            onClick={surpriseMe}
            className="bg-yellow-500 hover:bg-yellow-600 font-semibold text-lg px-10 py-3 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2 text-white"
          >
            <RefreshCw className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
            Surprise Me
          </button>
        </div>

        {/* Food Card */}
        <div 
          className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 border border-gray-200 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image Container */}
            <div className="relative md:w-1/2">
              <img
                src={currentFood.image}
                alt={currentFood.name}
                className="w-full h-80 md:h-full object-cover"
              />
              
              {/* Heart Icon */}
              <button
                onClick={toggleLike}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform"
              >
                <Heart
                  className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>
            </div>

            {/* Food Info */}
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="mb-2 text-sm font-semibold tracking-wide uppercase text-yellow-600">
                Recommendation
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                {currentFood.name}
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                {currentFood.restaurant}
              </p>
              <div className="pt-4 border-t-2 border-gray-200">
                <p className="text-3xl font-bold text-yellow-600">
                  {currentFood.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Click "Surprise Me" to discover a random meal suggestion
        </p>
      </div>
    </div>
  );
}