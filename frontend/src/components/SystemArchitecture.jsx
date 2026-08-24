// frontend/src/components/SystemArchitecture.jsx

import React from 'react';
import { ArrowDown, Cpu, Database, Landmark, Server, ShoppingBag, Truck, Users, HelpCircle, Layers } from 'lucide-react';

function SystemArchitecture() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-gray-800">
      
      {/* Header */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
          <Layers className="text-brand-primary" />
          <span>System Architecture & Scope</span>
        </h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          Detailed flow architecture of the Diet Corner micro-nutrition darkstore integration.
        </p>
      </div>

      {/* Logical Diagram (Pure Tailwind Flowchart) */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-6">
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Deterministic Processing Pipeline</h2>
        
        <div className="flex flex-col items-center space-y-3">
          
          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              1. Customer Input / Profile Target
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-150 text-gray-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              2. Mifflin-St Jeor Calorie Calculator
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              3. Macro & Calorie Targets
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-150 text-gray-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              4. FastAPI Backend Orchestrator
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              5. SQLite Inventory & Stock Availability Check
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-150 text-gray-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              6. PuLP Constraint Optimization (LP Portions Solve)
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              7. Equivalence Substitution Graph (OOS Swaps)
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-150 text-gray-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              8. RAG Recipe Knowledge Retrieval
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              9. Gemini AI Structured Instructions Generation
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-50 border border-gray-150 text-gray-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              10. Pydantic Safety Guard & exact Quantity validation
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-brand-soft border border-brand-soft border-opacity-40 text-brand-primary px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              11. Food Maker checklist Assembly Workflow
            </div>
            <ArrowDown className="text-gray-300 my-0.5" size={14} />
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase shadow-xs tracking-wider">
              12. Order Dispatch & Delivery Status sync
            </div>
          </div>

        </div>

        {/* Tech Stack Roles */}
        <div className="border-t border-gray-150 pt-6 space-y-4">
          <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider">Core Technology Roles Definition</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold text-gray-650">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">React 19</span>
              User interface state, interactive dashboards, and profile calculator controls.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">FastAPI</span>
              Robust API endpoint routing, schemas parsing, and optimization triggers.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">SQLite</span>
              Persistence for ingredients, schedules, feedback, and AI validation logs.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">PuLP Optimization</span>
              Linear Programming optimization engine solving portion weights based on macro targets.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">RAG Context</span>
              Matches target profiles with verified recipes in the database.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">Gemini AI</span>
              Grounded, step-by-step instruction generation linked to PuLP outputs.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">Pydantic Guard</span>
              Verification safety gate checking ingredient lists and exact weights before kitchen dispatch.
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="font-black text-brand-primary block mb-1">Food Maker Terminal</span>
              Kitchen execution checklist and strict Received → Completed order state transition engine.
            </div>
          </div>
        </div>
      </div>

      {/* Scope Matrix */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Implemented Scope */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-4">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <CheckCircle2 className="text-brand-primary" size={18} />
            <span>Implemented Prototype Scope</span>
          </h3>
          <ul className="space-y-2 text-xs font-bold text-gray-700">
            <li className="flex items-center gap-2">✅ PuLP Constraint-Based Macro Optimization</li>
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
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-4">
          <h3 className="text-sm font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
            <HelpCircle className="text-gray-400" size={18} />
            <span>Future Production Integrations</span>
          </h3>
          <ul className="space-y-2 text-xs font-bold text-gray-400">
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
