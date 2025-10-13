import React, { useState } from 'react';
import { Search, Heart, Calendar, Users, Award, Utensils, MapPin, BookOpen } from 'lucide-react';

export default function FoodDeliveryApp() {
  const [favorites, setFavorites] = useState({});

  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const popularDishes = [
    {
      id: 1,
      name: "McDonald's Burger",
      price: 60.00,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      rating: 5,
      discount: "15% Off"
    },
    {
      id: 2,
      name: "Murakami Ramen",
      price: 250.00,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      rating: 4,
      discount: "15% Off"
    },
    {
      id: 3,
      name: "Landers Pepperoni Pizza",
      price: 350.00,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
      rating: 4,
      discount: "15% Off"
    }
  ];

  const recentSearches = [
    {
      id: 4,
      name: "Shawarma Snack",
      price: 45.00,
      distance: "4.97 km • 21 min",
      image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop"
    },
    {
      id: 5,
      name: "Potato Corner",
      price: 190.00,
      distance: "4.97 km • 21 min",
      image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop"
    },
    {
      id: 6,
      name: "Chowking Chow Fan",
      price: 70.00,
      distance: "4.97 km • 21 min",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop"
    }
  ];

  const features = [
    { icon: Users, label: "Community Recipes", color: "text-yellow-500" },
    { icon: Users, label: "Barkada Vote", color: "text-yellow-500" },
    { icon: Users, label: "AI Chat Bot", color: "text-yellow-500" },
    { icon: BookOpen, label: "AI Food and Recipe", color: "text-yellow-500" },
    { icon: Calendar, label: "Calendar", color: "text-yellow-500" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Hello, Username</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="What do you want eat today..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-full w-80 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-8 py-2 rounded-full transition">
            LOGIN
          </button>
        </div>
      </header>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full opacity-30 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 right-20 w-64 h-64 bg-yellow-300 rounded-full opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-2">
              Discover Smarter Food
            </h2>
            <h2 className="text-4xl font-bold text-white mb-4">
              Choices here in PickAPlate
            </h2>
            <p className="text-white text-sm opacity-90">
              Sign up and we'll suggest recipes, stores, and more made just for you.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Features</h3>
          <div className="grid grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition cursor-pointer">
                <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <p className="text-sm text-gray-600 font-medium">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Popular Dishes</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-2">
              View all
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className="w-full h-56 object-cover" />
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {dish.discount}
                  </span>
                  <button
                    onClick={() => toggleFavorite(dish.id)}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                  >
                    <Heart className={`w-5 h-5 ${favorites[dish.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < dish.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">{dish.name}</h4>
                  <p className="text-yellow-500 font-bold text-xl">₱{dish.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Recent Searches</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-2">
              View all
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {recentSearches.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={item.image} alt={item.name} className="w-full h-56 object-cover" />
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                  >
                    <Heart className={`w-5 h-5 ${favorites[item.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-800 mb-2">{item.name}</h4>
                  <p className="text-yellow-500 font-bold text-xl mb-2">₱{item.price.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">{item.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}