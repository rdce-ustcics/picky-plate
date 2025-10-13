import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function RestaurantLocator() {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [filters, setFilters] = useState({
    cuisine: 'All',
    distance: 'Within 5 km',
    price: '₱',
    rating: '4 Stars'
  });

  const restaurants = [
    {
      id: 1,
      name: 'Japanese Ramen House',
      cuisine: 'Japanese',
      distance: 'Within 4.6 km',
      price: '₱250.00 - ₱300.00',
      rating: 4,
      position: { top: '35%', left: '45%' },
      image: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Italian Bistro',
      cuisine: 'Italian',
      distance: 'Within 3.2 km',
      price: '₱300.00 - ₱500.00',
      rating: 5,
      position: { top: '25%', left: '60%' },
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Filipino Grill',
      cuisine: 'Filipino',
      distance: 'Within 2.8 km',
      price: '₱150.00 - ₱250.00',
      rating: 4,
      position: { top: '55%', left: '65%' },
      image: 'https://images.unsplash.com/photo-1562059392-096320bccc7e?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Korean BBQ',
      cuisine: 'Korean',
      distance: 'Within 5.0 km',
      price: '₱400.00 - ₱600.00',
      rating: 5,
      position: { top: '70%', left: '30%' },
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      name: 'Thai Street Food',
      cuisine: 'Thai',
      distance: 'Within 4.2 km',
      price: '₱200.00 - ₱350.00',
      rating: 4,
      position: { top: '50%', left: '45%' },
      image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop'
    }
  ];

  const handleApplyFilters = () => {
    console.log('Filters applied:', filters);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white py-6 shadow-sm">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Restaurant Locator
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md p-6 mx-4 mt-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Cuisine */}
          <div>
            <label className="block text-gray-800 font-semibold mb-2">
              Cuisine
            </label>
            <select
              value={filters.cuisine}
              onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 bg-white"
            >
              <option>All</option>
              <option>Japanese</option>
              <option>Italian</option>
              <option>Filipino</option>
              <option>Korean</option>
              <option>Thai</option>
            </select>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-gray-800 font-semibold mb-2">
              Distance
            </label>
            <select
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 bg-white"
            >
              <option>Within 5 km</option>
              <option>Within 10 km</option>
              <option>Within 15 km</option>
              <option>Within 20 km</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-gray-800 font-semibold mb-2">
              Price
            </label>
            <select
              value={filters.price}
              onChange={(e) => setFilters({ ...filters, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 bg-white"
            >
              <option>₱</option>
              <option>₱₱</option>
              <option>₱₱₱</option>
              <option>₱₱₱₱</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-gray-800 font-semibold mb-2">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 bg-white"
            >
              <option>4 Stars</option>
              <option>5 Stars</option>
              <option>3 Stars</option>
              <option>2 Stars</option>
              <option>1 Star</option>
            </select>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="flex justify-center">
          <button
            onClick={handleApplyFilters}
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-12 py-3 rounded-lg transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="mx-4 mt-6 relative">
        <div className="relative w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-blue-200">
            {/* Grid lines to simulate map */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Decorative roads */}
            <div className="absolute top-1/4 left-0 w-full h-1 bg-yellow-300 opacity-40 transform rotate-12"></div>
            <div className="absolute top-2/3 left-0 w-full h-1 bg-yellow-300 opacity-40 transform -rotate-6"></div>
          </div>

          {/* Restaurant Markers */}
          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => setSelectedRestaurant(restaurant)}
              className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition cursor-pointer"
              style={{ top: restaurant.position.top, left: restaurant.position.left }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                <path
                  d="M24 0C15.2 0 8 7.2 8 16c0 12 16 32 16 32s16-20 16-32c0-8.8-7.2-16-16-16z"
                  fill="#ef4444"
                />
                <circle cx="24" cy="16" r="6" fill="white"/>
                <path
                  d="M21 14h2v4h-2v-4zm4 0h2v4h-2v-4z"
                  fill="#ef4444"
                />
              </svg>
            </button>
          ))}

          {/* Info Card */}
          {selectedRestaurant && (
            <div className="absolute top-6 left-6 bg-white rounded-lg shadow-2xl p-4 w-72 z-10">
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="font-bold text-lg mb-2 pr-6">
                Here is a {selectedRestaurant.cuisine} Ramen
              </h3>
              
              <img
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-800">Cuisine</span>
                  <p className="text-gray-600">{selectedRestaurant.cuisine}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-800">Distance</span>
                  <p className="text-gray-600">{selectedRestaurant.distance}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-800">Price</span>
                  <p className="text-gray-600">{selectedRestaurant.price}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-800">Rating</span>
                  <div className="mt-1">
                    {renderStars(selectedRestaurant.rating)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded shadow-lg flex items-center justify-center hover:bg-gray-50 font-bold text-gray-600">
              +
            </button>
            <button className="w-10 h-10 bg-white rounded shadow-lg flex items-center justify-center hover:bg-gray-50 font-bold text-gray-600">
              −
            </button>
          </div>

          {/* Google Maps Logo */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white px-2 py-1 rounded text-xs font-semibold text-gray-600">
              Google
            </div>
          </div>

          {/* Map Attribution */}
          <div className="absolute bottom-1 right-16 text-xs text-gray-500 bg-white bg-opacity-80 px-2 rounded">
            Map data ©2024 – Terms
          </div>
        </div>
      </div>
    </div>
  );
}