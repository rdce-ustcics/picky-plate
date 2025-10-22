import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, DollarSign } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6, 1)); // July 2025
  const [selectedDate, setSelectedDate] = useState(null);
  const [weeklyBudget] = useState(740.00);

  // Sample meal data
  const [mealData, setMealData] = useState({
    '2025-7-14': {
      breakfast: { name: 'Pancakes', cost: 150.00 },
      lunch: { name: 'Chicken Adobo', cost: 200.00 },
      dinner: { name: 'Sinigang', cost: 250.00 }
    },
    '2025-7-20': {
      breakfast: { name: 'Eggs & Toast', cost: 80.00 },
      lunch: { name: 'Carbonara Pasta', cost: 180.00 },
      dinner: { name: 'Grilled Fish', cost: 220.00 }
    },
    '2025-7-27': {
      breakfast: { name: 'Banana Pancakes', cost: 120.00 },
      lunch: { name: 'Beef Bulgogi', cost: 280.00 }
    }
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMealsForDay = (day) => {
    if (!day) return null;
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    return mealData[key] || null;
  };

  const getTotalCostForDay = (day) => {
    const meals = getMealsForDay(day);
    if (!meals) return 0;
    let total = 0;
    if (meals.breakfast) total += meals.breakfast.cost;
    if (meals.lunch) total += meals.lunch.cost;
    if (meals.dinner) total += meals.dinner.cost;
    return total;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendar Meal Planner</h1>
            <p className="text-gray-600">Plan your meals in advance and manage your budget effectively</p>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={previousMonth}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="bg-white text-yellow-600 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition flex items-center gap-2 ml-2">
                    <Sparkles className="w-4 h-4" />
                    AI Generate
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-white font-semibold text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const meals = getMealsForDay(day);
                  const totalCost = getTotalCostForDay(day);
                  const hasMeals = meals !== null;

                  return (
                    <div
                      key={index}
                      className={`min-h-32 border-2 rounded-xl p-3 transition ${
                        day === null 
                          ? 'bg-gray-50 border-gray-100' 
                          : isToday(day)
                          ? 'border-yellow-400 bg-yellow-50'
                          : hasMeals
                          ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400 cursor-pointer'
                          : 'border-gray-200 hover:border-yellow-300 cursor-pointer'
                      }`}
                      onClick={() => day && setSelectedDate(day)}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold ${isToday(day) ? 'text-yellow-600' : 'text-gray-700'}`}>
                              {day}
                            </span>
                            {!hasMeals && (
                              <button className="text-gray-400 hover:text-yellow-500 transition">
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {hasMeals && meals && (
                            <div className="space-y-1">
                              {meals.breakfast && (
                                <div className="bg-white rounded px-2 py-1">
                                  <p className="text-xs font-semibold text-gray-700 truncate">{meals.breakfast.name}</p>
                                </div>
                              )}
                              {meals.lunch && (
                                <div className="bg-white rounded px-2 py-1">
                                  <p className="text-xs font-semibold text-gray-700 truncate">{meals.lunch.name}</p>
                                </div>
                              )}
                              {meals.dinner && (
                                <div className="bg-white rounded px-2 py-1">
                                  <p className="text-xs font-semibold text-gray-700 truncate">{meals.dinner.name}</p>
                                </div>
                              )}
                              <div className="mt-2 text-xs font-bold text-yellow-600">
                                ₱{totalCost.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 rounded-full p-2">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Weekly Budget</p>
                  <p className="text-xl font-bold text-gray-800">₱{weeklyBudget.toFixed(2)}</p>
                </div>
              </div>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Save Plan
              </button>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500 rounded-full p-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-800">Plan Ahead</h3>
              </div>
              <p className="text-sm text-gray-600">Schedule meals for the week to save time and money</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500 rounded-full p-2">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">AI Suggestions</h3>
              </div>
              <p className="text-sm text-gray-600">Let AI create balanced meal plans based on your preferences</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500 rounded-full p-2">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Budget Tracking</h3>
              </div>
              <p className="text-sm text-gray-600">Monitor your spending and stay within budget</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}