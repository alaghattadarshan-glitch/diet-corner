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
        <h2 className="text-lg font-bold text-gray-800">Deterministic Processing Pipeline</h2>
        
        <div className="flex flex-col items-center space-y-3">
          
          <div className="flex flex-col items-center">
            <div className="bg-qcommerce-yellow border border-yellow-400 text-qcommerce-black px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              1. Customer Input / Profile Target
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              2. Mifflin-St Jeor Calorie Calculator
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              3. Macro & Calorie Targets
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              4. FastAPI Backend Orchestrator
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              5. SQLite Inventory & Stock Availability Check
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              6. PuLP Constraint Optimization (LP Portions Solve)
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              7. Equivalence Substitution Graph (OOS Swaps)
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              8. RAG Recipe Knowledge Retrieval
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-pink-50 border border-pink-200 text-pink-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              9. Gemini AI Structured Instructions Generation
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              10. Pydantic Safety Guard & exact Quantity validation
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              11. Food Maker checklist Assembly Workflow
            </div>
            <ArrowDown className="text-gray-400 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-qcommerce-black text-white px-4 py-2 rounded-xl font-extrabold text-[10px] uppercase shadow-xs">
              12. Order Dispatch & Delivery Status sync
            </div>
          </div>

        </div>

        {/* Tech Stack Roles */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-700 uppercase">Core Technology Roles Definition</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-diet-primary block mb-1">React 19</span>
              User interface state, interactive dashboards, and profile calculator controls.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-blue-600 block mb-1">FastAPI</span>
              Robust API endpoint routing, schemas parsing, and optimization triggers.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-emerald-600 block mb-1">SQLite</span>
              Persistence for ingredients, schedules, feedback, and AI validation logs.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-purple-600 block mb-1">PuLP Optimization</span>
              Linear Programming optimization engine solving portion weights based on macro targets.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-indigo-600 block mb-1">RAG Context</span>
              Matches target profiles with verified recipes in the database.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-pink-600 block mb-1">Gemini AI</span>
              Grounded, step-by-step instruction generation linked to PuLP outputs.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-red-600 block mb-1">Pydantic Guard</span>
              Verification safety gate checking ingredient lists and exact weights before kitchen dispatch.
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
              <span className="font-black text-cyan-600 block mb-1">Food Maker Terminal</span>
              Kitchen execution checklist and strict Received → Completed order state transition engine.
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
