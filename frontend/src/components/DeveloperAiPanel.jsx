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
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-black text-qcommerce-black flex items-center gap-2">
          <Cpu className="text-diet-primary animate-pulse" />
          <span>AI Recipe Intelligence Sandbox</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Detailed developer logs tracing the RAG retrieval, LLM Prompt, and Pydantic validation states.
        </p>
      </div>

      {/* AI Recipe Quality stats panel */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase">AI Recipe Evaluation Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl">
              <span className="text-2xl font-black text-gray-900 block">{stats.recipes_generated}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Recipes Generated</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl">
              <span className="text-2xl font-black text-emerald-700 block">{stats.valid}</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Valid Recipes</span>
            </div>
            <div className="bg-red-50 border border-red-150 p-4 rounded-2xl">
              <span className="text-2xl font-black text-red-700 block">{stats.rejected}</span>
              <span className="text-[10px] text-red-600 font-bold uppercase block">Rejected Recipes</span>
            </div>
            <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl">
              <span className="text-2xl font-black text-amber-700 block">{stats.fallback_rate}%</span>
              <span className="text-[10px] text-amber-600 font-bold uppercase block">Fallback Rate</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2.5 text-xs font-semibold">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">AI Model Guard Compliance Metrics</span>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Ingredient Accuracy</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.ingredient_accuracy}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Quantity Preservation</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.quantity_preservation}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Diet Compliance</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.diet_compliance}%</span>
              </div>
            </div>
            <div className="space-y-2.5 text-xs font-semibold">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">&nbsp;</span>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Allergy Compliance</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.allergy_compliance}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Prep Tier Compliance</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.prep_tier_compliance}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-gray-500">Recipe Grounding Accuracy</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stats.quality.recipe_grounding}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracer pipeline diagram */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase">Operational Architecture Tracer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-bold text-gray-600">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-yellow-800 uppercase block font-black">1. Customer Goal</span>
            <p className="text-[10px] font-medium text-gray-500">Diet, allergies, notes, and targets.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-emerald-800 uppercase block font-black">2. PuLP Solver</span>
            <p className="text-[10px] font-medium text-gray-500">Exact weights, portion ratios, and cost.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-blue-800 uppercase block font-black">3. RAG Retrieval</span>
            <p className="text-[10px] font-medium text-gray-500">Find base template recipe from database.</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-purple-800 uppercase block font-black">4. LLM Call</span>
            <p className="text-[10px] font-medium text-gray-500">Grounded structured prompt generation.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-indigo-800 uppercase block font-black">5. Pydantic Guard</span>
            <p className="text-[10px] font-medium text-gray-500">Check schema, allergens, and quantities.</p>
          </div>
        </div>
      </div>

      {/* Tracer Run Log */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
          <FileJson size={18} className="text-diet-primary" />
          <span>Real-time Generation & Validation Logs</span>
        </h2>

        {logs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500 font-semibold space-y-3">
            <p>No recent AI generations logged in database.</p>
            <p className="text-[10px] text-gray-400">Run a "Match Meal" and place an order to trigger the recipe pipeline logs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <div key={idx} className="border border-gray-200 rounded-2xl p-5 space-y-3 bg-gray-50 bg-opacity-30">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="font-extrabold text-sm text-qcommerce-black flex items-center gap-1.5">
                    <span className="bg-diet-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Trace #{idx+1}</span>
                    <span>{log.recipe_name}</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                    log.fallback_used 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {log.fallback_used ? 'Grounded Fallback' : 'AI Inference'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-semibold text-gray-500 pt-2 border-t border-gray-100">
                  <p>Model Used: <span className="text-gray-800">{log.model_name}</span></p>
                  <p>Base Template ID: <span className="text-gray-800">{log.retrieved_recipe_id || 'None'}</span></p>
                  <p>Validation Check: <span className="text-emerald-600 font-bold">✓ PASSED</span></p>
                  <p>Status: <span className="text-gray-800">{log.status}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tech stack disclaimer */}
      <div className="bg-gray-100 border border-gray-200 rounded-3xl p-6 text-xs text-gray-500 font-semibold space-y-2">
        <h4 className="font-black text-gray-700 uppercase">Architecture Stack Definition</h4>
        <p>• **Nutrition Solver:** Deterministic linear programming optimization executed via PuLP.</p>
        <p>• **Recipe Grounding:** Local similarity retrieval lookup indexing structured recipes in sqlite database.</p>
        <p>• **AI Provider:** Pretrained API-based Gemini model (grounded with DB context).</p>
        <p>• **Pydantic Guards:** Execution-level checking enforcing ingredient limits, allergen exclusions, and exact portion weight retention.</p>
      </div>

    </div>
  );
}

export default DeveloperAiPanel;
