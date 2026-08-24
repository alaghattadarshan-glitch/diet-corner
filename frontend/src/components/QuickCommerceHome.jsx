// frontend/src/components/QuickCommerceHome.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, ShieldAlert, Sparkles, Zap } from 'lucide-react';

const CATEGORIES = [
  { name: 'Vegetables & Fruits', image: '🥦', items: '240 items' },
  { name: 'Dairy, Bread & Eggs', image: '🥛', items: '180 items' },
  { name: 'Cold Drinks & Juices', image: '🥤', items: '120 items' },
  { name: 'Snacks & Munchies', image: '🍿', items: '320 items' },
  { name: 'Instant & Frozen Food', image: '🍜', items: '95 items' },
  { name: 'Meat, Fish & Chicken', image: '🍗', items: '60 items' },
];

function QuickCommerceHome() {
  return (
    <div className="space-y-8">
      {/* Hero Banner for Diet Corner */}
      <div className="bg-gradient-to-r from-diet-dark to-diet-primary text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px]">🥗</div>
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500 bg-opacity-30 border border-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles size={12} className="text-yellow-300" />
            <span>NEW: AI NUTRITION ON DEMAND</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Build your meal around your <span className="text-yellow-300 underline decoration-wavy">Macros</span>.
          </h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium">
            No kitchen needed. We optimize, assemble, and deliver personalized meal combinations in 12 minutes using existing warehouse stock.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/diet-corner"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-qcommerce-black font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm"
            >
              <span>Explore Diet Corner</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/diet-corner/subscription"
              className="inline-flex items-center gap-2 bg-transparent hover:bg-white hover:bg-opacity-10 border-2 border-white text-white font-bold px-5 py-3 rounded-xl transition-all text-sm"
            >
              <span>Subscriptions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Categories Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-qcommerce-black flex items-center gap-2">
          <Zap className="text-yellow-500 fill-yellow-500" size={20} />
          <span>Shop by Category</span>
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Diet Corner Entry Card */}
          <Link
            to="/diet-corner"
            className="flex flex-col items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-diet-primary rounded-2xl text-center group transition-all shadow-sm"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">🥗</span>
            <div className="mt-3">
              <h3 className="font-extrabold text-xs text-diet-dark leading-tight">Diet Corner</h3>
              <p className="text-[10px] text-diet-primary font-bold mt-0.5">Macro Optimized</p>
            </div>
          </Link>

          {CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-between p-4 bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl text-center cursor-pointer group transition-all shadow-sm"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{cat.image}</span>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-gray-800 leading-tight">{cat.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{cat.items}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Concept Differentiator Highlights */}
      <div className="grid md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <Flame size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-900">Darkstore Prep Tiers</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Meals are prepared in simple tiers: Tier 0 (No Cook), Tier 1 (Simple Boiled), and Tier 1.5 (Air-Fried). No full kitchen complexity.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-900">PuLP Macro Solver</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              We mathematically optimize exact ingredient portion sizes using PuLP linear programming to match your target protein, carbs, and calories.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-900">Substitution Aware</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Out of stock items are automatically substituted with nutritionally equivalent, dietary-compatible alternatives (e.g., Paneer $\rightarrow$ Tofu).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickCommerceHome;
