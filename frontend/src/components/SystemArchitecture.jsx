// frontend/src/components/SystemArchitecture.jsx

import React from 'react';
import { ArrowDown, Cpu, Database, Landmark, Server, ShoppingBag, Truck, Users, HelpCircle, Layers } from 'lucide-react';

function SystemArchitecture() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-black text-qcommerce-black flex items-center gap-2">
          <Layers className="text-diet-primary" />
          <span>System Architecture & Scope</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Detailed flow architecture of the BlinkDiet micro-nutrition darkstore integration.
        </p>
      </div>

      {/* Logical Diagram (Pure Tailwind Flowchart) */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-800">System Flowchart</h2>
        
        <div className="flex flex-col items-center space-y-4">
          
          {/* Customer Input */}
          <div className="flex flex-col items-center">
            <div className="bg-qcommerce-yellow border border-yellow-400 text-qcommerce-black px-5 py-3 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1.5">
              <Users size={16} />
              <span>CUSTOMER (Selects Diet, Allergies, Macros, Prep, Budget)</span>
            </div>
            <ArrowDown className="text-gray-400 my-1" size={18} />
          </div>

          {/* Quick-Commerce Entry Point */}
          <div className="flex flex-col items-center">
            <div className="bg-qcommerce-black text-white px-5 py-3 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1.5">
              <ShoppingBag size={16} className="text-qcommerce-yellow" />
              <span>QUICK-COMMERCE APP (BlinkDiet / Diet Corner 🥗)</span>
            </div>
            <ArrowDown className="text-gray-400 my-1" size={18} />
          </div>

          {/* AI Diet Corner Logic Box */}
          <div className="border-2 border-diet-primary bg-diet-light bg-opacity-20 rounded-3xl p-6 w-full max-w-2xl space-y-4 shadow-sm relative">
            <div className="absolute top-3 right-3 bg-diet-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
              Implemented Prototype
            </div>
            <div className="text-center font-black text-diet-dark text-xs flex items-center justify-center gap-1.5 mb-2">
              <Cpu size={16} />
              <span>AI NUTRITION CONSTRAINED ENGINE (FastAPI + PuLP)</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white border border-diet-accent rounded-xl p-2 text-[10px] font-extrabold text-gray-700 shadow-sm">
                Inventory Filter
              </div>
              <div className="bg-white border border-diet-accent rounded-xl p-2 text-[10px] font-extrabold text-gray-700 shadow-sm">
                PuLP Optimization
              </div>
              <div className="bg-white border border-diet-accent rounded-xl p-2 text-[10px] font-extrabold text-gray-700 shadow-sm">
                Ranking Service
              </div>
              <div className="bg-white border border-diet-accent rounded-xl p-2 text-[10px] font-extrabold text-gray-700 shadow-sm">
                Substitution Graph
              </div>
            </div>
          </div>
          
          <ArrowDown className="text-gray-400 my-1" size={18} />

          {/* Recommendation & Order Management */}
          <div className="flex flex-col items-center">
            <div className="bg-white border border-gray-200 text-gray-800 px-5 py-3 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1.5">
              <Server size={16} className="text-diet-primary" />
              <span>MEAL RECOMMENDATION & ORDER MANAGEMENT (API Routes)</span>
            </div>
            <ArrowDown className="text-gray-400 my-1" size={18} />
          </div>

          {/* Kitchen Ticket */}
          <div className="flex flex-col items-center">
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-5 py-3 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1.5">
              <ClipboardList size={16} />
              <span>MICRO-DARKSTORE KITCHEN TICKET (Assembly Recipe & Checklist)</span>
            </div>
            <ArrowDown className="text-gray-400 my-1" size={18} />
          </div>

          {/* Delivery */}
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 border border-gray-300 text-gray-500 px-5 py-3 rounded-xl font-extrabold text-xs shadow-sm flex items-center gap-1.5 opacity-70">
              <Truck size={16} />
              <span>DELIVERY RIDER DISPATCH (Future Integration / Partner Platform)</span>
            </div>
          </div>

        </div>

        {/* Separator for subscription planning */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-700 uppercase">Subscriptions & Forecasting pipeline</h3>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-center">
            <div className="bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl border border-purple-200">
              Active Subscriptions Mon-Sun Schedule
            </div>
            <span className="text-gray-400">➔</span>
            <div className="bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl border border-purple-200">
              Aggregated Scheduled Portions
            </div>
            <span className="text-gray-400">➔</span>
            <div className="bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl border border-purple-200">
              Next-Week Demand Forecast
            </div>
            <span className="text-gray-400">➔</span>
            <div className="bg-purple-50 text-purple-700 px-4 py-2.5 rounded-xl border border-purple-200">
              Darkstore Stock Replenishment Planning
            </div>
          </div>
        </div>
      </div>

      {/* Scope Matrix */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Implemented Scope */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-black text-diet-dark flex items-center gap-1.5">
            <CheckCircle2 className="text-diet-primary" size={20} />
            <span>Implemented Prototype Scope</span>
          </h3>
          <ul className="space-y-2 text-xs font-semibold text-gray-700">
            <li className="flex items-center gap-2">✅ PuLP Constrant-Based Macro Optimization</li>
            <li className="flex items-center gap-2">✅ Strict Prep Tier Constraints (Tier 0, 1, 1.5)</li>
            <li className="flex items-center gap-2">✅ Nutritional Equivalency Substitutions & Re-Solves</li>
            <li className="flex items-center gap-2">✅ Diet Type & Multi-Allergen Exclusions</li>
            <li className="flex items-center gap-2">✅ Recent Meal Repetition Score Penalty</li>
            <li className="flex items-center gap-2">✅ Sandbox Live Inventory Control & Stockouts</li>
            <li className="flex items-center gap-2">✅ Warehouse/Darkstore Assembly Tickets</li>
            <li className="flex items-center gap-2">✅ Subscription Demand Forecasting Engine</li>
          </ul>
        </div>

        {/* Future Integration */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-black text-gray-500 flex items-center gap-1.5">
            <HelpCircle className="text-gray-400" size={20} />
            <span>Future Production Integrations</span>
          </h3>
          <ul className="space-y-2 text-xs font-semibold text-gray-400">
            <li className="flex items-center gap-2">⬜ Real-time warehouse inventory database APIs</li>
            <li className="flex items-center gap-2">⬜ Production JWT Auth and Client Profile integrations</li>
            <li className="flex items-center gap-2">⬜ Payment Gateway checkout integration</li>
            <li className="flex items-center gap-2">⬜ GPS Rider location and ETA tracking</li>
            <li className="flex items-center gap-2">⬜ Production ML-driven demand forecasting</li>
            <li className="flex items-center gap-2">⬜ Regional darkstore multi-warehouse node router</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

// Inline replacement for CheckCircle2 to avoid import failure
const CheckCircle2 = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default SystemArchitecture;
