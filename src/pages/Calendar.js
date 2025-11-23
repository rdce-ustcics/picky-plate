// client/src/pages/Calendar.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Sparkles, DollarSign, X, CheckCircle2, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import BotPng from "../assets/bot.png";
import "./Calendar.css";

const API_BASE = "http://localhost:4000";

// ---------- Helpers ----------
function startOfWeek(d){ const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x; }
function endOfWeek(d){ const s=startOfWeek(d); const e=new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }
function isSameYMD(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function pad2(n){ return String(n).padStart(2,"0"); }
function ymdFromParts(y,m1,d){ return `${y}-${pad2(m1)}-${pad2(d)}`; }
function ymdFromDate(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

function weekStartsInMonth(monthDate){
  const y=monthDate.getFullYear(), m0=monthDate.getMonth();
  const first=new Date(y,m0,1), last=new Date(y,m0+1,0);
  const firstSunday=new Date(first); firstSunday.setDate(first.getDate()-first.getDay());
  const weeks=[]; let cur=new Date(firstSunday);
  while(cur<=last || (cur.getMonth()===m0 && cur.getDate()===1)){
    weeks.push(new Date(cur)); cur=new Date(cur); cur.setDate(cur.getDate()+7);
  }
  return weeks;
}
function ordinal(n){ return `${n}${["th","st","nd","rd"][n%10>3?0:n%100-20? n%10 : 0]}`; }

function uniqueByName(arr){ const s=new Set(); return arr.filter(x=>{ const k=String(x?.name||"").toLowerCase().trim(); if(!k||s.has(k)) return false; s.add(k); return true; }); }
const SLOT_ORDER={ breakfast:0, lunch:1, dinner:2, other:3 };

// Title Case helper (keeps spaces/dashes)
function toTitle(s=""){
  return String(s)
    .toLowerCase()
    .split(/([\s-]+)/)
    .map(part => /[\s-]+/.test(part) ? part : (part.charAt(0).toUpperCase()+part.slice(1)))
    .join("");
}

const MIN_YEAR=2025; const MIN_MONTH0=9; // blocks only past navigation

// ---------- Cute cooking loader ----------
function CookingLoader(){
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <img src={BotPng} alt="AI bot" className="w-20 h-20 bot-bob drop-shadow-md" />
        {/* pan */}
        <div className="mt-6 w-40 h-5 bg-yellow-400/60 rounded-full mx-auto relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-yellow-500/70 rounded"></div>
          <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded"></div>
          {/* steam */}
          <span className="steam" style={{left:"45%", top:"-18px"}} />
          <span className="steam s2" style={{left:"53%", top:"-18px"}} />
          <span className="steam s3" style={{left:"49%", top:"-18px"}} />
        </div>
      </div>

      <p className="mt-6 text-sm text-amber-700">The chef-bot is cooking up unique meals…</p>
    </div>
  );
}

export default function Calendar(){
  const { isAuthenticated, authHeaders } = useAuth();

  // ---------- Initial month ----------
  const now=new Date(); const currentMonth=new Date(now.getFullYear(), now.getMonth(), 1);
  const minMonth=new Date(2025,9,1);
  const [currentDate,setCurrentDate]=useState(currentMonth<minMonth?minMonth:currentMonth);

  // ---------- Selection ----------
  const [selectedWeekStart,setSelectedWeekStart]=useState(null);
  const [selectedDay,setSelectedDay]=useState(null);
  const [hoveredDay,setHoveredDay]=useState(null);
  const [weekIndexInMonth,setWeekIndexInMonth]=useState(0);

  // ---------- Data ----------
  const [mealData,setMealData]=useState({});
  const [showModal,setShowModal]=useState(false);
  const [modalDateKey,setModalDateKey]=useState("");
  const [modalDishes,setModalDishes]=useState([]);

  // AI UI
  const [showAiModal,setShowAiModal]=useState(false);
  const [aiWeekStart,setAiWeekStart]=useState(null);
  const [aiSuggestions,setAiSuggestions]=useState([]);
  const [aiSaving,setAiSaving]=useState(false);
  const [aiLoading,setAiLoading]=useState(false); // loader

  // AI options
  const [showAiOptions,setShowAiOptions]=useState(false);
  const [aiMode,setAiMode]=useState("remainder"); // "remainder" | "week"
  const [aiMonthBase,setAiMonthBase]=useState(()=> new Date(currentMonth));
  const [aiChosenWeekIdx,setAiChosenWeekIdx]=useState(0);
  const [aiBudget, setAiBudget] = useState(""); // NEW: optional weekly budget

  const calendarRef=useRef(null);
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthNamesShort=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ---------- Calendar math ----------
  const firstDay=new Date(currentDate.getFullYear(), currentDate.getMonth(),1);
  const lastDay=new Date(currentDate.getFullYear(), currentDate.getMonth()+1,0);
  const startOffset=firstDay.getDay();
  const daysInMonth=lastDay.getDate();

  const days=useMemo(()=>{
    const d=[]; for(let i=0;i<startOffset;i++) d.push(null); for(let i=1;i<=daysInMonth;i++) d.push(i); return d;
  },[startOffset,daysInMonth]);

  const rows=Math.ceil(days.length/7);
  const today=new Date(); today.setHours(0,0,0,0);

  const isPastDay=(day)=>{ if(!day) return false; const dt=new Date(currentDate.getFullYear(), currentDate.getMonth(), day); dt.setHours(0,0,0,0); return dt<today; };
  const isToday=(day)=>{ if(!day) return false; const dt=new Date(currentDate.getFullYear(), currentDate.getMonth(), day); return isSameYMD(dt,today); };

  const prevDisabled = currentDate.getFullYear()<MIN_YEAR || (currentDate.getFullYear()===MIN_YEAR && currentDate.getMonth()<=MIN_MONTH0);
  const previousMonth=()=>{ if(prevDisabled) return; const nm=new Date(currentDate.getFullYear(), currentDate.getMonth()-1,1); setCurrentDate(nm<minMonth?minMonth:nm); };
  const nextMonth=()=> setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1,1));

  // ---------- Week picker (viewer) ----------
  const weekStarts=useMemo(()=>weekStartsInMonth(currentDate),[currentDate]);
  useEffect(()=>{
    const w=weekStarts; if(!w.length) return;
    const today0=new Date(); today0.setHours(0,0,0,0);
    if (today0.getFullYear()===currentDate.getFullYear() && today0.getMonth()===currentDate.getMonth()){
      const idx=w.findIndex(ws=> today0>=ws && today0<=endOfWeek(ws));
      setWeekIndexInMonth(idx>=0?idx:0);
      setSelectedWeekStart(w[idx>=0?idx:0]);
    } else {
      setWeekIndexInMonth(0); setSelectedWeekStart(w[0]);
    }
  },[currentDate]); // eslint-disable-line

  // ---------- Fetch month data ----------
  useEffect(()=>{
    if(!isAuthenticated) return;
    const y=currentDate.getFullYear(), m0=currentDate.getMonth();
    const start=ymdFromParts(y, m0+1, 1);
    const end=ymdFromParts(y, m0+1, daysInMonth);
    (async ()=>{
      try{
        const res=await fetch(`${API_BASE}/api/mealplans?start=${start}&end=${end}`,{ headers: authHeaders() });
        const data=await res.json();
        if(res.ok && data.success){
          const map={};
          data.items.forEach(it=>{
            const sorted=(it.dishes||[])
              .map(d=> ({ ...d, name: toTitle(d.name||""), source: d.source || undefined }))
              .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
            map[it.date]={ dishes: sorted };
          });
          setMealData(map);
        }
      }catch(e){ console.error(e); }
    })();
  },[currentDate,isAuthenticated,authHeaders,daysInMonth]);

  const openAddModal=(day)=>{
    if(!isAuthenticated){ alert("Please log in to add meals."); return; }
    if(isPastDay(day)) return;
    const key=ymdFromParts(currentDate.getFullYear(), currentDate.getMonth()+1, day);
    const existing=(mealData[key]?.dishes||[]).slice().sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
    setModalDateKey(key);
    setModalDishes(existing.length ? [...existing] : [{ name:"", cost:0, slot:"breakfast" }]);
    setShowModal(true);
  };

  const closeModal=()=>{ setShowModal(false); setModalDateKey(""); setModalDishes([]); };
  const updateDishRow=(i,f,v)=> setModalDishes(prev=> prev.map((d,idx)=> {
    if(idx!==i) return d;
    const val = f==="name" ? toTitle(v) : (f==="cost" ? Number(v) : v);
    return { ...d, [f]: val };
  }));
  const deleteDishRow=(i)=> setModalDishes(prev=> prev.filter((_,idx)=> idx!==i));

  const saveModal=async ()=>{
    const clean = modalDishes
      .filter(d=> d.name && d.cost>=0)
      .map(d=>({ slot:d.slot||"other", name:toTitle(d.name.trim()), cost:Number(d.cost)||0, source:d.source }))
      .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
    if(!clean.length){ alert("Please add at least one dish with valid details."); return; }
    try{
      const res=await fetch(`${API_BASE}/api/mealplans/${encodeURIComponent(modalDateKey)}`,{
        method:"PUT", headers:{ "Content-Type":"application/json", ...authHeaders() }, body: JSON.stringify({ dishes: clean }),
      });
      const data=await res.json();
      if(res.ok && data.success){
        const sorted=(data.plan.dishes||[])
          .map(d=> ({ ...d, name: toTitle(d.name||"") }))
          .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
        setMealData(prev=> ({ ...prev, [modalDateKey]: { dishes: sorted } }));
        closeModal();
      } else alert("Failed to save.");
    } catch(e){ console.error(e); alert("Error saving plan."); }
  };

  // ---------- Week total ----------
  const weekStart=selectedWeekStart || new Date();
  const s=startOfWeek(weekStart), e=endOfWeek(weekStart);
  const weeklyTotal=useMemo(()=>{
    let total=0;
    const y=currentDate.getFullYear(), m0=currentDate.getMonth();
    for(let d=1; d<=daysInMonth; d++){
      const date=new Date(y,m0,d);
      if(date>=s && date<=e){
        const key=ymdFromParts(y,m0+1,d);
        const dishes=(mealData[key]?.dishes||[]);
        dishes.forEach((dish)=> total += Number(dish.cost)||0);
      }
    }
    return total;
  },[mealData,currentDate,s,e,daysInMonth]);

  const handlePrint=()=> window.print();

  // ---------- AI: Options → Fetch → Modal ----------
  const openAiOptionsModal=()=>{
    if(!isAuthenticated){ alert("Please log in to use AI."); return; }
    // reset each time
    setAiSuggestions([]); setAiSaving(false); setAiWeekStart(null); setAiLoading(false);
    setAiMode("remainder");
    setAiMonthBase(new Date(currentDate));
    const today0=new Date(); today0.setHours(0,0,0,0);
    const starts=weekStartsInMonth(currentDate);
    const idx=starts.findIndex(ws=> today0>=ws && today0<=endOfWeek(ws));
    setAiChosenWeekIdx(idx>=0?idx:0);
    setShowAiOptions(true);
  };

  const closeAiOptionsModal=()=> setShowAiOptions(false);

  const runAiGenerate=async ()=>{
    // month weeks from chosen base
    const targetMonthStarts=weekStartsInMonth(aiMonthBase);
    const today0=new Date(); today0.setHours(0,0,0,0);

    let startDate;
    if (aiMode==="remainder") {
      startDate=ymdFromDate(today0);
    } else {
      const ws=targetMonthStarts[aiChosenWeekIdx] || targetMonthStarts[0];
      startDate=ymdFromDate(ws);
    }

    // open modal + show loader; hard reset suggestions each press
    setAiSuggestions([]);
    const base=new Date(`${startDate}T00:00:00`);
    setAiWeekStart(base);
    setShowAiModal(true);
    setShowAiOptions(false);
    setAiLoading(true);

    const normalizePlan = (plan) => (plan||[]).map(day=>{
      const withSource=(day.dishes||[]).map(d=> ({ ...d, source:"ai", name: toTitle(d.name||"") }));
      const ordered=uniqueByName(withSource).sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
      return { ...day, dishes: ordered };
    });

    try{
      // First try: real AI
        const res=await fetch(`${API_BASE}/api/ai/suggest-week`,{
          method:"POST",
          headers:{ "Content-Type":"application/json", ...authHeaders() },
          body: JSON.stringify({
            startDate,
            mode: aiMode,
            budget: aiBudget ? Number(aiBudget) : undefined,
          }),
        });
      const data=await res.json();

      if(res.ok && data.success){
        setAiSuggestions(normalizePlan(data.plan));
      } else if (data?.error === "ai_down") {
        // Offer random fallback
        const yes = window.confirm(data.message || "Our AI seems to be down right now... We can still generate completely random recipes if you want?");
        if (yes) {
          const r2 = await fetch(`${API_BASE}/api/ai/suggest-week`,{
            method:"POST",
            headers:{ "Content-Type":"application/json", ...authHeaders() },
            body: JSON.stringify({
              startDate,
              mode: aiMode,
              fallback: "random",
              budget: aiBudget ? Number(aiBudget) : undefined,
            }),
          });
          const d2 = await r2.json();
          if (r2.ok && d2.success) {
            setAiSuggestions(normalizePlan(d2.plan));
          } else {
            alert("Random generation failed.");
            setShowAiModal(false);
          }
        } else {
          setShowAiModal(false);
        }
      } else {
        alert("AI failed. Please try again.");
        setShowAiModal(false);
      }
    } catch(e){
      console.error(e);
      alert("Network error.");
      setShowAiModal(false);
    } finally {
      setAiLoading(false);
    }
  };

  const updateAiDish=(dayIdx, dishIdx, field, value)=>{
    setAiSuggestions(prev=> prev.map((day,i)=>{
      if(i!==dayIdx) return day;
      const dishes=day.dishes.map((d,j)=> {
        if (j!==dishIdx) return d;
        const val = field==="name" ? toTitle(value) : (field==="cost" ? Number(value) : value);
        return { ...d, [field]: val };
      });
      dishes.sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
      return { ...day, dishes };
    }));
  };
  const addAiDish=(dayIdx)=> setAiSuggestions(prev=> prev.map((day,i)=> i===dayIdx ? {
    ...day, dishes:[...day.dishes, { slot:"other", name:"", cost:0, source:"ai" }]
  } : day));
  const deleteAiDish=(dayIdx, dishIdx)=> setAiSuggestions(prev=> prev.map((day,i)=> i===dayIdx ? {
    ...day, dishes: day.dishes.filter((_,j)=> j!==dishIdx)
  } : day));

  const saveDay=async (dateKey, dishes)=>{
    const clean=dishes
      .filter(d=> d.name && d.cost>=0)
      .map(d=> ({ slot:d.slot||"other", name:toTitle(d.name.trim()), cost:Number(d.cost)||0, source:"ai" }))
      .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
    if(!clean.length) return;
    const res=await fetch(`${API_BASE}/api/mealplans/${encodeURIComponent(dateKey)}`,{
      method:"PUT", headers:{ "Content-Type":"application/json", ...authHeaders() },
      body: JSON.stringify({ dishes: clean }),
    });
    const data=await res.json();
    if(res.ok && data.success){
      const sorted=(data.plan.dishes||[])
        .map(d=> ({ ...d, name: toTitle(d.name||"") }))
        .sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
      setMealData(prev=> ({ ...prev, [dateKey]: { dishes: sorted } }));
    } else throw new Error("save failed");
  };

  const acceptAllAi=async ()=>{
    try{
      setAiSaving(true);
      for(const day of aiSuggestions){
        if(!day.dishes?.length) continue;
        await saveDay(day.dateKey, day.dishes);
      }
      setAiSaving(false);
      setShowAiModal(false);
      setAiSuggestions([]); // reset after save
    }catch(e){
      console.error(e); setAiSaving(false);
      alert("Failed to save some suggestions.");
    }
  };

  const acceptOneDay=async (idx)=>{
    try{
      setAiSaving(true);
      const day=aiSuggestions[idx];
      await saveDay(day.dateKey, day.dishes);
      setAiSaving(false);
      setAiSuggestions(prev=> prev.map((d,i)=> i===idx ? ({ ...d, _saved:true }) : d));
    }catch(e){
      console.error(e); setAiSaving(false);
      alert("Failed to save this day.");
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 print-hide">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Calendar Meal Planner</h1>
            <p className="text-amber-700">Plan your meals in advance and manage your budget effectively</p>
          </div>

          {/* Calendar Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-xl overflow-hidden border border-amber-100 print-wrap print-root">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <div className="flex items-center gap-2 print-hide">
                  <button
                    onClick={previousMonth}
                    disabled={prevDisabled}
                    className={`p-2.5 rounded-xl transition-all ${prevDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-white/90 hover:bg-white text-amber-600 shadow-md hover:shadow-lg"}`}
                    title="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="bg-white/90 hover:bg-white text-amber-600 p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                    title="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* AI Generate opens options modal */}
                  <button
                    onClick={openAiOptionsModal}
                    className="bg-white/95 hover:bg-white text-amber-600 px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 ml-2 shadow-md hover:shadow-lg"
                    title="Generate meal suggestions"
                  >
                    <Sparkles className="w-4 h-4" /> AI Generate
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((d) => (
                  <div key={d} className="text-center text-white font-bold text-sm py-2 drop-shadow-sm">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6 bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: rows }).map((_, rowIdx) =>
                  Array.from({ length: 7 }).map((__, colIdx) => {
                    const day = days[rowIdx * 7 + colIdx];
                    const y = currentDate.getFullYear();
                    const m0 = currentDate.getMonth();
                    const key = day ? ymdFromParts(y, m0 + 1, day) : null;
                    const dishesRaw = key ? (mealData[key]?.dishes || []) : [];
                    const dishes = dishesRaw.slice().sort((a,b)=> (SLOT_ORDER[a.slot]??999)-(SLOT_ORDER[b.slot]??999));
                    const total = dishes.reduce((a, b) => a + (Number(b.cost) || 0), 0);
                    const hasMeals = dishes.length > 0;
                    const past = isPastDay(day);

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onMouseEnter={() => setHoveredDay(day || null)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => {
                          if (!day || past) return;
                          setSelectedDay(day);
                          setSelectedWeekStart(startOfWeek(new Date(y, m0, day)));
                          openAddModal(day); // modal on day click
                        }}
                        className={[
                          "min-h-32 border-2 rounded-2xl p-3 transition-all relative backdrop-blur-sm",
                          !day ? "bg-amber-50/30 border-amber-100/50"
                               : past ? "bg-gray-50/50 border-gray-200/50"
                               : isToday(day) ? "bg-gradient-to-br from-yellow-300 to-amber-300 border-yellow-400 shadow-lg"
                               : hasMeals ? "bg-amber-50/80 border-amber-200 hover:border-amber-400 hover:shadow-md"
                               : "bg-white/60 border-amber-100 hover:border-yellow-300 hover:shadow-md",
                          !past && day && (hoveredDay === day || selectedDay === day) ? "ring-2 ring-yellow-400 shadow-lg scale-[1.02]" : "",
                          day && !past ? "cursor-pointer" : "cursor-default",
                        ].join(" ")}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-bold ${isToday(day) ? "text-amber-900" : "text-amber-800"}`}>{day}</span>
                              {!past && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddModal(day); }}
                                  className="text-amber-400 hover:text-amber-600 hover:bg-amber-100 rounded-full p-1 transition print-hide"
                                  title="Add / Edit meals"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {hasMeals && (
                              <div className="space-y-1.5">
                                {dishes.map((dish, i) => (
                                  <div key={i} className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm border border-amber-100">
                                    <p className="text-xs font-semibold text-amber-900 truncate">
                                      {dish.name}{" "}
                                      <span className="text-[11px] text-amber-600">₱{Number(dish.cost).toFixed(2)}</span>
                                      {dish.source === "ai" && (
                                        <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-amber-800 border border-yellow-200">
                                          <BadgeCheck className="w-3 h-3" /> AI
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                ))}
                                <div className="mt-2 text-xs font-bold text-amber-700 bg-amber-100/50 rounded-lg px-2 py-1 text-center">
                                  ₱{total.toFixed(2)}
                                </div>
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

            {/* Footer with week picker & print */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-5 border-t border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-3 shadow-md">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>

                <div>
                  <p className="text-sm text-amber-700 font-medium">
                    {selectedWeekStart ? "Selected Week Total" : "This Week Total"}
                  </p>
                  <p className="text-2xl font-bold text-amber-900">₱{weeklyTotal.toFixed(2)}</p>
                </div>

                {/* viewer week picker (past weeks disabled) */}
                <div className="print-hide">
                  <label className="text-sm text-amber-700 font-medium mr-2">Week:</label>
                  <select
                    value={weekIndexInMonth}
                    onChange={(e)=>{
                      const idx=Number(e.target.value);
                      const ws=weekStarts[idx];
                      const today0=new Date(); today0.setHours(0,0,0,0);
                      if (endOfWeek(ws) < today0) return; // disallow past weeks
                      setWeekIndexInMonth(idx);
                      setSelectedWeekStart(ws);
                    }}
                    className="px-4 py-2 border-2 border-amber-200 rounded-xl bg-white text-sm font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    {weekStarts.map((ws,i)=>{
                      const today0=new Date(); today0.setHours(0,0,0,0);
                      const isPast=endOfWeek(ws)<today0;
                      return (
                        <option key={i} value={i} disabled={isPast}>
                          {ordinal(i+1)} week ({monthNamesShort[ws.getMonth()]} {ws.getDate()}){isPast?" — past":""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
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

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border-2 border-amber-100" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-6 py-5 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg drop-shadow-sm">Edit Meals – {modalDateKey}</h3>
              <button onClick={closeModal} className="bg-white/90 hover:bg-white rounded-full p-2 transition-all hover:scale-110 shadow-md">
                <X className="w-5 h-5 text-amber-600" />
              </button>
            </div>

            <div className="p-6 space-y-3 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 max-h-[60vh] overflow-auto">
              {modalDishes.map((d,i)=>(
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white/80 rounded-2xl p-4 border-2 border-amber-100 shadow-sm">
                  <select
                    value={d.slot}
                    onChange={(e)=>updateDishRow(i,"slot",e.target.value)}
                    className="sm:col-span-3 px-3 py-2 border-2 border-amber-200 rounded-xl bg-white font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    value={d.name}
                    onChange={(e)=>updateDishRow(i,"name",e.target.value)}
                    className="sm:col-span-6 px-3 py-2 border-2 border-amber-200 rounded-xl font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                    placeholder="Dish name"
                  />

                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="number" step="0.01" value={d.cost}
                      onChange={(e)=>updateDishRow(i,"cost",e.target.value)}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-xl font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="₱0.00"
                    />
                  </div>

                  {d.source === "ai" && (
                    <span className="sm:col-span-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-amber-800 border border-yellow-200">
                      <BadgeCheck className="w-3 h-3"/> AI
                    </span>
                  )}

                  <button
                    onClick={()=>deleteDishRow(i)}
                    className="text-red-600 text-sm hover:underline font-medium sm:col-span-12 sm:justify-self-end hover:text-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}

              <button
                onClick={()=>setModalDishes(prev=>[...prev,{slot:"other",name:"",cost:0,source:undefined}])}
                className="flex items-center gap-2 text-amber-800 bg-amber-100 hover:bg-amber-200 px-5 py-3 rounded-xl border-2 border-amber-200 font-bold transition-all hover:scale-105 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Dish
              </button>
            </div>

            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-t-2 border-amber-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border-2 border-amber-200 hover:bg-amber-50 font-semibold text-amber-800 transition-all">Cancel</button>
              <button onClick={saveModal} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI Options Modal ===== */}
      {showAiOptions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAiOptions(false)}>
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border-2 border-amber-100" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-6 py-5 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg drop-shadow-sm">AI Generate</h3>
              <button onClick={()=>setShowAiOptions(false)} className="bg-white/90 hover:bg-white rounded-full p-2 transition-all hover:scale-110 shadow-md">
                <X className="w-5 h-5 text-amber-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-amber-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="radio" name="aimode" value="remainder" checked={aiMode==="remainder"} onChange={()=>setAiMode("remainder")} className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-900 font-medium">Generate for <strong className="text-amber-700">this week (remainder to Saturday)</strong></span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-amber-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="radio" name="aimode" value="week" checked={aiMode==="week"} onChange={()=>setAiMode("week")} className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-900 font-medium">Generate for a <strong className="text-amber-700">different week</strong></span>
                </label>
              </div>

              {aiMode === "week" && (
                <div className="space-y-3 p-4 bg-white rounded-xl border-2 border-amber-100">
                  {/* Future month picker (next 6 months incl. current) */}
                  <div>
                    <label className="block text-sm text-amber-700 font-bold mb-2">Month:</label>
                    <select
                      value={`${aiMonthBase.getFullYear()}-${aiMonthBase.getMonth()}`}
                      onChange={(e)=>{
                        const [yy,mm]=e.target.value.split("-").map(Number);
                        const dt=new Date(yy,mm,1);
                        setAiMonthBase(dt);
                        setAiChosenWeekIdx(0);
                      }}
                      className="px-4 py-2 border-2 border-amber-200 rounded-xl bg-white w-full font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                    >
                      {Array.from({length:6}).map((_,i)=>{
                        const dt=new Date(); dt.setDate(1); dt.setMonth(dt.getMonth()+i);
                        const v=`${dt.getFullYear()}-${dt.getMonth()}`;
                        return <option key={v} value={v}>{`${dt.getFullYear()} ${monthNames[dt.getMonth()]}`}</option>;
                      })}
                    </select>
                  </div>

                  {/* Week picker for chosen month (past weeks + current midweek disabled) */}
                  <div>
                    <label className="block text-sm text-amber-700 font-bold mb-2">Pick week:</label>
                    <select
                      value={aiChosenWeekIdx}
                      onChange={(e)=>setAiChosenWeekIdx(Number(e.target.value))}
                      className="px-4 py-2 border-2 border-amber-200 rounded-xl bg-white w-full font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
                    >
                      {weekStartsInMonth(aiMonthBase).map((ws,i)=>{
                        const today0=new Date(); today0.setHours(0,0,0,0);
                        const isPast = endOfWeek(ws) < today0;
                        const isThisWeek = today0 >= ws && today0 <= endOfWeek(ws);
                        const disableThisWeek = isThisWeek && !isSameYMD(today0, ws); // if mid-week, force remainder mode
                        return (
                          <option key={i} value={i} disabled={isPast || disableThisWeek}>
                            {ordinal(i+1)} week — starts {monthNamesShort[ws.getMonth()]} {ws.getDate()}
                            {isPast ? " — past" : disableThisWeek ? " — use remainder option" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-amber-600 mt-2 font-medium">If it's mid-week now, use the remainder option for the current week.</p>
                  </div>
                </div>
              )}

            {/* 🔻 NEW: Budget input, always visible (for either mode) */}
            <div>
              <label className="block text-sm text-amber-700 font-bold mb-2">
                Estimated Weekly Budget (₱)
              </label>
              <input
                type="number"
                value={aiBudget}
                onChange={(e) => setAiBudget(e.target.value)}
                placeholder="Optional, e.g. 1500"
                className="px-4 py-2 border-2 border-amber-200 rounded-xl bg-white w-full font-medium text-amber-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>
            </div>
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-t-2 border-amber-100 flex justify-end gap-3">
              <button onClick={()=>setShowAiOptions(false)} className="px-5 py-2.5 rounded-xl border-2 border-amber-200 hover:bg-amber-50 font-semibold text-amber-800 transition-all">Cancel</button>
              <button onClick={runAiGenerate} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105">Generate</button>
            </div>
          </div>
          </div>
      )}

      {/* ===== AI Suggestions Modal + Loader ===== */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAiModal(false)}>
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border-2 border-amber-100" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-6 py-5 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg drop-shadow-sm">
                AI Suggestions {aiWeekStart && <>– Week of {aiWeekStart.getDate()} {monthNamesShort[aiWeekStart.getMonth()]} {aiWeekStart.getFullYear()}</>}
              </h3>
              <button onClick={()=>setShowAiModal(false)} className="bg-white/90 hover:bg-white rounded-full p-2 transition-all hover:scale-110 shadow-md">
                <X className="w-5 h-5 text-amber-600" />
              </button>
            </div>

            {aiLoading ? (
              <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
                <CookingLoader />
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-auto bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
                  {!aiSuggestions.length && (<div className="text-amber-700 font-medium text-center py-8">No suggestions yet.</div>)}

                  {aiSuggestions.map((day, idx) => {
                    const existing = mealData[day.dateKey]?.dishes || [];
                    const conflicted = existing.length > 0;
                    const [y,m1,d] = day.dateKey.split("-").map(Number);
                    const dayTotal = day.dishes.reduce((a,b)=>a+(Number(b.cost)||0),0);

                    return (
                      <div key={day.dateKey} className={`rounded-2xl border-2 p-5 transition-all ${day._saved ? "bg-green-50 border-green-300 shadow-md" : "bg-white/80 border-amber-200 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-bold text-amber-900">
                            {monthNamesShort[m1-1]} {d}, {y}
                            <span className="ml-2 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-yellow-100 text-amber-800 border border-yellow-300 font-semibold">
                              <BadgeCheck className="w-3 h-3" /> AI generated
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">₱{dayTotal.toFixed(2)}</div>
                            <button
                              onClick={()=>acceptOneDay(idx)}
                              disabled={aiSaving || !day.dishes.length}
                              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                                !day.dishes.length ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white hover:scale-105"
                              }`}
                              title="Accept this day"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Accept Day
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {day.dishes.length ? day.dishes.map((dish, j)=>(
                            <div key={j} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-amber-50/50 rounded-xl p-3 border-2 border-amber-100">
                              <select
                                value={dish.slot}
                                onChange={(e)=>updateAiDish(idx,j,"slot",e.target.value)}
                                className="sm:col-span-3 px-3 py-2 border-2 border-amber-200 rounded-xl bg-white font-medium text-amber-800 focus:border-amber-400 transition-all"
                              >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="other">Other</option>
                              </select>
                              <input
                                value={dish.name}
                                onChange={(e)=>updateAiDish(idx,j,"name",e.target.value)}
                                className="sm:col-span-7 px-3 py-2 border-2 border-amber-200 rounded-xl font-medium text-amber-800 focus:border-amber-400 transition-all"
                                placeholder="Dish or item"
                              />
                              <div className="sm:col-span-2 flex items-center gap-2">
                                <input
                                  type="number" step="0.01" value={dish.cost}
                                  onChange={(e)=>updateAiDish(idx,j,"cost",e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-amber-200 rounded-xl font-medium text-amber-800 focus:border-amber-400 transition-all"
                                  placeholder="₱0.00"
                                />
                                <button onClick={()=>deleteAiDish(idx,j)} className="text-red-600 text-sm hover:underline font-medium hover:text-red-700 transition">Delete</button>
                              </div>
                            </div>
                          )) : (<div className="text-sm text-amber-600 font-medium">No suggestions</div>)}

                          <button
                            onClick={()=>addAiDish(idx)}
                            className="mt-3 text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl border-2 border-amber-200 text-sm font-bold transition-all hover:scale-105"
                          >
                            + Add Dish
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-t-2 border-amber-100 flex justify-between items-center">
                  <button onClick={()=>setShowAiModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-amber-200 hover:bg-amber-50 font-semibold text-amber-800 transition-all">Close</button>
                  <button onClick={acceptAllAi} disabled={aiSaving} className={`px-6 py-2.5 rounded-xl font-bold shadow-md transition-all ${aiSaving ? "bg-amber-300 text-white" : "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white hover:scale-105"}`}>
                    {aiSaving ? "Saving…" : "Accept All"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}