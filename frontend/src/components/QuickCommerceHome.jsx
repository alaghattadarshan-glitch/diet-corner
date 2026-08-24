// frontend/src/components/QuickCommerceHome.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, ShieldAlert, Sparkles, Zap, Plus } from 'lucide-react';

const CATEGORIES = [
  { name: 'Fruits & Vegetables', image: '🥦', items: '240 items' },
  { name: 'Dairy & Bread', image: '🥛', items: '180 items' },
  { name: 'Protein Specials', image: '🥚', items: '45 items' },
  { name: 'Daily Staples', image: '🍚', items: '150 items' },
  { name: 'Healthy Snacks', image: '🍿', items: '320 items' },
  { name: 'Cold Drinks', image: '🥤', items: '120 items' },
  { name: 'Ready Meals', image: '🍱', items: '95 items' },
];

const POPULAR_PRODUCTS = [
  { name: 'Fresh Organic Paneer', weight: '200 g', price: 90, originalPrice: 110, discount: '-18%', image: '🥛' },
  { name: 'Quick-Cook Rolled Oats', weight: '500 g', price: 140, originalPrice: 160, discount: '-12%', image: '🍚' },
  { name: 'Clean Whey Isolate', weight: '1 scoop', price: 80, originalPrice: 95, discount: '-15%', image: '🥛' },
  { name: 'Raw Almonds Premium', weight: '100 g', price: 120, originalPrice: 150, discount: '-20%', image: '🍿' },
  { name: 'Fresh Chicken Breast', weight: '250 g', price: 150, originalPrice: 180, discount: '-16%', image: '🍗' },
];

function QuickCommerceHome() {
  return (
    <div className="space-y-8 font-sans text-gray-800">
      
      {/* Promotional Hero Section */}
      <div className="bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#4F46E5] text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-10 bottom-0 opacity-10 text-[200px] pointer-events-none select-none">🥦</div>
        <div className="absolute left-1/3 top-0 opacity-5 text-[150px] pointer-events-none select-none">⚡</div>
        
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white bg-opacity-20 border border-white border-opacity-30 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full text-white">
            <Sparkles size={12} className="text-yellow-300 animate-spin" />
            <span>AI DIET PLANNER INTEGRATED</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Healthy food.<br />Delivered fast.
          </h1>
          <p className="text-[#F3E8FF] text-xs md:text-sm font-semibold max-w-md leading-relaxed">
            AI-powered meals matched exactly to your daily nutrition targets. Calculated by PuLP and delivered in 10-15 mins.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/diet-corner/build"
              className="inline-flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all text-xs border border-purple-400 uppercase tracking-wider"
            >
              <span>Build My Meal</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F3E8FF] text-[#6D28D9] border border-[#C4B5FD] font-bold px-6 py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider shadow-sm"
            >
              <span>Shop Groceries</span>
            </button>
          </div>
        </div>
      </div>

      {/* Special AI Diet Corner Banner Card */}
      <div className="bg-[#F3E8FF] bg-opacity-60 border border-[#D8B4FE] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-3 max-w-lg">
          <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest block bg-white border border-[#D8B4FE] px-3 py-1 rounded-full w-max shadow-xs">
            🥗 AI DIET CORNER SPECIALTY
          </span>
          <h2 className="text-xl md:text-2xl font-black text-[#111827] leading-tight">
            Your nutrition. Your meal. Powered by AI.
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold text-[#374151]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#16A34A] font-black">✓</span>
              <span>Personalized Calories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#16A34A] font-black">✓</span>
              <span>Macro Matching Solver</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#16A34A] font-black">✓</span>
              <span>Smart Substitutions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#16A34A] font-black">✓</span>
              <span>AI Recipe Generation</span>
            </div>
          </div>
        </div>
        <Link
          to="/diet-corner/build"
          className="bg-[#6D28D9] text-white text-xs font-bold px-7 py-4 rounded-2xl hover:bg-[#5B21B6] active:scale-95 transition-all shadow-md inline-flex items-center gap-2 w-full md:w-auto text-center justify-center shrink-0 uppercase tracking-wider"
        >
          <span>Build My Meal</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
            <Zap className="text-[#6D28D9] fill-[#6D28D9]" size={16} />
            <span>Shop by Category</span>
          </h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-28 p-3.5 bg-white border border-gray-200 rounded-2xl text-center cursor-pointer hover:border-[#6D28D9] transition-brand card-shadow"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs border border-gray-100">
                {cat.image}
              </div>
              <h3 className="font-bold text-[10px] text-[#111827] leading-tight mt-2.5 truncate">{cat.name}</h3>
              <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">{cat.items}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Grid Section */}
      <div id="shop-section" className="space-y-4 pt-2">
        <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">
          🔥 Trending Groceries & Proteins
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {POPULAR_PRODUCTS.map((prod, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-brand card-shadow hover:border-[#C4B5FD] hover:-translate-y-0.5"
            >
              <div className="relative bg-gray-50 rounded-xl p-6 text-center text-4xl shadow-xs border border-gray-100">
                <span>{prod.image}</span>
                <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                  {prod.discount}
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-[#111827] truncate">{prod.name}</h3>
                <span className="text-[10px] text-[#6B7280] font-medium">{prod.weight}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#111827]">₹{prod.price}</span>
                  <span className="text-[10px] text-[#9CA3AF] line-through">₹{prod.originalPrice}</span>
                </div>
                <button 
                  className="w-8 h-8 flex items-center justify-center bg-[#6D28D9] text-white hover:bg-[#5B21B6] rounded-full transition-all shadow-xs active:scale-90"
                  title="Add product"
                >
                  <Plus size={16} className="text-white font-bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Concept Highlights */}
      <div className="grid md:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-gray-150 card-shadow">
        <div className="flex items-start gap-4">
          <div className="bg-brand-soft p-3 rounded-2xl text-brand-primary border border-brand-soft">
            <Flame size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-xs text-gray-900 uppercase">Darkstore Prep Tiers</h4>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Meals are prepared in simple tiers: Tier 0 (No Cook), Tier 1 (Simple Boiled), and Tier 1.5 (Air-Fried). No full kitchen complexity.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-brand-soft p-3 rounded-2xl text-brand-primary border border-brand-soft">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-xs text-gray-900 uppercase">PuLP Macro Solver</h4>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              We mathematically optimize exact ingredient portion sizes using PuLP linear programming to match your target protein, carbs, and calories.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-brand-soft p-3 rounded-2xl text-brand-primary border border-brand-soft">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-xs text-gray-900 uppercase">Substitution Aware</h4>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Out of stock items are automatically substituted with nutritionally equivalent, dietary-compatible alternatives (e.g., Paneer ➔ Tofu).
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default QuickCommerceHome;
