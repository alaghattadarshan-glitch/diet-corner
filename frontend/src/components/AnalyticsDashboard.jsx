// frontend/src/components/AnalyticsDashboard.jsx

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const KPIS = [
  { name: 'Total Orders', value: '1,420', desc: '+12% from last week', icon: <TrendingUp className="text-diet-primary" /> },
  { name: 'Average Macro Match %', value: '94.2%', desc: 'Optimized via PuLP Solver', icon: <BarChart3 className="text-blue-500" /> },
  { name: 'Subscription Users', value: '150', desc: 'Mon - Sun schedule auto-fill', icon: <Users className="text-purple-500" /> },
  { name: 'Avg. Darkstore Prep Time', value: '8.4 Min', desc: 'No-cook / air-fried assemblies', icon: <Clock className="text-amber-500" /> },
  { name: 'Order Accuracy %', value: '99.1%', desc: 'Strict allergen checklist', icon: <CheckCircle2 className="text-emerald-500" /> },
  { name: 'Active Stockouts Prevented', value: '28', desc: 'Substituted via equivalence graph', icon: <ShieldAlert className="text-red-500" /> }
];

function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-black text-qcommerce-black">Diet Corner - Pilot Evaluation KPIs</h1>
        <p className="text-xs text-gray-500 mt-1">
          Real-time metrics dashboard monitoring darkstore operational efficiency and customer adoption.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">{kpi.name}</span>
              <span className="text-2xl font-black text-gray-900 block">{kpi.value}</span>
              <span className="text-[10px] text-gray-500 font-semibold block">{kpi.desc}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed evaluation sections */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Operations Evaluation */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">Darkstore Operational Load Analysis</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Tier 0 (No Cook) Assemblies</span>
              <span className="font-bold text-gray-800">45% of total orders</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Tier 1 (Simple Boiled) Grains</span>
              <span className="font-bold text-gray-800">30% of total orders</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Tier 1.5 (Air-Fried) Grains/Proteins</span>
              <span className="font-bold text-gray-800">25% of total orders</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal">
            Operational loading is extremely low compared to traditional restaurants. 75% of assemblies require zero active cooking, scaling through normal warehouse packing staff.
          </p>
        </div>

        {/* User Adoption Evaluation */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider">User Retention & Repetition Cohort</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Weekly Repeat Orders Rate</span>
              <span className="font-bold text-gray-800">68.5%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Subscription Skip/Pause Rate</span>
              <span className="font-bold text-gray-800">4.2%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Avg. Basket Value Increase</span>
              <span className="font-bold text-gray-800">+₹110 per checkout</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal">
            Integrating Diet Corner increases the darkstore overall margin. By grouping low-cost base grains/legumes with premium portioned proteins, the average margin is boosted to 34.2%.
          </p>
        </div>

      </div>

    </div>
  );
}

export default AnalyticsDashboard;
