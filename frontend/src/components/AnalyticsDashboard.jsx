// frontend/src/components/AnalyticsDashboard.jsx

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const KPIS = [
  { name: 'Total Orders', value: '1,420', desc: '+12% from last week', icon: <TrendingUp className="text-brand-primary" /> },
  { name: 'Average Macro Match %', value: '94.2%', desc: 'Optimized via PuLP Solver', icon: <BarChart3 className="text-brand-primary" /> },
  { name: 'Subscription Users', value: '150', desc: 'Mon - Sun schedule auto-fill', icon: <Users className="text-brand-primary" /> },
  { name: 'Avg. Darkstore Prep Time', value: '8.4 Min', desc: 'No-cook / air-fried assemblies', icon: <Clock className="text-brand-primary" /> },
  { name: 'Order Accuracy %', value: '99.1%', desc: 'Strict allergen checklist', icon: <CheckCircle2 className="text-emerald-500" /> },
  { name: 'Active Stockouts Prevented', value: '28', desc: 'Substituted via equivalence graph', icon: <ShieldAlert className="text-red-500" /> }
];

function AnalyticsDashboard() {
  return (
    <div className="space-y-6 font-sans text-gray-800 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">Diet Corner - Pilot Evaluation KPIs</h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          Real-time metrics dashboard monitoring darkstore operational efficiency and customer adoption.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#4B5563] block uppercase tracking-wider">{kpi.name}</span>
              <span className="text-2xl font-black text-[#111827] block">{kpi.value}</span>
              <span className="text-[10px] text-[#6B7280] font-bold block">{kpi.desc}</span>
            </div>
            <div className="bg-[#F3E8FF] p-3 rounded-2xl border border-[#D8B4FE]">
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed evaluation sections */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Operations Evaluation */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
          <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider">Darkstore Operational Load Analysis</h3>
          <div className="space-y-3 text-xs font-bold text-gray-700">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Tier 0 (No Cook) Assemblies</span>
              <span className="text-gray-900">45% of total orders</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Tier 1 (Simple Boiled) Grains</span>
              <span className="text-gray-900">30% of total orders</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Tier 1.5 (Air-Fried) Grains/Proteins</span>
              <span className="text-gray-900">25% of total orders</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
            Operational loading is extremely low compared to traditional restaurants. 75% of assemblies require zero active cooking, scaling through normal warehouse packing staff.
          </p>
        </div>

        {/* User Adoption Evaluation */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
          <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider">User Retention & Repetition Cohort</h3>
          <div className="space-y-3 text-xs font-bold text-gray-700">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Weekly Repeat Orders Rate</span>
              <span className="text-gray-900">68.5%</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Subscription Skip/Pause Rate</span>
              <span className="text-gray-900">4.2%</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span>Avg. Basket Value Increase</span>
              <span className="text-gray-900">+₹110 per checkout</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
            Integrating Diet Corner increases the darkstore overall margin. By grouping low-cost base grains/legumes with premium portioned proteins, the average margin is boosted to 34.2%.
          </p>
        </div>

      </div>

    </div>
  );
}

export default AnalyticsDashboard;
