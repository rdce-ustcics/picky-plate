// client/src/pages/Calendar.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, DollarSign, X, CheckCircle2, BadgeCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const API_BASE = "http://localhost:4000";

function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x; }
function endOfWeek(d)   { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }
function isSameYMD(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function ymdFromParts(year, month1, day){ return `${year}-${month1}-${day}`; }

const MIN_YEAR = 2025;
const MIN_MONTH0 = 9; // October

export default function Calendar() {
  const { isAuthenticated, authHeaders } = useAuth();

  // ---------- Print CSS (single-page, landscape, scaled) ----------
  const printCss = `
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .print-hide { display: none !important; }
      .print-wrap { box-shadow: none !important; }
      /* Scale the whole card to fit on one page */
      .print-root { transform: scale(0.85); transform-origin: top left; width: 1180px; }
      .rounded-3xl, .rounded-xl { border-radius: 10px !important; }
      .bg-yellow-50 { background-color: #FFFBEB !important; }
      .bg-yellow-300 { background-color: #FCD34D !important; }
      .bg-yellow-400 { background-color: #FBBF24 !important; }
      .bg-gray-50 { background-color: #F9FAFB !important; }
      .text-gray-800 { color: #1F2937 !important; }
      .text-gray-700 { color: #374151 !important; }
      .text-gray-600 { color: #4B5563 !important; }
      .text-yellow-800 { color: #92400E !important; }
      .ring-2 { box-shadow: none !important; }
    }
  `;

  // ---------- Initial month (>= Oct 2025, else current) ----------
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const minMonth = new Date(2025, 9, 1);
  const [currentDate, setCurrentDate] = useState(currentMonth < minMonth ? minMonth : currentMonth);
  const [selectedWeekStart, setSelectedWeekStart] = useState(null);

  // ---------- Data ----------
  const [mealData, setMealData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalDateKey, setModalDateKey] = useState("");
  const [modalDishes, setModalDishes] = useState([]);

  // AI modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiWeekStart, setAiWeekStart] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSaving, setAiSaving] = useState(false);

  const calendarRef = useRef(null);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ---------- Calendar math ----------
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = useMemo(() => {
    const d = [];
    for (let i=0;i<startOffset;i++) d.push(null);
    for (let i=1;i<=daysInMonth;i++) d.push(i);
    return d;
  }, [startOffset, daysInMonth]);

  const rows = Math.ceil(days.length / 7);
  const today = new Date(); today.setHours(0,0,0,0);

  const isPastDay = (day) => {
    if (!day) return false;
    const dt = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    dt.setHours(0,0,0,0);
    return dt < today;
  };
  const isToday = (day) => {
    if (!day) return false;
    const dt = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return isSameYMD(dt, today);
  };

  const prevDisabled = (currentDate.getFullYear() < MIN_YEAR) ||
    (currentDate.getFullYear() === MIN_YEAR && currentDate.getMonth() <= MIN_MONTH0);

  const previousMonth = () => {
    if (prevDisabled) return;
    const nm = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(nm < minMonth ? minMonth : nm);
  };
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // ---------- Fetch month data ----------
  useEffect(() => {
    if (!isAuthenticated) return;
    const y = currentDate.getFullYear();
    const m0 = currentDate.getMonth();
    const start = `${y}-${m0+1}-1`;
    const end = `${y}-${m0+1}-${daysInMonth}`;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/mealplans?start=${start}&end=${end}`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok && data.success) {
          const map = {};
          data.items.forEach((it) => {
            map[it.date] = { dishes: (it.dishes || []).map(d => ({ ...d, source: d.source || undefined })) };
          });
          setMealData(map);
        }
      } catch (e) { console.error(e); }
    })();
  }, [currentDate, isAuthenticated, authHeaders, daysInMonth]);

  const getMealsForDay = (day) => {
    if (!day) return null;
    const key = ymdFromParts(currentDate.getFullYear(), currentDate.getMonth()+1, day);
    return mealData[key] || null;
  };

  // ---------- Edit modal ----------
  const openAddModal = (day) => {
    if (!isAuthenticated) { alert("Please log in to add meals."); return; }
    if (isPastDay(day)) return;
    const key = ymdFromParts(currentDate.getFullYear(), currentDate.getMonth()+1, day);
    const existing = mealData[key]?.dishes || [];
    setModalDateKey(key);
    setModalDishes(existing.length ? [...existing] : [{ name:"", cost:0, slot:"breakfast" }]);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setModalDateKey(""); setModalDishes([]); };
  const updateDishRow = (i, f, v) => setModalDishes(prev => prev.map((d,idx)=> idx===i ? { ...d, [f]: f==="cost"?Number(v):v } : d));
  const deleteDishRow = (i) => setModalDishes(prev => prev.filter((_,idx)=> idx!==i));
  const saveModal = async () => {
    const clean = modalDishes.filter(d => d.name && d.cost >= 0).map(d => ({
      slot: d.slot || "other",
      name: d.name.trim(),
      cost: Number(d.cost)||0,
      source: d.source // may be 'ai' if it was originally AI
    }));
    if (!clean.length) { alert("Please add at least one dish with valid details."); return; }
    try {
      const res = await fetch(`${API_BASE}/api/mealplans/${encodeURIComponent(modalDateKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ dishes: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMealData(prev => ({ ...prev, [modalDateKey]: { dishes: data.plan.dishes || [] } }));
        closeModal();
      } else alert("Failed to save.");
    } catch (e) { console.error(e); alert("Error saving plan."); }
  };

  // ---------- Week selection & total ----------
  const weekStart = selectedWeekStart || new Date();
  const s = startOfWeek(weekStart), e = endOfWeek(weekStart);

  const weeklyTotal = useMemo(() => {
    let total = 0;
    const y = currentDate.getFullYear();
    const m0 = currentDate.getMonth();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m0, d);
      if (date >= s && date <= e) {
        const key = ymdFromParts(y, m0+1, d);
        const dishes = mealData[key]?.dishes || [];
        dishes.forEach((dish) => total += Number(dish.cost) || 0);
      }
    }
    return total;
  }, [mealData, currentDate, s, e, daysInMonth]);

  // ---------- Printing ----------
  const handlePrint = () => window.print();

  // ---------- AI Suggestions ----------
  const openAiModal = async () => {
    if (!isAuthenticated) { alert("Please log in to use AI."); return; }
    const base = new Date(); base.setHours(0,0,0,0); // start today
    setAiWeekStart(base);
    setShowAiModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest-week`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ startDate: base.toISOString().slice(0,10) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiSuggestions(
          (data.plan || []).map(day => ({
            ...day,
            dishes: (day.dishes || []).map(d => ({ ...d, source: "ai" }))
          }))
        );
      } else {
        alert("AI failed. Please try again.");
        setShowAiModal(false);
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
      setShowAiModal(false);
    }
  };
  const closeAiModal = () => { setShowAiModal(false); setAiSuggestions([]); };
  const updateAiDish = (dayIdx, dishIdx, field, value) => {
    setAiSuggestions(prev => prev.map((day,i)=> {
      if (i!==dayIdx) return day;
      const dishes = day.dishes.map((d,j)=> j===dishIdx ? ({ ...d, [field]: field==="cost"?Number(value):value }) : d);
      return { ...day, dishes };
    }));
  };
  const addAiDish = (dayIdx) => setAiSuggestions(prev => prev.map((day,i)=> i===dayIdx ? { ...day, dishes:[...day.dishes, { slot:"other", name:"", cost:0, source:"ai" }] } : day));
  const deleteAiDish = (dayIdx, dishIdx) => setAiSuggestions(prev => prev.map((day,i)=> i===dayIdx ? { ...day, dishes: day.dishes.filter((_,j)=> j!==dishIdx) } : day));

  const saveDay = async (dateKey, dishes) => {
    const clean = dishes.filter(d => d.name && d.cost >= 0).map(d => ({
      slot: d.slot || "other",
      name: d.name.trim(),
      cost: Number(d.cost)||0,
      source: "ai"
    }));
    if (!clean.length) return;
    const res = await fetch(`${API_BASE}/api/mealplans/${encodeURIComponent(dateKey)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ dishes: clean }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setMealData(prev => ({ ...prev, [dateKey]: { dishes: data.plan.dishes || [] } }));
    } else throw new Error('save failed');
  };

  const acceptAllAi = async () => {
    try {
      setAiSaving(true);
      for (const day of aiSuggestions) {
        if (!day.dishes?.length) continue;
        await saveDay(day.dateKey, day.dishes);
      }
      setAiSaving(false);
      setShowAiModal(false);
    } catch (e) {
      console.error(e);
      setAiSaving(false);
      alert("Failed to save some suggestions.");
    }
  };
  const acceptOneDay = async (idx) => {
    try {
      setAiSaving(true);
      const day = aiSuggestions[idx];
      await saveDay(day.dateKey, day.dishes);
      setAiSaving(false);
      setAiSuggestions(prev => prev.map((d,i)=> i===idx ? { ...d, _saved:true } : d));
    } catch (e) {
      console.error(e);
      setAiSaving(false);
      alert("Failed to save this day.");
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{printCss}</style>

      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 print-hide">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendar Meal Planner</h1>
            <p className="text-gray-600">Plan your meals in advance and manage your budget effectively</p>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden print-wrap print-root">
            {/* Calendar Header (no PDF button up here anymore) */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2 print-hide">
                  <button
                    onClick={previousMonth}
                    disabled={prevDisabled}
                    className={`p-2 rounded-lg transition ${prevDisabled ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'}`}
                    title="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition"
                    title="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={openAiModal}
                    className="bg-white text-yellow-600 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition flex items-center gap-2 ml-2"
                    title="Generate 7-day suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Generate
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-white font-semibold text-sm py-2">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: rows }).map((_, rowIdx) =>
                  Array.from({ length: 7 }).map((__, colIdx) => {
                    const day = days[rowIdx * 7 + colIdx];
                    const y = currentDate.getFullYear();
                    const m0 = currentDate.getMonth();
                    const key = day ? ymdFromParts(y, m0+1, day) : null;
                    const dishes = key ? (mealData[key]?.dishes || []) : [];
                    const total = dishes.reduce((a,b)=> a+(Number(b.cost)||0),0);
                    const hasMeals = dishes.length > 0;
                    const past = isPastDay(day);
                    const dt = day ? new Date(y, m0, day) : null;
                    const inSelectedWeek = dt && dt >= startOfWeek(selectedWeekStart || new Date()) && dt <= endOfWeek(selectedWeekStart || new Date());

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => { if (!day || past) return; setSelectedWeekStart(new Date(y, m0, day)); }}
                        className={[
                          "min-h-32 border-2 rounded-xl p-3 transition relative",
                          !day ? "bg-gray-50 border-gray-100" :
                          past ? "bg-gray-50 border-gray-200" :
                          isToday(day) ? "bg-yellow-300 border-yellow-400" :
                          hasMeals ? "bg-yellow-50 border-yellow-200 hover:border-yellow-400" :
                          "border-gray-200 hover:border-yellow-300",
                          inSelectedWeek ? "ring-2 ring-yellow-400" : "",
                          day && !past ? "cursor-pointer" : "cursor-default"
                        ].join(" ")}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-bold ${isToday(day) ? 'text-yellow-800' : 'text-gray-700'}`}>
                                {day}
                              </span>
                              {!past && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddModal(day); }}
                                  className="text-gray-400 hover:text-yellow-500 transition print-hide"
                                  title="Add / Edit meals"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {hasMeals && (
                              <div className="space-y-1">
                                {dishes.map((dish, i) => (
                                  <div key={i} className="bg-white rounded px-2 py-1">
                                    <p className="text-xs font-semibold text-gray-700 truncate">
                                      {dish.name} <span className="text-[11px] text-gray-500">₱{Number(dish.cost).toFixed(2)}</span>
                                      {dish.source === 'ai' && (
                                        <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                          <BadgeCheck className="w-3 h-3" /> AI
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                ))}
                                <div className="mt-2 text-xs font-bold text-yellow-600">₱{total.toFixed(2)}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer with usable PDF button */}
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 rounded-full p-2">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedWeekStart ? "Selected Week Total" : "This Week Total"}
                  </p>
                  <p className="text-xl font-bold text-gray-800">₱{weeklyTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* This is the ONLY print/PDF button now */}
              <button
                onClick={handlePrint}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2"
                title="Print / Save as PDF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Download Plan
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Edit Meals – {modalDateKey}</h3>
              <button onClick={closeModal} className="bg-white/20 hover:bg-white/30 rounded-full p-2"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="p-6 space-y-3">
              {modalDishes.map((d,i)=>(
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <select value={d.slot} onChange={(e)=>updateDishRow(i,"slot",e.target.value)} className="sm:col-span-3 px-3 py-2 border rounded-lg bg-white">
                    <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="other">Other</option>
                  </select>
                  <input value={d.name} onChange={(e)=>updateDishRow(i,"name",e.target.value)} className="sm:col-span-6 px-3 py-2 border rounded-lg" placeholder="Dish name"/>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input type="number" step="0.01" value={d.cost} onChange={(e)=>updateDishRow(i,"cost",e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="₱0.00"/>
                  </div>
                  {d.source === 'ai' && (
                    <span className="sm:col-span-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <BadgeCheck className="w-3 h-3"/> AI
                    </span>
                  )}
                  <button onClick={()=>deleteDishRow(i)} className="text-red-600 text-sm hover:underline sm:col-span-12 sm:justify-self-end">Delete</button>
                </div>
              ))}
              <button onClick={()=>setModalDishes(prev=>[...prev,{slot:"other",name:"",cost:0,source:undefined}])} className="flex items-center gap-2 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-200">
                <Plus className="w-4 h-4" /> Add Dish
              </button>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border hover:bg-gray-100">Cancel</button>
              <button onClick={saveModal} className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold shadow">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeAiModal}>
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                AI Suggestions – Week of {aiWeekStart?.getDate()} {monthNamesShort[aiWeekStart?.getMonth()||0]} {aiWeekStart?.getFullYear()}
              </h3>
              <button onClick={closeAiModal} className="bg-white/20 hover:bg-white/30 rounded-full p-2"><X className="w-5 h-5 text-white" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-auto">
              {!aiSuggestions.length && (<div className="text-gray-600">Generating…</div>)}

              {aiSuggestions.map((day, idx) => {
                const [y,m1,d] = day.dateKey.split('-').map(Number);
                const dateObj = new Date(y, m1-1, d);
                const isPast = dateObj < new Date().setHours(0,0,0,0);
                const dayTotal = day.dishes.reduce((a,b)=>a+(Number(b.cost)||0),0);
                return (
                  <div key={day.dateKey} className={`rounded-2xl border p-4 ${day._saved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-800">
                        {monthNamesShort[m1-1]} {d}, {y} {isPast && <span className="text-xs text-gray-500">(past)</span>}
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <BadgeCheck className="w-3 h-3" /> AI generated
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-yellow-700">₱{dayTotal.toFixed(2)}</div>
                        <button
                          onClick={()=>acceptOneDay(idx)}
                          disabled={aiSaving || isPast || !day.dishes.length}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 ${isPast || !day.dishes.length ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-white'}`}
                          title="Accept this day"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept Day
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.dishes.length ? day.dishes.map((dish, j)=>(
                        <div key={j} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white rounded-xl p-3 border">
                          <select value={dish.slot} onChange={(e)=>updateAiDish(idx,j,"slot",e.target.value)} className="sm:col-span-3 px-3 py-2 border rounded-lg bg-white">
                            <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="other">Other</option>
                          </select>
                          <input value={dish.name} onChange={(e)=>updateAiDish(idx,j,"name",e.target.value)} className="sm:col-span-7 px-3 py-2 border rounded-lg" placeholder="Dish or item"/>
                          <div className="sm:col-span-2 flex items-center gap-2">
                            <input type="number" step="0.01" value={dish.cost} onChange={(e)=>updateAiDish(idx,j,"cost",e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="₱0.00"/>
                            <button onClick={()=>deleteAiDish(idx,j)} className="text-red-600 text-sm hover:underline">Delete</button>
                          </div>
                        </div>
                      )) : (<div className="text-sm text-gray-500">No suggestions (past day)</div>)}
                      {!isPast && (
                        <button onClick={()=>addAiDish(idx)} className="mt-2 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-lg border border-yellow-200 text-sm">
                          + Add Dish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <button onClick={closeAiModal} className="px-4 py-2 rounded-xl border hover:bg-gray-100">Reject All</button>
              <button onClick={acceptAllAi} disabled={aiSaving} className={`px-5 py-2 rounded-xl ${aiSaving ? 'bg-yellow-300' : 'bg-yellow-400 hover:bg-yellow-500'} text-white font-semibold shadow`}>
                {aiSaving ? 'Saving…' : 'Accept All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
