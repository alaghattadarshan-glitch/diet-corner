// frontend/src/components/FoodMakerOrderDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckSquare, ShieldCheck, Tag, Info, AlertOctagon, CheckCircle2, PackageCheck } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

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
  const [collectedItems, setCollectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Checklist checked array
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const station = localStorage.getItem('operations_active_station') || 'maker_01';
        let kitchenId = 'BLR-KITCHEN-01';
        if (station === 'maker_02') {
          kitchenId = 'BLR-KITCHEN-02';
        }

        const orderRes = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
          headers: {
            'X-Role': station === 'admin' ? 'admin' : 'food_maker',
            'maker_id': station,
            'kitchen_id': kitchenId
          }
        });
        if (!orderRes.ok) throw new Error("Order not found or access denied.");
        const orderData = await orderRes.json();
        setOrder(orderData);
        setCollectedItems(orderData.collected_items || []);
        
        // Parse DB checklist state
        try {
          const parsed = JSON.parse(orderData.checklist_state || '[]');
          setChecklist(parsed);
        } catch (e) {
          setChecklist([]);
        }

        const recipeRes = await fetch(`${API_BASE_URL}/api/recipe/detail?order_id=${id}`);
        if (recipeRes.ok) {
          const recipeData = await recipeRes.json();
          setRecipe(recipeData);
        }

        const invRes = await fetch(`${API_BASE_URL}/api/inventory`);
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
      const station = localStorage.getItem('operations_active_station') || 'maker_01';
      let kitchenId = 'BLR-KITCHEN-01';
      if (station === 'maker_02') {
        kitchenId = 'BLR-KITCHEN-02';
      }

      const res = await fetch(`${API_BASE_URL}/api/food-maker/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Role': station === 'admin' ? 'admin' : 'food_maker',
          'maker_id': station,
          'kitchen_id': kitchenId
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        
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
      const station = localStorage.getItem('operations_active_station') || 'maker_01';
      let kitchenId = 'BLR-KITCHEN-01';
      if (station === 'maker_02') {
        kitchenId = 'BLR-KITCHEN-02';
      }

      await fetch(`${API_BASE_URL}/api/food-maker/orders/${id}/checklist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Role': station === 'admin' ? 'admin' : 'food_maker',
          'maker_id': station,
          'kitchen_id': kitchenId
        },
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

  const handleMarkCollected = async (ingredientId) => {
    try {
      const station = localStorage.getItem('operations_active_station') || 'maker_01';
      let kitchenId = 'BLR-KITCHEN-01';
      if (station === 'maker_02') {
        kitchenId = 'BLR-KITCHEN-02';
      }

      const res = await fetch(`${API_BASE_URL}/api/food-maker/orders/${id}/required-items/${ingredientId}/collect`, {
        method: 'PATCH',
        headers: {
          'X-Role': station === 'admin' ? 'admin' : 'food_maker',
          'maker_id': station,
          'kitchen_id': kitchenId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCollectedItems(data.collected_items || []);
      }
    } catch (err) {
      console.error("Error marking item collected:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-sans">
        <Loader2 className="animate-spin text-[#6D28D9]" size={32} />
        <p className="text-xs text-gray-500 font-bold">Loading recipe assembly sheet...</p>
      </div>
    );
  }

  if (error || !order || !recipe) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 font-sans">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-xl font-black text-gray-900 uppercase">Order Loading Failed</h1>
        <p className="text-xs text-gray-500 font-semibold">{error || 'Order detail is unavailable.'}</p>
        <Link to="/food-maker" className="inline-flex bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs uppercase tracking-wider">
          Return to Terminal
        </Link>
      </div>
    );
  }

  const getIngredientStock = (ingId) => {
    const item = inventory.find(i => i.id === ingId);
    return item ? item.stock_quantity_g : 0;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-gray-800 pb-12">
      
      {/* Navigation breadcrumb */}
      <div className="flex justify-between items-center">
        <Link to="/food-maker" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:underline uppercase tracking-wider">
          <ArrowLeft size={13} />
          <span>Return to Terminal</span>
        </Link>
        <span className="text-xs font-black text-gray-400">Order Ref: #{order.id}</span>
      </div>

      {/* Main assembly sheet layout */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Requirements, Macros, and Stock check */}
        <div className="space-y-6">
          
          {/* Main info card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
            <div>
              <span className="text-[9px] font-black text-[#6D28D9] uppercase tracking-widest block">Operational Ticket</span>
              <h2 className="text-xl font-black text-gray-900">ORDER #{order.id}</h2>
              <span className="text-xs text-gray-500 font-bold block mt-0.5">{order.selected_option_name}</span>
            </div>

            <div className="space-y-2 text-xs font-semibold py-2 border-t border-b border-gray-150 text-gray-700">
              <div className="flex justify-between">
                <span>Dietary:</span>
                <span className="text-gray-900 uppercase font-black">{order.diet_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Prep Mode:</span>
                <span className="bg-[#F3E8FF] text-[#6D28D9] px-2 py-0.5 rounded text-[9px] font-black uppercase">Tier {order.prep_tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px] font-black uppercase text-gray-700">{order.status}</span>
              </div>
            </div>

            {/* Workflow Control Buttons */}
            <div className="pt-2">
              {order.status === 'Received' && (
                <button
                  onClick={() => handleUpdateStatus('Accepted')}
                  className="w-full bg-[#2563EB] text-white text-center py-2.5 rounded-xl font-bold text-xs hover:bg-[#1D4ED8] transition-all shadow-xs uppercase tracking-wider"
                >
                  Accept Order
                </button>
              )}
              {order.status === 'Accepted' && (
                <button
                  onClick={() => handleUpdateStatus('Preparing')}
                  className="w-full bg-[#EA580C] text-white text-center py-2.5 rounded-xl font-bold text-xs hover:bg-[#C2410C] transition-all shadow-xs uppercase tracking-wider"
                >
                  Start Preparation
                </button>
              )}
              {order.status === 'Preparing' && (
                <button
                  onClick={() => handleUpdateStatus('Ready')}
                  className="w-full bg-[#16A34A] text-white text-center py-2.5 rounded-xl font-bold text-xs hover:bg-[#15803D] transition-all shadow-xs uppercase tracking-wider"
                >
                  Mark Ready
                </button>
              )}
              {order.status === 'Ready' && (
                <button
                  onClick={() => handleUpdateStatus('Completed')}
                  className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-center py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs uppercase tracking-wider"
                >
                  Hand to Delivery
                </button>
              )}
              {order.status === 'Completed' && (
                <div className="bg-gray-100 border border-gray-200 text-gray-700 text-center py-2.5 rounded-xl font-bold text-xs">
                  ✓ Meal Dispatched
                </div>
              )}
            </div>
          </div>

          {/* Allergy warnings */}
          {order.allergies && order.allergies.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-red-700 font-black text-xs">
                <AlertOctagon size={16} />
                <span>🚨 ALLERGY ALERT</span>
              </div>
              <p className="text-xs text-red-600 font-bold uppercase leading-relaxed">
                CRITICAL EXCLUSIONS: {order.allergies.join(", ")}
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 text-xs font-black text-emerald-800 text-center">
              ✓ Allergy Check: Clear
            </div>
          )}

          {/* Real-time Inventory Check card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Inventory Stock Check</h3>
            <div className="space-y-2.5">
              {order.components.map((comp, idx) => {
                const stock = getIngredientStock(comp.ingredient_id);
                const hasStockIssue = stock < comp.weight_g;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold pb-2.5 border-b border-gray-100 last:border-0 last:pb-0 text-gray-700">
                    <div className="space-y-0.5">
                      <span className="text-gray-900 block font-bold">{comp.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">Need: {comp.weight_g}g • Stock: {stock.toFixed(0)}g</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      hasStockIssue 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
          
          {/* REQUIRED ITEMS PICK LIST */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                <PackageCheck className="text-[#6D28D9]" size={18} />
                <span>Required Items Pick List</span>
              </h2>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                {collectedItems.length} / {order.components.length} Collected
              </span>
            </div>

            <div className="space-y-3">
              {order.components.map((comp, idx) => {
                const isCollected = collectedItems.includes(comp.ingredient_id);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isCollected
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-gray-900">{comp.name || comp.ingredient_id}</h4>
                      <p className="text-[11px] text-[#6D28D9] font-bold">Portion: {comp.weight_g}g</p>
                    </div>

                    <button
                      onClick={() => handleMarkCollected(comp.ingredient_id)}
                      disabled={isCollected}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5 ${
                        isCollected
                          ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                          : 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] active:scale-95 shadow-xs'
                      }`}
                    >
                      {isCollected ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>COLLECTED</span>
                        </>
                      ) : (
                        <span>MARK COLLECTED</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preparation Guide Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-6">
            
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-150 pb-4">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="text-[#6D28D9]" size={16} />
                <span>🧑‍🍳 Preparation Guide</span>
              </h2>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Grounded Recipe Engine
              </span>
            </div>

            {/* Substitution notice */}
            {order.substitution_applied ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1 text-xs text-amber-800">
                <div className="flex items-center gap-1 font-black">
                  <AlertTriangle size={14} />
                  <span>⚠ Substitution Applied</span>
                </div>
                <p className="font-semibold leading-relaxed">
                  <b>{order.replacement_item}</b> substituted for {order.original_item} because {order.original_item?.toLowerCase()} was out of stock. Similarity: {order.similarity_score}. Recipe has been re-optimized.
                </p>
              </div>
            ) : null}

            {/* Customer custom preferences */}
            {recipe.customer_notes && recipe.customer_notes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1 text-xs">
                <span className="font-black text-amber-800 block uppercase text-[9px]">⚠️ Customer Preparation Notes:</span>
                {recipe.customer_notes.map((note, idx) => (
                  <p key={idx} className="text-amber-700 font-semibold">{note}</p>
                ))}
              </div>
            )}

            {/* Portion scale weights breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Portion Weigh Breakdown</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {recipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex justify-between items-center text-xs font-bold text-gray-700">
                    <div className="space-y-0.5">
                      <span className="text-gray-900 block">{ing.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{ing.preparation}</span>
                    </div>
                    <span className="text-[#6D28D9] font-black text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                      {ing.quantity_g}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI step-by-step instructions */}
            <div className="space-y-3 pt-3 border-t border-gray-150">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">AI Assembly Steps</h3>
              <ol className="space-y-3.5 text-xs text-gray-700 leading-relaxed font-bold list-decimal pl-4">
                {recipe.preparation_steps.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Preparation checklist checkboxes */}
            <div className="space-y-3 pt-6 border-t border-gray-200 bg-gray-50 bg-opacity-50 -mx-6 md:-mx-8 px-6 md:px-8 py-5">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Kitchen Checklist</h3>
              
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
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-0.5 rounded border-gray-300 text-[#6D28D9] focus:ring-[#6D28D9]"
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