// frontend/src/components/DietDashboard.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarRange, Clock, Sparkles, TrendingUp, CheckCircle, Flame, Target } from 'lucide-react';

const RECENT_MEALS = [
  { name: 'Chicken Breast + Brown Rice Bowl', emoji: '🍗', protein: '42g', carbs: '48g', cals: '510 kcal', date: 'Ordered 2 days ago' },
  { name: 'Paneer + Quinoa Bowl', emoji: '🥗', protein: '28g', carbs: '35g', cals: '480 kcal', date: 'Ordered 4 days ago' }
];

function DietDashboard() {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState('custom');

  const handleOrderAgain = (meal) => {
    // Navigate to build page preset with custom macro payload simulated from meal info
    const proteinNum = parseInt(meal.protein);
    const carbsNum = parseInt(meal.carbs);
    const calsNum = parseInt(meal.cals);
    navigate(`/diet-corner/build?preset=custom&protein=${proteinNum}&carbs=${carbsNum}&calories=${calsNum}`);
  };

  return (
    <div className="space-y-8 font-sans text-gray-800 max-w-7xl mx-auto py-4">
      
      {/* Hero Section Fix (Section 5 & 6) */}
      <div className="bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#4F46E5] text-white rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row justify-between items-stretch gap-6 shadow-lg relative overflow-hidden">
        
        {/* Left Side Info & Actions */}
        <div className="flex-1 flex flex-col justify-between space-y-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 border border-white border-opacity-35 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full text-white">
              <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              <span>AI NUTRITION HUB</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Welcome to Diet Corner
            </h1>
            <p className="text-purple-100 text-sm font-semibold max-w-lg leading-relaxed">
              Build meals around YOUR nutrition goals. Calculate your calories. Match your macros. Get AI-generated recipes.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigate('/diet-corner/build?show_calc=true')}
              className="px-5 py-3.5 bg-white text-[#6D28D9] hover:bg-purple-50 active:scale-95 transition-all text-xs font-black rounded-2xl shadow-sm uppercase tracking-wider"
            >
              Calculate My Calories
            </button>
            <Link
              to="/diet-corner/build"
              className="px-5 py-3.5 bg-[#16A34A] text-white hover:bg-emerald-600 active:scale-95 transition-all text-xs font-black rounded-2xl shadow-sm inline-flex items-center gap-2 uppercase tracking-wider"
            >
              <span>Build My Meal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right Side Visual Panel Card (Section 6) */}
        <div className="w-full lg:w-80 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-5 border border-white border-opacity-20 flex flex-col justify-between gap-4 text-white relative z-10 shrink-0">
          <div className="flex justify-between items-center pb-2 border-b border-white border-opacity-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🥗</span>
              <span className="text-xs font-black uppercase tracking-wider">AI MATCH ENGINE</span>
            </div>
            <span className="bg-[#16A34A] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400">
              94% Match
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-purple-100">Nutrition Match</span>
              <span className="font-black">Optimal Plan</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-black">
              <div className="bg-white bg-opacity-10 p-2.5 rounded-xl border border-white border-opacity-10">
                <span className="block text-purple-200 text-[10px] font-bold uppercase">Protein</span>
                <span className="block text-sm text-white mt-0.5">40g</span>
              </div>
              <div className="bg-white bg-opacity-10 p-2.5 rounded-xl border border-white border-opacity-10">
                <span className="block text-purple-200 text-[10px] font-bold uppercase">Calories</span>
                <span className="block text-sm text-white mt-0.5">498 kcal</span>
              </div>
            </div>
          </div>

          <Link
            to="/diet-corner/build"
            className="w-full text-center py-2.5 bg-white text-[#6D28D9] hover:bg-purple-50 rounded-xl text-xs font-black transition-all active:scale-98 shadow-sm block uppercase tracking-wider"
          >
            Build Meal
          </Link>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns - Presets & Today's Recommendation */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Presets Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-md space-y-5">
            <div>
              <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">Quick Macro Presets</h2>
              <p className="text-xs text-[#6B7280] font-semibold mt-1">Select a preset to load targets instantly or configure custom ranges.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* High Protein Card */}
              <Link 
                to="/diet-corner/build?preset=high-protein" 
                onClick={() => setSelectedPreset('high-protein')}
                className={`p-5 rounded-2xl border transition-all text-center flex flex-col justify-between gap-3 ${
                  selectedPreset === 'high-protein' 
                    ? 'bg-[#F3E8FF] border-[#6D28D9] ring-2 ring-[#6D28D9] scale-102 shadow-md' 
                    : 'bg-white border-[#E5E7EB] hover:border-[#6D28D9] hover:bg-[#F3E8FF] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-2xl">🥩</span>
                  {selectedPreset === 'high-protein' ? (
                    <span className="bg-[#6D28D9] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </div>
                <div>
                  <span className={`block text-xs font-black uppercase tracking-wide ${selectedPreset === 'high-protein' ? 'text-[#6D28D9]' : 'text-[#111827]'}`}>High Protein</span>
                  <span className="text-[10px] text-[#4B5563] font-bold block mt-1">45g Protein</span>
                  <span className="text-[10px] text-[#6B7280] font-semibold block">35g Carbs</span>
                </div>
              </Link>

              {/* Low Carb Card */}
              <Link 
                to="/diet-corner/build?preset=low-carb" 
                onClick={() => setSelectedPreset('low-carb')}
                className={`p-5 rounded-2xl border transition-all text-center flex flex-col justify-between gap-3 ${
                  selectedPreset === 'low-carb' 
                    ? 'bg-[#F3E8FF] border-[#6D28D9] ring-2 ring-[#6D28D9] scale-102 shadow-md' 
                    : 'bg-white border-[#E5E7EB] hover:border-[#6D28D9] hover:bg-[#F3E8FF] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-2xl">🥑</span>
                  {selectedPreset === 'low-carb' ? (
                    <span className="bg-[#6D28D9] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </div>
                <div>
                  <span className={`block text-xs font-black uppercase tracking-wide ${selectedPreset === 'low-carb' ? 'text-[#6D28D9]' : 'text-[#111827]'}`}>Low Carb</span>
                  <span className="text-[10px] text-[#4B5563] font-bold block mt-1">35g Protein</span>
                  <span className="text-[10px] text-[#6B7280] font-semibold block">15g Carbs</span>
                </div>
              </Link>

              {/* Maintenance Card */}
              <Link 
                to="/diet-corner/build?preset=maintenance" 
                onClick={() => setSelectedPreset('maintenance')}
                className={`p-5 rounded-2xl border transition-all text-center flex flex-col justify-between gap-3 ${
                  selectedPreset === 'maintenance' 
                    ? 'bg-[#F3E8FF] border-[#6D28D9] ring-2 ring-[#6D28D9] scale-102 shadow-md' 
                    : 'bg-white border-[#E5E7EB] hover:border-[#6D28D9] hover:bg-[#F3E8FF] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-2xl">🥗</span>
                  {selectedPreset === 'maintenance' ? (
                    <span className="bg-[#6D28D9] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </div>
                <div>
                  <span className={`block text-xs font-black uppercase tracking-wide ${selectedPreset === 'maintenance' ? 'text-[#6D28D9]' : 'text-[#111827]'}`}>Maintenance</span>
                  <span className="text-[10px] text-[#4B5563] font-bold block mt-1">30g Protein</span>
                  <span className="text-[10px] text-[#6B7280] font-semibold block">50g Carbs</span>
                </div>
              </Link>

              {/* Custom Card */}
              <Link 
                to="/diet-corner/build?preset=custom" 
                onClick={() => setSelectedPreset('custom')}
                className={`p-5 rounded-2xl border transition-all text-center flex flex-col justify-between gap-3 ${
                  selectedPreset === 'custom' 
                    ? 'bg-[#F3E8FF] border-[#6D28D9] ring-2 ring-[#6D28D9] scale-102 shadow-md' 
                    : 'bg-white border-[#E5E7EB] hover:border-[#6D28D9] hover:bg-[#F3E8FF] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-2xl">⚙️</span>
                  {selectedPreset === 'custom' ? (
                    <span className="bg-[#6D28D9] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </div>
                <div>
                  <span className={`block text-xs font-black uppercase tracking-wide ${selectedPreset === 'custom' ? 'text-[#6D28D9]' : 'text-[#111827]'}`}>Custom</span>
                  <span className="text-[10px] text-[#4B5563] font-bold block mt-1">Set Targets</span>
                  <span className="text-[10px] text-[#6B7280] font-semibold block">Using Slider</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Today's Recommendation Redesign */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 shadow-md space-y-6">
            <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest block bg-[#F3E8FF] border border-[#D8B4FE] px-3.5 py-1 rounded-full w-max shadow-xs">
              ✨ RECOMMENDED FOR YOU
            </span>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-150">
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#111827] leading-snug">
                  High-Protein Organic Tofu + Quinoa Salad
                </h3>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                    94% nutrition match
                  </span>
                  <span className="bg-[#F3E8FF] text-[#6D28D9] text-[10px] font-black px-2.5 py-0.5 rounded border border-[#D8B4FE] uppercase tracking-wider">
                    ✓ Based on your preferences
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="block text-2xl font-black text-[#111827]">₹249</span>
                <span className="text-[9px] text-[#6B7280] font-bold uppercase block mt-0.5">Delivery in 12 mins</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs font-black text-[#111827]">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-center">
                <span className="block text-lg">🥩</span>
                <span className="block text-[#111827] mt-1">32g Protein</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-center">
                <span className="block text-lg">🍚</span>
                <span className="block text-[#111827] mt-1">45g Carbs</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 text-center">
                <span className="block text-lg">🔥</span>
                <span className="block text-[#111827] mt-1">420 kcal</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center col-span-3 sm:col-span-1">
                <span className="block text-[#16A34A] text-[10px] uppercase font-black">✓ Vegan</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center col-span-3 sm:col-span-1">
                <span className="block text-[#16A34A] text-[10px] uppercase font-black">✓ In Stock</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                to="/diet-corner/build?preset=high-protein"
                className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md text-center inline-block"
              >
                View Meal
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Subscriptions & Recent Meals */}
        <div className="space-y-8">
          
          {/* Subscription Status Card Redesign */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-md space-y-5">
            <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <CalendarRange className="text-[#6D28D9]" size={18} />
              <span>Subscription Status</span>
            </h2>

            <div className="bg-[#F3E8FF] rounded-2xl p-5 border border-[#D8B4FE] space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black text-[#6D28D9] block uppercase tracking-wider">Weekly Macro Planner</span>
                  <span className="text-[9px] text-[#16A34A] font-black inline-flex items-center gap-1 mt-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    ✓ Active Mon – Sun
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[#6B7280] font-bold block uppercase">Planned Rotation</span>
                  <span className="text-xs font-black text-[#111827]">7 meals planned</span>
                </div>
              </div>

              <div className="border-t border-purple-200 pt-3 text-[10px] font-semibold text-[#374151] space-y-1">
                <p><b>Next scheduled meal:</b></p>
                <p className="text-[#111827] font-black">Tomorrow • 1:00 PM</p>
              </div>

              <Link
                to="/diet-corner/subscription"
                className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white w-full text-center py-3 rounded-xl text-xs uppercase tracking-wider block font-bold shadow-md"
              >
                Manage Plan
              </Link>
            </div>
          </div>

          {/* Recent Orders Redesign */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-md space-y-5">
            <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <Clock className="text-[#4B5563]" size={18} />
              <span>Recent Meals</span>
            </h2>

            <div className="space-y-4">
              {RECENT_MEALS.map((meal, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-gray-200 shrink-0">{meal.emoji}</span>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-extrabold text-[#111827] text-xs truncate leading-snug">{meal.name}</h4>
                      <p className="text-[10px] text-[#6B7280] font-bold">{meal.date}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-[10px] font-black">
                    <div className="flex gap-3 text-[#374151]">
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{meal.protein} Protein</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{meal.cals}</span>
                    </div>
                    <button
                      onClick={() => handleOrderAgain(meal)}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider text-[#6D28D9] border border-[#6D28D9] font-bold bg-white hover:bg-[#F3E8FF] transition-all shadow-xs"
                    >
                      Order Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default DietDashboard;
