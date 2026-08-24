// frontend/src/components/OrderConfirmation.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, Sparkles, Check, CheckSquare } from 'lucide-react';

const STEPPER = [
  { label: 'Order Received', desc: 'Logged in darkstore system' },
  { label: 'Being Assembled', desc: 'Preparing & weighing portions' },
  { label: 'Packed & Checked', desc: 'Final macro weight confirmation' },
  { label: 'Out for Delivery', desc: 'Rider dispatched (10 mins away)' }
];

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Progress state (0 to 3) for status stepper
  const [currentStep, setCurrentStep] = useState(0);
  const [recipePreview, setRecipePreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}`);
        if (!response.ok) {
          throw new Error('Order not found.');
        }
        const data = await response.json();
        setOrder(data);
        
        // Fetch recipe preview
        try {
          const previewRes = await fetch(`http://127.0.0.1:8000/api/recipe/preview?order_id=${id}`);
          if (previewRes.ok) {
            const previewData = await previewRes.json();
            setRecipePreview(previewData);
          }
        } catch (err) {
          console.error("Error loading recipe preview:", err);
        }
      } catch (err) {
        setError(err.message || 'Error fetching order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStepFromStatus = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s === 'received') return 0;
    if (s === 'accepted' || s === 'preparing') return 1;
    if (s === 'ready') return 2;
    if (s === 'completed') return 3;
    return 0;
  };

  // Poll order status updates in real-time
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
          setCurrentStep(getStepFromStatus(data.status));
        }
      } catch (err) {
        console.error("Error polling order status:", err);
      }
    };
    
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Loader2 className="animate-spin text-diet-primary" size={36} />
        <p className="text-sm text-gray-500 font-semibold">Generating your warehouse kitchen ticket...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-xl font-black text-gray-900">Order Loading Failed</h1>
        <p className="text-xs text-gray-500">{error || 'Order detail is unavailable.'}</p>
        <Link to="/diet-corner" className="inline-flex bg-diet-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold">
          Return to Diet Corner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <Link to="/diet-corner" className="inline-flex items-center gap-1 text-xs font-bold text-diet-primary hover:underline">
        <ArrowLeft size={14} />
        <span>Return to Dashboard</span>
      </Link>

      <div className="grid md:grid-cols-5 gap-8">
        
        {/* Left Side: Order Ticket & Stepper (3 Cols) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Order Header / Success */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-diet-primary">
              <div className="p-1 bg-diet-light rounded-full"><Check size={16} /></div>
              <h1 className="text-xl font-black">Order Placed Successfully!</h1>
            </div>
            <p className="text-xs text-gray-500">
              Your order is routed directly to the micro-assembly table in darkstore warehouse.
            </p>
            <div className="flex justify-between items-center text-xs font-semibold py-2 border-t border-b border-gray-100">
              <span className="text-gray-500">Order ID: <b className="text-qcommerce-black">{order.id}</b></span>
              <span className="text-gray-500">Total Price: <b className="text-qcommerce-black">₹{order.total_price}</b></span>
            </div>
            <div className="pt-2">
              <Link
                to={`/food-maker/orders/${order.id}`}
                className="inline-flex bg-qcommerce-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-all items-center gap-1.5 shadow-sm"
              >
                <span>🧑‍🍳 Open Food Maker Terminal</span>
              </Link>
            </div>
          </div>

          {/* AI Recipe Preview Box */}
          {recipePreview && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="bg-diet-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    AI Recipe Ready
                  </span>
                  <h3 className="text-sm font-bold text-diet-dark">{recipePreview.recipe_name}</h3>
                </div>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="bg-white border border-diet-primary text-diet-primary text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-diet-light transition-all shadow-sm"
                >
                  View AI Recipe
                </button>
              </div>
            </div>
          )}

          {/* Static/Interactive Delivery Stepper */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-gray-700">Real-time Order Status</h2>
            <div className="relative pl-6 space-y-6 border-l border-gray-200">
              {STEPPER.map((step, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                
                return (
                  <div key={idx} className="relative">
                    {/* Stepper Dot */}
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 transition-all ${
                      isActive 
                        ? 'bg-diet-primary border-diet-primary scale-125 ring-4 ring-emerald-100'
                        : isCompleted
                        ? 'bg-diet-primary border-diet-primary'
                        : 'bg-white border-gray-300'
                    }`}>
                      {isCompleted && <Check size={8} className="text-white mx-auto mt-0.5" />}
                    </div>
                    {/* Step Info */}
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-black ${isActive ? 'text-diet-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Kitchen/Warehouse Ticket (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Visual Darkstore Kitchen Ticket */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 shadow-sm space-y-5 font-mono text-xs relative overflow-hidden bg-yellow-50 bg-opacity-30">
            {/* Header branding */}
            <div className="text-center pb-4 border-b border-dashed border-gray-300 space-y-1">
              <span className="font-bold text-sm tracking-wider uppercase">AI Diet Corner</span>
              <span className="block text-[10px] text-gray-500 font-sans">DARKSTORE KITCHEN TICKET</span>
              <span className="block font-black text-sm text-red-500 mt-1">{order.id}</span>
            </div>

            {/* Meta details */}
            <div className="space-y-1 py-1 text-[11px]">
              <p><b>CUSTOMER:</b> Guest User (demo_user)</p>
              <p><b>DIET TYPE:</b> {order.diet_type.toUpperCase()}</p>
              <p><b>ALLERGIES:</b> {order.allergies.length > 0 ? order.allergies.join(", ").toUpperCase() : "NONE"}</p>
              <p><b>PREP TIER:</b> TIER {order.prep_tier}</p>
              <p><b>TARGETS:</b> P:{order.target_protein_g}g C:{order.target_carbs_g}g Cal:{order.target_calories}kcal</p>
              <p><b>ACHIEVED:</b> P:{order.components.reduce((acc, c) => acc + (c.protein_g || 0), 0).toFixed(1)}g C:{order.components.reduce((acc, c) => acc + (c.carbs_g || 0), 0).toFixed(1)}g Cal:{order.components.reduce((acc, c) => acc + (c.calories || 0), 0).toFixed(0)}kcal</p>
            </div>

            {/* Portion recipe checklist */}
            <div className="space-y-2 py-2 border-t border-b border-dashed border-gray-300">
              <span className="font-extrabold block text-center uppercase tracking-wider text-[11px] mb-1">Portion Recipe checklist</span>
              {order.components.map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span>[ ] {comp.name}</span>
                  <span className="font-bold">{comp.weight_g}g</span>
                </div>
              ))}
            </div>

            {/* Custom Notes */}
            {order.notes && (
              <div className="p-2.5 bg-yellow-100 bg-opacity-70 rounded border border-yellow-200 text-[11px]">
                <span className="font-bold block uppercase text-[10px] text-yellow-800">Staff instruction notes:</span>
                <span className="text-gray-700">{order.notes}</span>
              </div>
            )}

            {/* Substitution Log */}
            {order.substitution_applied && (
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-800 font-mono">
                <span className="font-bold block uppercase text-[9px]">SUBSTITUTION:</span>
                <span>{order.original_item} ➔ {order.replacement_item}</span>
                <span className="block mt-0.5 font-semibold">Reason: Out of stock (Similarity: {order.similarity_score})</span>
              </div>
            )}

            {/* Macro Match Percent */}
            <div className="text-center py-2 bg-emerald-50 rounded border border-emerald-100 text-diet-dark text-[11px] font-bold">
              MACRO MATCH: {order.match_percent}% ACHIEVED
            </div>

            {/* Checklist Box */}
            <div className="space-y-1.5 pt-2 text-[10px]">
              <span className="font-bold block uppercase tracking-wider text-gray-500 text-[9px]">Staff Checklist:</span>
              <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-gray-400" /> Portion ingredients on digital scale</p>
              <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-gray-400" /> {order.prep_tier >= 1.5 ? 'Air-fry proteins (no oil)' : order.prep_tier >= 1.0 ? 'Warm up grains/legumes' : 'Cold assembly only'}</p>
              <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-gray-400" /> Assemble bowl container</p>
              <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-gray-400" /> Scan QR barcode for final weight check</p>
              <p className="flex items-center gap-1.5"><CheckSquare size={12} className="text-gray-400" /> Pack in thermal delivery bag & Dispatch</p>
            </div>
            
          </div>

        </div>

      </div>

      {/* Recipe Preview Modal */}
      {showPreviewModal && recipePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-gray-100 shadow-xl font-sans">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-gray-500">AI Customer Recipe Preview</span>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-black text-qcommerce-black">{recipePreview.recipe_name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>Preparation Mode:</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-extrabold">{recipePreview.prep_tier}</span>
              </p>
              <p className="text-xs text-gray-500">
                Ingredients: <b>{recipePreview.ingredients_count} fresh items</b>
              </p>
              <p className="text-xs text-gray-500">
                Method: <b>{recipePreview.preparations.join(" + ")}</b>
              </p>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-xl text-[10px] text-diet-dark leading-relaxed font-semibold">
              ℹ️ Your custom portion ratios are configured dynamically based on PuLP optimization metrics. Full step-by-step assembly recipe instructions are routed directly to the food maker kitchen.
            </div>
            
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full bg-qcommerce-black text-white py-2.5 rounded-xl font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderConfirmation;
