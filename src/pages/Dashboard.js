import React, { useState } from 'react';
import { Search, Heart, Calendar, Users, BookOpen, MapPin, Bell, User, Home, Star, ChevronRight, TrendingUp, Utensils, Coffee, Pizza, Sparkles, Brain, MessageSquare, Flame } from 'lucide-react';

export default function FoodDeliveryApp() {
  const [favorites, setFavorites] = useState({});
  const [activeTab, setActiveTab] = useState('home');

  const toggleFavorite = (id) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 1, name: "Fast Food", icon: Pizza, count: 245 },
    { id: 2, name: "Coffee & Cafe", icon: Coffee, count: 128 },
    { id: 3, name: "Asian Cuisine", icon: Utensils, count: 189 },
    { id: 4, name: "Healthy Options", icon: Flame, count: 94 },
    { id: 5, name: "Filipino Dishes", icon: Utensils, count: 312 },
    { id: 6, name: "Desserts", icon: Coffee, count: 156 }
  ];

  const aiSuggestions = [
    {
      id: 1,
      title: "Perfect for Your Mood",
      description: "Based on today's weather and your preferences",
      dishes: ["Ramen", "Hot Chocolate", "Pasta"],
      icon: Brain,
      color: "from-yellow-400 to-orange-500"
    },
    {
      id: 2,
      title: "Barkada Group Decision",
      description: "Let AI help your group choose together",
      dishes: ["Pizza", "Shawarma", "Burger"],
      icon: Users,
      color: "from-yellow-400 to-yellow-500"
    },
    {
      id: 3,
      title: "Healthy Recommendations",
      description: "Nutritious meals just for you",
      dishes: ["Salad Bowl", "Grilled Fish", "Smoothie"],
      icon: Sparkles,
      color: "from-orange-400 to-yellow-500"
    }
  ];

  const trendingIdeas = [
    {
      id: 10,
      name: "Chicken Adobo with Rice",
      cuisine: "Filipino Comfort Food",
      rating: 4.8,
      votes: 2.4,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
      aiMatch: "95% Match",
      isTrending: true
    },
    {
      id: 11,
      name: "Ramen Bowl",
      cuisine: "Japanese",
      rating: 4.9,
      votes: 5.2,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      aiMatch: "92% Match"
    },
    {
      id: 12,
      name: "Iced Coffee & Pastry",
      cuisine: "Cafe",
      rating: 4.7,
      votes: 1.8,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
      aiMatch: "88% Match"
    }
  ];

  const popularDishes = [
    {
      id: 1,
      name: "Classic Burger Meal",
      price: 60.00,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      rating: 5,
      aiScore: "Perfect Match"
    },
    {
      id: 2,
      name: "Authentic Ramen",
      price: 250.00,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      rating: 4,
      aiScore: "Great Choice"
    },
    {
      id: 3,
      name: "Pepperoni Pizza",
      price: 350.00,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
      rating: 4,
      aiScore: "Recommended"
    }
  ];

  const savedIdeas = [
    {
      id: 4,
      name: "Shawarma Wrap",
      price: 45.00,
      savedDate: "Saved yesterday",
      image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop"
    },
    {
      id: 5,
      name: "Loaded Fries",
      price: 190.00,
      savedDate: "Saved 2 days ago",
      image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop"
    },
    {
      id: 6,
      name: "Fried Rice Bowl",
      price: 70.00,
      savedDate: "Saved last week",
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-gray-800">Quezon City</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-50 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hello, Username! 👋</h1>
              <p className="text-sm text-gray-500 mt-1">What would you like to eat today?</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              U
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="What do you want to eat today..."
              className="pl-12 pr-4 py-3 border border-gray-200 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm bg-gray-50"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-yellow-50 transition">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">AI Suggest</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-yellow-50 transition">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Barkada</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-yellow-50 transition">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Recipes</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-yellow-50 transition">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Meal Plan</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full opacity-30 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 right-20 w-48 h-48 bg-yellow-300 rounded-full opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Discover Smarter Food
                </h2>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Choices with PickAPlate AI
                </h2>
                <p className="text-white text-sm opacity-90 mb-6">
                  Let our AI help you decide what to eat based on your mood, preferences, and cravings
                </p>
                <button className="bg-white text-yellow-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-50 transition shadow-lg">
                  Try AI Suggestions
                </button>
              </div>
              <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">AI Suggestions for You</h3>
              <p className="text-sm text-gray-500">Personalized recommendations</p>
            </div>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 text-sm">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`bg-gradient-to-br ${suggestion.color} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer hover:shadow-xl transition`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <suggestion.icon className="w-8 h-8 mb-3" />
                <h4 className="font-bold text-lg mb-1">{suggestion.title}</h4>
                <p className="text-sm opacity-90 mb-4">{suggestion.description}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestion.dishes.map((dish, idx) => (
                    <span key={idx} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                      {dish}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Browse by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="bg-white rounded-xl p-4 hover:shadow-lg transition hover:bg-yellow-50"
              >
                <div className="bg-yellow-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <cat.icon className="w-7 h-7 text-yellow-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 text-center">{cat.name}</p>
                <p className="text-xs text-gray-400 text-center mt-1">{cat.count} ideas</p>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Ideas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Trending Food Ideas</h3>
              <p className="text-sm text-gray-500">Popular choices in your area</p>
            </div>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 text-sm">
              See all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {trendingIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition flex"
              >
                <div className="relative w-32 flex-shrink-0">
                  <img
                    src={idea.image}
                    alt={idea.name}
                    className="w-full h-full object-cover"
                  />
                  {idea.aiMatch && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {idea.aiMatch}
                    </span>
                  )}
                  {idea.isTrending && (
                    <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <h4 className="font-bold text-gray-800 mb-1">{idea.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{idea.cuisine}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{idea.rating}</span>
                      <span className="text-gray-400">({idea.votes}k votes)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center pr-4">
                  <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded-full transition text-sm">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Dishes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Popular Today</h3>
              <p className="text-sm text-gray-500">Most searched dishes</p>
            </div>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 text-sm">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group">
                <div className="relative">
                  <img src={dish.image} alt={dish.name} className="w-full h-56 object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <span className="absolute top-4 left-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {dish.aiScore}
                  </span>
                  <button
                    onClick={() => toggleFavorite(dish.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:scale-110 transition"
                  >
                    <Heart className={`w-5 h-5 ${favorites[dish.id] ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < dish.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-800 mb-1 text-lg">{dish.name}</h4>
                  <p className="text-yellow-500 font-bold text-2xl mb-3">₱{dish.price.toFixed(2)}</p>
                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2.5 rounded-full transition">
                    Get Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat Assistant */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ask PickAPlate AI</h3>
              <p className="text-sm opacity-90">Can't decide? Chat with our AI food assistant</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition cursor-pointer">
              <Users className="w-6 h-6 mb-2" />
              <p className="font-semibold mb-1">Barkada Vote</p>
              <p className="text-xs opacity-80">Let your group decide together</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition cursor-pointer">
              <BookOpen className="w-6 h-6 mb-2" />
              <p className="font-semibold mb-1">Recipe Finder</p>
              <p className="text-xs opacity-80">Discover new recipes daily</p>
            </div>
          </div>
          <button className="w-full bg-white text-yellow-600 font-semibold py-3 rounded-full hover:bg-gray-50 transition">
            Start Chatting with AI
          </button>
        </div>

        {/* Saved Ideas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Your Saved Ideas</h3>
              <p className="text-sm text-gray-500">Food ideas you've saved</p>
            </div>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 flex items-center gap-1 text-sm">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedIdeas.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition">
                <div className="relative">
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:scale-110 transition"
                  >
                    <Heart className={`w-5 h-5 ${favorites[item.id] ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-800 mb-1">{item.name}</h4>
                  <p className="text-yellow-500 font-bold text-xl mb-2">₱{item.price.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm mb-3">{item.savedDate}</p>
                  <button className="w-full border-2 border-yellow-400 text-yellow-500 hover:bg-yellow-50 font-semibold py-2 rounded-full transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Community Recipes</h3>
            <button className="text-yellow-500 font-semibold hover:text-yellow-600 text-sm">See all</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 hover:bg-yellow-50 rounded-xl transition cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                M
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Maria's Adobo Recipe</h4>
                <p className="text-sm text-gray-500">2.4k views • 342 saves</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-yellow-50 rounded-xl transition cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Jose's Pancit Canton</h4>
                <p className="text-sm text-gray-500">1.8k views • 289 saves</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs font-medium">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'ai' ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs font-medium">AI Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'favorites' ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs font-medium">Saved</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}