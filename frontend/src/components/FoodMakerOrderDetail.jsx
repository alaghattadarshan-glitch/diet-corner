// frontend/src/components/FoodMakerOrderDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckSquare, ShieldCheck, Tag, Info, AlertOctagon } from 'lucide-react';

const SYSTEM_CHECKLIST = [
  "Order accepted",
  "Ingredients collected",
  "Ingredient quantities verified",
  "Allergy checked",
  "Customer notes checked",
  "Preparation completed",
  "Ingredients assembled",
  "Portion verified",
  "Final quality check",
  "Packed"
];

function FoodMakerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checklist checked array/object
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const orderRes = await fetch(`http://127.0.0.1:8000/api/orders/${id}`);
        if (!orderRes.ok) throw new Error("Order not found.");
        const orderData = await orderRes.json();
        setOrder(orderData);
        
        // Parse DB checklist state
        try {
          const parsed = JSON.parse(orderData.checklist_state || '[]');
          setChecklist(parsed);
        } catch (e) {
          setChecklist([]);
        }

        const recipeRes = await fetch(`http://127.0.0.1:8000/api/recipe/detail?order_id=${id}`);
        if (recipeRes.ok) {
          const recipeData = await recipeRes.json();
          setRecipe(recipeData);
        }

        const invRes = await fetch('http://127.0.0.1:8000/api/inventory');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInventory(invData.ingredients || invData || []);
        }
      } catch (err) {
        setError(err.message || 'Error loading details.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        
        // If status changes to accepted, auto check "Order accepted" box
        if (newStatus === 'Accepted' && !checklist.includes("Order accepted")) {
          const updated = [...checklist, "Order accepted"];
          setChecklist(updated);
          await saveChecklist(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveChecklist = async (updatedList) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/food-maker/orders/${id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedList })
      });
    } catch (err) {
      console.error("Error saving checklist:", err);
    }
  };

  const handleToggleCheck = async (item) => {
    let updated;
    if (checklist.includes(item)) {
      updated = checklist.filter(i => i !== item);
    } else {
      updated = [...checklist, item];
    }
    setChecklist(updated);
    await saveChecklist(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Loader2 className="animate-spin text-diet-primary" size={36} />
        <p className="text-sm text-gray-500 font-semibold">Loading recipe assembly sheet...</p>
      </div>
    );
  }

  if (error || !order || !recipe) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-xl font-black text-gray-900">Order Loading Failed</h1>
        <p className="text-xs text-gray-500">{error || 'Order detail is unavailable.'}</p>
        <Link to="/food-maker" className="inline-flex bg-diet-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold">
          Return to Terminal
        </Link>
      </div>
    );
  }

  // Calculate achieved macros
  const achievedProtein = order.components.reduce((acc, c) => acc + (c.protein_g || 0), 0);
  const achievedCarbs = order.components.reduce((acc, c) => acc + (c.carbs_g || 0), 0);
  const achievedCalories = order.components.reduce((acc, c) => acc + (c.calories || 0), 0);

  // Helper to lookup inventory stock
  const getIngredientStock = (ingId) => {
    const item = inventory.find(i => i.id === ingId);
    return item ? item.stock_quantity_g : 0;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-gray-800 pb-12">
      
      {/* Navigation breadcrumb */}
      <div className="flex justify-between items-center">
        <Link to="/food-maker" className="inline-flex items-center gap-1 text-xs font-bold text-diet-primary hover:underline">
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </Link>
        <span className="text-xs font-bold text-gray-500">Order Ref: #{order.id}</span>
      </div>

      {/* Main assembly sheet layout */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Requirements, Macros, and Stock check */}
        <div className="space-y-6">
          
          {/* Main info card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Operational Ticket</span>
              <h2 className="text-xl font-black text-qcommerce-black">ORDER #{order.id}</h2>
              <span className="text-xs text-gray-500 font-bold block mt-0.5">{order.selected_option_name}</span>
            </div>

            <div className="space-y-2 text-xs font-semibold py-2 border-t border-b border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">Dietary:</span>
                <span className="text-qcommerce-black uppercase font-extrabold">{order.diet_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prep Mode:</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-extrabold">Tier {order.prep_tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black uppercase text-gray-700">{order.status}</span>
              </div>
            </div>

            {/* Workflow Control Buttons */}
            <div className="pt-2">
              {order.status === 'Received' && (
                <button
                  onClick={() => handleUpdateStatus('Accepted')}
                  className="w-full bg-red-500 text-white text-center py-2.5 rounded-xl font-black text-xs hover:bg-red-600 transition-colors shadow-sm"
                >
                  Accept Order
                </button>
              )}
              {order.status === 'Accepted' && (
                <button
                  onClick={() => handleUpdateStatus('Preparing')}
                  className="w-full bg-amber-500 text-white text-center py-2.5 rounded-xl font-black text-xs hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Start Preparation
                </button>
              )}
              {order.status === 'Preparing' && (
                <button
                  onClick={() => handleUpdateStatus('Ready')}
                  className="w-full bg-emerald-500 text-white text-center py-2.5 rounded-xl font-black text-xs hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  Mark Ready
                </button>
              )}
              {order.status === 'Ready' && (
                <button
                  onClick={() => handleUpdateStatus('Completed')}
                  className="w-full bg-qcommerce-black text-white text-center py-2.5 rounded-xl font-black text-xs hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Hand to Delivery
                </button>
              )}
              {order.status === 'Completed' && (
                <div className="bg-gray-100 text-gray-500 text-center py-2.5 rounded-xl font-black text-xs">
                  ✓ Meal Dispatched
                </div>
              )}
            </div>
          </div>

          {/* Allergy warnings */}
          {order.allergies.length > 0 ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-red-700 font-black text-xs">
                <AlertOctagon size={16} />
                <span>🚨 ALLERGY ALERT</span>
              </div>
              <p className="text-xs text-red-600 font-bold uppercase">
                CRITICAL EXCLUSIONS REQUIRED: {order.allergies.join(", ")}
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 text-xs font-bold text-emerald-800 text-center">
              ✓ Allergy Check: Clear
            </div>
          )}

          {/* Real-time Inventory Check card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Inventory Stock Verification</h3>
            <div className="space-y-2.5">
              {order.components.map((comp, idx) => {
                const stock = getIngredientStock(comp.ingredient_id);
                const hasStockIssue = stock < comp.weight_g;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-gray-800 block">{comp.name}</span>
                      <span className="text-[10px] text-gray-400">Need: {comp.weight_g}g • Stock: {stock.toFixed(0)}g</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      hasStockIssue 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {hasStockIssue ? '⚠ Stock Issue' : '✓ Available'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: AI Recipe Preparation and portion checklist */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Preparation card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-qcommerce-black flex items-center gap-1">
                <Sparkles className="text-diet-primary" size={18} />
                <span>🧑‍🍳 Preparation Guide</span>
              </h2>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Grounded Recipe Engine
              </span>
            </div>

            {/* Substitution notice */}
            {order.substitution_applied ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs text-amber-800">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle size={14} />
                  <span>⚠ Substitution Applied</span>
                </div>
                <p className="font-semibold leading-relaxed">
                  <b>{order.replacement_item}</b> substituted for {order.original_item} because {order.original_item.toLowerCase()} was out of stock. Similarity: {order.similarity_score}. Recipe has been re-optimized.
                </p>
              </div>
            ) : null}

            {/* Customer custom preferences */}
            {recipe.customer_notes.length > 0 && (
              <div className="bg-yellow-50 bg-opacity-70 border border-yellow-200 rounded-xl p-3.5 space-y-1 text-xs">
                <span className="font-bold text-yellow-800 block uppercase text-[10px]">⚠️ Customer Preparation Notes:</span>
                {recipe.customer_notes.map((note, idx) => (
                  <p key={idx} className="text-yellow-700 font-semibold">{note}</p>
                ))}
              </div>
            )}

            {/* Portion scale weights breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Portion Weigh Checklist</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {recipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-gray-800 block">{ing.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-medium">{ing.preparation}</span>
                    </div>
                    <span className="text-diet-primary font-black text-sm bg-white border border-gray-150 px-2 py-0.5 rounded-lg">
                      {ing.quantity_g}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI step-by-step instructions */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">AI Assembly steps</h3>
              <ol className="space-y-3.5 text-xs text-gray-600 leading-relaxed font-semibold list-decimal pl-4">
                {recipe.preparation_steps.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Preparation checklist checkboxes */}
            <div className="space-y-3 pt-6 border-t border-gray-200 bg-gray-50 bg-opacity-50 -mx-6 md:-mx-8 px-6 md:px-8 py-5">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Kitchen Checklist</h3>
              
              <div className="grid sm:grid-cols-2 gap-2">
                {SYSTEM_CHECKLIST.map((item, idx) => {
                  const isChecked = checklist.includes(item);
                  return (
                    <label
                      key={idx}
                      onClick={() => handleToggleCheck(item)}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-0.5 rounded border-gray-300 text-diet-primary focus:ring-diet-primary"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FoodMakerOrderDetail;
