// client/src/pages/Calendar.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Sparkles, DollarSign, X, CheckCircle2, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from "../utils/cache";
import BotPng from "../assets/bot.png";
import "./Calendar.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

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
    <div className="calendar-loader">
      <img src={BotPng} alt="AI bot" className="calendar-loader-bot" />
      <div className="calendar-loader-pan">
        <div className="calendar-loader-pan-top"></div>
        <div className="calendar-loader-pan-handle"></div>
        <span className="steam" style={{left:"45%", top:"-18px"}} />
        <span className="steam s2" style={{left:"53%", top:"-18px"}} />
        <span className="steam s3" style={{left:"49%", top:"-18px"}} />
      </div>
      <p className="calendar-loader-text">The chef-bot is cooking up unique meals…</p>
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
  const [aiLoading,setAiLoading]=useState(false);

  // AI options
  const [showAiOptions,setShowAiOptions]=useState(false);
  const [aiMode,setAiMode]=useState("remainder");
  const [aiMonthBase,setAiMonthBase]=useState(()=> new Date(currentMonth));
  const [aiChosenWeekIdx,setAiChosenWeekIdx]=useState(0);
  const [aiBudget, setAiBudget] = useState("");

  const calendarRef=useRef(null);
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthNamesShort=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dayNamesShort=["S","M","T","W","T","F","S"];

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

  // ---------- Fetch month data (with caching) ----------
  useEffect(()=>{
    if(!isAuthenticated) return;
    const y=currentDate.getFullYear(), m0=currentDate.getMonth();
    const start=ymdFromParts(y, m0+1, 1);
    const end=ymdFromParts(y, m0+1, daysInMonth);
    const cacheKey = CACHE_KEYS.MEAL_PLANS(start, end);

    const cached = getCached(cacheKey);
    if (cached) {
      setMealData(cached);
      return;
    }

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
          setCache(cacheKey, map, CACHE_TTL.MEAL_PLANS);
        }
      }catch(e){ /* console.error(e); */ }
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
        const newMealData = { ...mealData, [modalDateKey]: { dishes: sorted } };
        setMealData(newMealData);
        const y=currentDate.getFullYear(), m0=currentDate.getMonth();
        const start=ymdFromParts(y, m0+1, 1);
        const end=ymdFromParts(y, m0+1, daysInMonth);
        setCache(CACHE_KEYS.MEAL_PLANS(start, end), newMealData, CACHE_TTL.MEAL_PLANS);
        closeModal();
      } else alert("Failed to save.");
    } catch(e){ alert("Error saving plan."); }
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
    const targetMonthStarts=weekStartsInMonth(aiMonthBase);
    const today0=new Date(); today0.setHours(0,0,0,0);

    let startDate;
    if (aiMode==="remainder") {
      startDate=ymdFromDate(today0);
    } else {
      const ws=targetMonthStarts[aiChosenWeekIdx] || targetMonthStarts[0];
      startDate=ymdFromDate(ws);
    }

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
      setMealData(prev=> {
        const newData = { ...prev, [dateKey]: { dishes: sorted } };
        const y=currentDate.getFullYear(), m0=currentDate.getMonth();
        const start=ymdFromParts(y, m0+1, 1);
        const end=ymdFromParts(y, m0+1, daysInMonth);
        setCache(CACHE_KEYS.MEAL_PLANS(start, end), newData, CACHE_TTL.MEAL_PLANS);
        return newData;
      });
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
      setAiSuggestions([]);
    }catch(e){
      setAiSaving(false);
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
      setAiSaving(false);
      alert("Failed to save this day.");
    }
  };

  // Check screen size for responsive day names
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------- UI ----------
  return (
    <div className="calendar-page">
      <main className="calendar-main">
        <div className="calendar-container">
          {/* Header */}
          <div className="calendar-page-header print-hide">
            <h1 className="calendar-page-title">Calendar Meal Planner</h1>
            <p className="calendar-page-subtitle">Plan your meals in advance and manage your budget effectively</p>
          </div>

          {/* Calendar Card */}
          <div className="calendar-card print-wrap print-root">
            {/* Calendar Header */}
            <div className="calendar-header">
              <div className="calendar-header-top">
                <h2 className="calendar-month-title">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>

                <div className="calendar-nav-buttons print-hide">
                  <button
                    onClick={previousMonth}
                    disabled={prevDisabled}
                    className="calendar-nav-btn"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="calendar-nav-btn"
                    title="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={openAiOptionsModal}
                    className="calendar-ai-btn"
                    title="Generate meal suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Generate</span>
                    <span className="sm:hidden">AI</span>
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="calendar-day-names">
                {(isMobile ? dayNamesShort : dayNames).map((d, i) => (
                  <div key={i} className="calendar-day-name">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid-wrapper">
              <div className="calendar-grid">
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

                    let cellClass = "calendar-day-cell";
                    if (!day) cellClass += " empty";
                    else if (past) cellClass += " past";
                    else if (isToday(day)) cellClass += " today";
                    else if (hasMeals) cellClass += " has-meals";
                    else cellClass += " default";
                    
                    if (day && !past && (hoveredDay === day || selectedDay === day)) {
                      cellClass += " hovered";
                    }
                    if (day && !past) cellClass += " clickable";

                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        onMouseEnter={() => setHoveredDay(day || null)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => {
                          if (!day || past) return;
                          setSelectedDay(day);
                          setSelectedWeekStart(startOfWeek(new Date(y, m0, day)));
                          openAddModal(day);
                        }}
                        className={cellClass}
                      >
                        {day && (
                          <>
                            <div className="calendar-day-header">
                              <span className="calendar-day-number">{day}</span>
                              {!past && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openAddModal(day); }}
                                  className="calendar-day-add-btn print-hide"
                                  title="Add / Edit meals"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {hasMeals && (
                              <div className="calendar-day-meals">
                                {dishes.map((dish, i) => (
                                  <div key={i} className="calendar-meal-item">
                                    <p className="calendar-meal-text">
                                      <span className="truncate">{dish.name}</span>
                                      <span className="calendar-meal-cost">₱{Number(dish.cost).toFixed(0)}</span>
                                      {dish.source === "ai" && (
                                        <span className="calendar-meal-ai-badge">
                                          <BadgeCheck className="w-3 h-3" /> AI
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                ))}
                                {dishes.length > 2 && (
                                  <div className="calendar-day-meals-overflow">
                                    +{dishes.length - 2} more
                                  </div>
                                )}
                                <div className="calendar-day-total">
                                  ₱{total.toFixed(0)}
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

            {/* Footer */}
            <div className="calendar-footer">
              <div className="calendar-footer-left">
                <div className="calendar-footer-icon">
                  <DollarSign />
                </div>

                <div>
                  <p className="calendar-footer-total-label">
                    {selectedWeekStart ? "Selected Week" : "This Week"}
                  </p>
                  <p className="calendar-footer-total-value">₱{weeklyTotal.toFixed(2)}</p>
                </div>

                <div className="calendar-week-picker print-hide">
                  <label>Week:</label>
                  <select
                    value={weekIndexInMonth}
                    onChange={(e)=>{
                      const idx=Number(e.target.value);
                      const ws=weekStarts[idx];
                      const today0=new Date(); today0.setHours(0,0,0,0);
                      if (endOfWeek(ws) < today0) return;
                      setWeekIndexInMonth(idx);
                      setSelectedWeekStart(ws);
                    }}
                    className="calendar-week-select"
                  >
                    {weekStarts.map((ws,i)=>{
                      const today0=new Date(); today0.setHours(0,0,0,0);
                      const isPast=endOfWeek(ws)<today0;
                      return (
                        <option key={i} value={i} disabled={isPast}>
                          {ordinal(i+1)} ({monthNamesShort[ws.getMonth()]} {ws.getDate()}){isPast?" — past":""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button onClick={handlePrint} className="calendar-print-btn print-hide" title="Print / Save as PDF">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Download Plan</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="calendar-modal-overlay" onClick={closeModal}>
          <div className="calendar-modal medium" onClick={(e)=>e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3 className="calendar-modal-title">Edit Meals – {modalDateKey}</h3>
              <button onClick={closeModal} className="calendar-modal-close">
                <X />
              </button>
            </div>

            <div className="calendar-modal-body space-y-3">
              {modalDishes.map((d,i)=>(
                <div key={i} className="calendar-dish-row">
                  <select
                    value={d.slot}
                    onChange={(e)=>updateDishRow(i,"slot",e.target.value)}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    value={d.name}
                    onChange={(e)=>updateDishRow(i,"name",e.target.value)}
                    placeholder="Dish name"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={d.cost}
                    onChange={(e)=>updateDishRow(i,"cost",e.target.value)}
                    placeholder="₱0.00"
                  />

                  <button onClick={()=>deleteDishRow(i)} className="calendar-dish-delete">
                    Delete
                  </button>
                </div>
              ))}

              <button
                onClick={()=>setModalDishes(prev=>[...prev,{slot:"other",name:"",cost:0,source:undefined}])}
                className="calendar-add-dish-btn"
              >
                <Plus className="w-4 h-4" /> Add Dish
              </button>
            </div>

            <div className="calendar-modal-footer">
              <button onClick={closeModal} className="calendar-btn calendar-btn-secondary">Cancel</button>
              <button onClick={saveModal} className="calendar-btn calendar-btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI Options Modal ===== */}
      {showAiOptions && (
        <div className="calendar-modal-overlay" onClick={()=>setShowAiOptions(false)}>
          <div className="calendar-modal small" onClick={(e)=>e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3 className="calendar-modal-title">AI Generate</h3>
              <button onClick={()=>setShowAiOptions(false)} className="calendar-modal-close">
                <X />
              </button>
            </div>

            <div className="calendar-modal-body space-y-4">
              <div className="space-y-3">
                <label className="calendar-ai-option">
                  <input type="radio" name="aimode" value="remainder" checked={aiMode==="remainder"} onChange={()=>setAiMode("remainder")} />
                  <span className="calendar-ai-option-text">Generate for <strong>this week (remainder to Saturday)</strong></span>
                </label>
                <label className="calendar-ai-option">
                  <input type="radio" name="aimode" value="week" checked={aiMode==="week"} onChange={()=>setAiMode("week")} />
                  <span className="calendar-ai-option-text">Generate for a <strong>different week</strong></span>
                </label>
              </div>

              {aiMode === "week" && (
                <div className="calendar-ai-subpanel space-y-3">
                  <div>
                    <label>Month:</label>
                    <select
                      value={`${aiMonthBase.getFullYear()}-${aiMonthBase.getMonth()}`}
                      onChange={(e)=>{
                        const [yy,mm]=e.target.value.split("-").map(Number);
                        const dt=new Date(yy,mm,1);
                        setAiMonthBase(dt);
                        setAiChosenWeekIdx(0);
                      }}
                    >
                      {Array.from({length:6}).map((_,i)=>{
                        const dt=new Date(); dt.setDate(1); dt.setMonth(dt.getMonth()+i);
                        const v=`${dt.getFullYear()}-${dt.getMonth()}`;
                        return <option key={v} value={v}>{`${dt.getFullYear()} ${monthNames[dt.getMonth()]}`}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label>Pick week:</label>
                    <select
                      value={aiChosenWeekIdx}
                      onChange={(e)=>setAiChosenWeekIdx(Number(e.target.value))}
                    >
                      {weekStartsInMonth(aiMonthBase).map((ws,i)=>{
                        const today0=new Date(); today0.setHours(0,0,0,0);
                        const isPast = endOfWeek(ws) < today0;
                        const isThisWeek = today0 >= ws && today0 <= endOfWeek(ws);
                        const disableThisWeek = isThisWeek && !isSameYMD(today0, ws);
                        return (
                          <option key={i} value={i} disabled={isPast || disableThisWeek}>
                            {ordinal(i+1)} week — {monthNamesShort[ws.getMonth()]} {ws.getDate()}
                            {isPast ? " — past" : disableThisWeek ? " — use remainder" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <p className="calendar-ai-hint">If it's mid-week, use the remainder option.</p>
                  </div>
                </div>
              )}

              <div className="calendar-ai-subpanel">
                <label>Estimated Weekly Budget (₱)</label>
                <input
                  type="number"
                  value={aiBudget}
                  onChange={(e) => setAiBudget(e.target.value)}
                  placeholder="Optional, e.g. 1500"
                />
              </div>
            </div>

            <div className="calendar-modal-footer">
              <button onClick={()=>setShowAiOptions(false)} className="calendar-btn calendar-btn-secondary">Cancel</button>
              <button onClick={runAiGenerate} className="calendar-btn calendar-btn-primary">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI Suggestions Modal ===== */}
      {showAiModal && (
        <div className="calendar-modal-overlay" onClick={()=>setShowAiModal(false)}>
          <div className="calendar-modal large" onClick={(e)=>e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h3 className="calendar-modal-title">
                AI Suggestions {aiWeekStart && <>– Week of {aiWeekStart.getDate()} {monthNamesShort[aiWeekStart.getMonth()]}</>}
              </h3>
              <button onClick={()=>setShowAiModal(false)} className="calendar-modal-close">
                <X />
              </button>
            </div>

            {aiLoading ? (
              <CookingLoader />
            ) : (
              <>
                <div className="calendar-modal-body space-y-4">
                  {!aiSuggestions.length && (
                    <div className="text-center" style={{color: '#b45309', padding: '2rem'}}>No suggestions yet.</div>
                  )}

                  {aiSuggestions.map((day, idx) => {
                    const [y,m1,d] = day.dateKey.split("-").map(Number);
                    const dayTotal = day.dishes.reduce((a,b)=>a+(Number(b.cost)||0),0);

                    return (
                      <div key={day.dateKey} className={`calendar-ai-day-card ${day._saved ? 'saved' : ''}`}>
                        <div className="calendar-ai-day-header">
                          <div className="calendar-ai-day-date">
                            {monthNamesShort[m1-1]} {d}, {y}
                            <span className="calendar-ai-badge">
                              <BadgeCheck className="w-3 h-3" /> AI generated
                            </span>
                          </div>
                          <div className="calendar-ai-day-actions">
                            <div className="calendar-ai-day-total">₱{dayTotal.toFixed(2)}</div>
                            <button
                              onClick={()=>acceptOneDay(idx)}
                              disabled={aiSaving || !day.dishes.length}
                              className={`calendar-ai-accept-btn ${!day.dishes.length ? 'disabled' : 'enabled'}`}
                              title="Accept this day"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Accept
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {day.dishes.length ? day.dishes.map((dish, j)=>(
                            <div key={j} className="calendar-ai-dish-row">
                              <select
                                value={dish.slot}
                                onChange={(e)=>updateAiDish(idx,j,"slot",e.target.value)}
                              >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="other">Other</option>
                              </select>
                              <input
                                value={dish.name}
                                onChange={(e)=>updateAiDish(idx,j,"name",e.target.value)}
                                placeholder="Dish or item"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={dish.cost}
                                onChange={(e)=>updateAiDish(idx,j,"cost",e.target.value)}
                                placeholder="₱0.00"
                              />
                              <button onClick={()=>deleteAiDish(idx,j)} className="calendar-dish-delete">
                                Delete
                              </button>
                            </div>
                          )) : (
                            <div style={{fontSize: '0.875rem', color: '#d97706'}}>No suggestions</div>
                          )}

                          <button
                            onClick={()=>addAiDish(idx)}
                            className="calendar-add-dish-btn"
                            style={{marginTop: '0.75rem'}}
                          >
                            + Add Dish
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="calendar-modal-footer" style={{justifyContent: 'space-between'}}>
                  <button onClick={()=>setShowAiModal(false)} className="calendar-btn calendar-btn-secondary">Close</button>
                  <button
                    onClick={acceptAllAi}
                    disabled={aiSaving}
                    className="calendar-btn calendar-btn-primary"
                  >
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