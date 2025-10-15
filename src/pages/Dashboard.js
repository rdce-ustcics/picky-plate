import React, { useState } from 'react';
import { Search, Heart, Calendar, Users, BookOpen, Menu } from 'lucide-react';

export default function FoodDeliveryApp() {
  const [favorites, setFavorites] = useState({});
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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

  const recommendedForYou = [
    {
      id: 7,
      name: "Bulgogi Bowl",
      price: 180.00,
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
      rating: 5,
      restaurant: "Korean BBQ House"
    },
    {
      id: 8,
      name: "Creamy Carbonara",
      price: 120.00,
      image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
      rating: 4,
      restaurant: "Pasta Express"
    },
    {
      id: 9,
      name: "Chicken Inasal",
      price: 95.00,
      image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop",
      rating: 5,
      restaurant: "Mang Inasal"
    }
  ];

  const trendingToday = [
    {
      id: 10,
      name: "Milk Tea Combo",
      price: 150.00,
      image: "https://images.unsplash.com/photo-1525385444278-fb1c9a81db3e?w=400&h=300&fit=crop",
      orders: "250+ orders today"
    },
    {
      id: 11,
      name: "Fried Chicken Bucket",
      price: 299.00,
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop",
      orders: "180+ orders today"
    },
    {
      id: 12,
      name: "Sushi Platter",
      price: 450.00,
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
      orders: "120+ orders today"
    }
  ];

  const quickBites = [
    {
      id: 13,
      name: "Club Sandwich",
      price: 85.00,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
      time: "15 min"
    },
    {
      id: 14,
      name: "Lumpia Shanghai",
      price: 60.00,
      image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop",
      time: "12 min"
    },
    {
      id: 15,
      name: "Hotdog Sandwich",
      price: 45.00,
      image: "https://images.unsplash.com/photo-1619740455993-557c4c223c23?w=400&h=300&fit=crop",
      time: "10 min"
    }
  ];

  const cuisines = [
    { name: "Filipino", emoji: "🇵🇭", color: "bg-blue-50" },
    { name: "Japanese", emoji: "🍜", color: "bg-red-50" },
    { name: "Italian", emoji: "🍕", color: "bg-green-50" },
    { name: "Korean", emoji: "🍲", color: "bg-pink-50" },
    { name: "Chinese", emoji: "🥟", color: "bg-yellow-50" },
    { name: "American", emoji: "🍔", color: "bg-orange-50" }
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
      <header className="bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Hello, Username</h1>
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden p-2"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className={`${showMobileSearch ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto`}>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="What do you want eat today..."
                className="pl-9 sm:pl-10 pr-4 py-2 border border-gray-200 rounded-full w-full sm:w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              />
            </div>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 sm:px-8 py-2 rounded-full transition text-sm">
              LOGIN
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl sm:rounded-3xl p-6 sm:p-12 mb-6 sm:mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-yellow-300 rounded-full opacity-30 -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
          <div className="absolute bottom-0 right-10 sm:right-20 w-32 h-32 sm:w-64 sm:h-64 bg-yellow-300 rounded-full opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
              Discover Smarter Food
            </h2>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Choices here in PickAPlate
            </h2>
            <p className="text-white text-xs sm:text-sm opacity-90">
              Sign up and we'll suggest recipes, stores, and more made just for you.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition cursor-pointer">
                <div className="bg-yellow-50 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-tight">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Popular Dishes</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              View all
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className="w-full h-48 sm:h-56 object-cover" />
                  <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                    {dish.discount}
                  </span>
                  <button
                    onClick={() => toggleFavorite(dish.id)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites[dish.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-base sm:text-lg ${i < dish.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{dish.name}</h4>
                  <p className="text-yellow-500 font-bold text-lg sm:text-xl">₱{dish.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended for You */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Recommended for You</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              View all
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommendedForYou.map((dish) => (
              <div key={dish.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className="w-full h-48 sm:h-56 object-cover" />
                  <button
                    onClick={() => toggleFavorite(dish.id)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites[dish.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-base sm:text-lg ${i < dish.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{dish.name}</h4>
                  <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">{dish.restaurant}</p>
                  <p className="text-yellow-500 font-bold text-lg sm:text-xl">₱{dish.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Today */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Trending Today 🔥</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              View all
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trendingToday.map((item) => (
              <div key={item.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={item.image} alt={item.name} className="w-full h-48 sm:h-56 object-cover" />
                  <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                    🔥 Trending
                  </span>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites[item.id] ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{item.name}</h4>
                  <p className="text-yellow-500 font-bold text-lg sm:text-xl mb-1 sm:mb-2">₱{item.price.toFixed(2)}</p>
                  <p className="text-orange-500 text-xs sm:text-sm font-medium">{item.orders}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explore Cuisines */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Explore Cuisines</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {cuisines.map((cuisine, index) => (
              <div key={index} className={`${cuisine.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition cursor-pointer`}>
                <div className="text-3xl sm:text-4xl mb-2">{cuisine.emoji}</div>
                <p className="text-sm sm:text-base text-gray-700 font-semibold">{cuisine.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}