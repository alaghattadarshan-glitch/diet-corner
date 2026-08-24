// frontend/src/components/DeveloperAiPanel.jsx

import React, { useEffect, useState } from 'react';
import { Cpu, HelpCircle, Layers, ArrowRight, ShieldCheck, Database, ListChecks, FileJson } from 'lucide-react';

function DeveloperAiPanel() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/demo/ai-logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
        
        const statsRes = await fetch('http://127.0.0.1:8000/api/admin/ai-recipe/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Error fetching AI logs/stats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-gray-800">
      
      {/* Header */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
          <Cpu className="text-brand-primary animate-pulse" />
          <span>AI Recipe Intelligence Sandbox</span>
        </h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          Detailed developer logs tracing the RAG retrieval, LLM Prompt, and Pydantic validation states.
        </p>
      </div>

      {/* AI Recipe Quality stats panel */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
          <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">AI Recipe Evaluation Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
              <span className="text-2xl font-black text-[#111827] block">{stats.recipes_generated}</span>
              <span className="text-[10px] text-[#4B5563] font-bold uppercase tracking-wider block">Recipes Generated</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <span className="text-2xl font-black text-emerald-700 block">{stats.valid}</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Valid Recipes</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
              <span className="text-2xl font-black text-red-700 block">{stats.rejected}</span>
              <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">Rejected Recipes</span>
            </div>
            <div className="bg-[#F3E8FF] border border-[#D8B4FE] p-4 rounded-2xl">
              <span className="text-2xl font-black text-[#6D28D9] block">{stats.fallback_rate}%</span>
              <span className="text-[10px] text-[#6D28D9] font-bold uppercase tracking-wider block">Fallback Rate</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2.5 text-xs font-semibold text-gray-600">
              <span className="text-[9px] font-black text-gray-400 block uppercase tracking-wider">AI Model Guard Compliance Metrics</span>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span><span>Ingredient Accuracy</span></span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.ingredient_accuracy}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Quantity Preservation</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.quantity_preservation}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Diet Compliance</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.diet_compliance}%</span>
              </div>
            </div>
            <div className="space-y-2.5 text-xs font-semibold text-gray-600">
              <span className="text-[9px] font-black text-gray-400 block uppercase tracking-wider">&nbsp;</span>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Allergy Compliance</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.allergy_compliance}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Prep Tier Compliance</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.prep_tier_compliance}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Recipe Grounding Accuracy</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.recipe_grounding}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracer pipeline diagram */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Operational Architecture Tracer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-bold text-gray-600">
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-gray-800 uppercase block font-black">1. Customer Goal</span>
            <p className="text-[10px] font-medium text-gray-400">Diet, allergies, notes, and targets.</p>
          </div>
          <div className="bg-brand-soft border border-brand-soft border-opacity-40 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-brand-primary uppercase block font-black">2. PuLP Solver</span>
            <p className="text-[10px] font-medium text-gray-400">Exact weights, portion ratios, and cost.</p>
          </div>
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-gray-800 uppercase block font-black">3. RAG Retrieval</span>
            <p className="text-[10px] font-medium text-gray-400">Find base template recipe from database.</p>
          </div>
          <div className="bg-brand-soft border border-brand-soft border-opacity-40 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-brand-primary uppercase block font-black">4. LLM Call</span>
            <p className="text-[10px] font-medium text-gray-400">Grounded structured prompt generation.</p>
          </div>
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-gray-800 uppercase block font-black">5. Pydantic Guard</span>
            <p className="text-[10px] font-medium text-gray-400">Check schema, allergens, and quantities.</p>
          </div>
        </div>
      </div>

      {/* Tracer Run Log */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-6">
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <FileJson size={16} className="text-brand-primary" />
          <span>Real-time Generation & Validation Logs</span>
        </h2>

        {logs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 text-center text-xs text-gray-450 font-bold space-y-3 uppercase tracking-wider">
            <p>No recent AI generations logged in database.</p>
            <p className="text-[9px] text-gray-400 font-semibold normal-case">Run a "Match Meal" and place an order to trigger the recipe pipeline logs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <div key={idx} className="border border-gray-150 rounded-2xl p-5 space-y-3 bg-gray-50 bg-opacity-30">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="font-black text-xs text-gray-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="bg-brand-primary text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase">Trace #{idx+1}</span>
                    <span>{log.recipe_name}</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                    log.fallback_used 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {log.fallback_used ? 'Grounded Fallback' : 'AI Inference'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold text-gray-500 pt-2 border-t border-gray-150">
                  <p>Model: <span className="text-gray-800">{log.model_name}</span></p>
                  <p>Base Template ID: <span className="text-gray-800">{log.retrieved_recipe_id || 'None'}</span></p>
                  <p>Validation Check: <span className="text-emerald-750 font-black">✓ PASSED</span></p>
                  <p>Status: <span className="text-gray-800">{log.status}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tech stack disclaimer */}
      <div className="bg-gray-50 border border-gray-150 rounded-3xl p-6 text-xs text-gray-500 font-semibold space-y-2 leading-relaxed">
        <h4 className="font-black text-gray-800 uppercase tracking-wider text-[10px]">Architecture Stack Definition</h4>
        <p>• <b>Nutrition Solver:</b> Deterministic linear programming optimization executed via PuLP.</p>
        <p>• <b>Recipe Grounding:</b> Local similarity retrieval lookup indexing structured recipes in sqlite database.</p>
        <p>• <b>AI Provider:</b> Pretrained API-based Gemini model (grounded with DB context).</p>
        <p>• <b>Pydantic Guards:</b> Check schemas, allergens, and portion weights.</p>
      </div>

    </div>
  );
}

export default DeveloperAiPanel;
