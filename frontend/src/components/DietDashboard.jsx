// frontend/src/components/DietDashboard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarRange, Clock, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';

const RECENT_MEALS = [
  { name: 'Chicken Breast + Brown Rice Bowl', protein: '42g', carbs: '48g', cals: '510 kcal' },
  { name: 'Paneer + Quinoa Bowl', protein: '28g', carbs: '35g', cals: '480 kcal' }
];

function DietDashboard() {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 bg-diet-light text-diet-primary font-bold text-xs px-2.5 py-1 rounded-full">
            <Sparkles size={12} />
            <span>AI Nutrition Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-qcommerce-black">
            Welcome to <span className="text-diet-primary">Diet Corner</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-lg">
            A dedicated macro-optimized nutrition kitchen integrated directly into your local neighborhood dark store.
          </p>
        </div>
        
        <Link
          to="/diet-corner/build"
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-diet-primary hover:bg-diet-dark text-white font-bold px-6 py-4 rounded-xl shadow-md transition-all group"
        >
          <span>Build My Meal</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid Content */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Col - Presets & Today's Pick */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Presets */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-qcommerce-black">Quick Macro Presets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/diet-corner/build?preset=high-protein" className="p-4 rounded-xl border border-gray-200 hover:border-diet-primary hover:bg-diet-light transition-all text-center">
                <span className="block text-xl">🍗</span>
                <span className="block text-xs font-extrabold mt-1.5 text-gray-800">High Protein</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">P: 45g | C: 35g</span>
              </Link>
              <Link to="/diet-corner/build?preset=low-carb" className="p-4 rounded-xl border border-gray-200 hover:border-diet-primary hover:bg-diet-light transition-all text-center">
                <span className="block text-xl">🥗</span>
                <span className="block text-xs font-extrabold mt-1.5 text-gray-800">Low Carb</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">P: 35g | C: 15g</span>
              </Link>
              <Link to="/diet-corner/build?preset=maintenance" className="p-4 rounded-xl border border-gray-200 hover:border-diet-primary hover:bg-diet-light transition-all text-center">
                <span className="block text-xl">🥑</span>
                <span className="block text-xs font-extrabold mt-1.5 text-gray-800">Maintenance</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">P: 30g | C: 50g</span>
              </Link>
              <Link to="/diet-corner/build?preset=custom" className="p-4 rounded-xl border border-gray-200 hover:border-diet-primary hover:bg-diet-light transition-all text-center">
                <span className="block text-xl">⚙️</span>
                <span className="block text-xs font-extrabold mt-1.5 text-gray-800">Custom</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Set Custom Slider</span>
              </Link>
            </div>
          </div>

          {/* Today's Recommendation Banner */}
          <div className="bg-gradient-to-br from-diet-light to-white rounded-2xl p-6 border border-emerald-200 shadow-sm flex items-start gap-4">
            <div className="bg-diet-primary text-white p-3 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm text-diet-dark">RECOMMENDED TODAY</h3>
              <h4 className="font-extrabold text-base text-qcommerce-black">High-Protein Organic Tofu + Quinoa Salad</h4>
              <p className="text-xs text-gray-500">
                Optimized based on your historical preferences. High in dietary fiber and clean vegan protein.
              </p>
              <div className="flex gap-4 text-xs font-bold text-gray-600 mt-2">
                <span>P: 32g</span>
                <span>C: 45g</span>
                <span>Cal: 420 kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Subscriptions & Recent Meals */}
        <div className="space-y-6">
          {/* Subscription Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-qcommerce-black flex items-center gap-2">
              <CalendarRange className="text-diet-primary" size={20} />
              <span>Subscription Plan</span>
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 block">Weekly Macro Meal Planner</span>
                <span className="text-[10px] text-diet-primary font-bold inline-flex items-center gap-1 mt-1">
                  <CheckCircle size={10} /> Active (Mon - Sun)
                </span>
              </div>
              <Link
                to="/diet-corner/subscription"
                className="bg-diet-primary hover:bg-diet-dark text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
              >
                Manage
              </Link>
            </div>
            <p className="text-[11px] text-gray-400">
              Subscription helps our dark store forecast weekly stock requirement, reducing ingredient waste by 40%.
            </p>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-qcommerce-black flex items-center gap-2">
              <Clock className="text-gray-500" size={20} />
              <span>Recent Meals</span>
            </h2>
            <div className="space-y-3">
              {RECENT_MEALS.map((meal, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0">
                  <div className="space-y-1">
                    <span className="font-extrabold text-gray-800 block">{meal.name}</span>
                    <span className="text-[10px] text-gray-500 block">Ordered 2 days ago</span>
                  </div>
                  <div className="text-right text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    <span>{meal.protein} Prot</span>
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
