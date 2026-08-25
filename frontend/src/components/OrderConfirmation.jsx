// frontend/src/components/OrderConfirmation.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, Sparkles, Check, CheckSquare, XCircle, AlertCircle } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { API_BASE_URL } from '../apiConfig';

const STEPPER = [
  { label: 'Order Received', desc: 'Logged in darkstore system' },
  { label: 'Being Assembled', desc: 'Preparing & weighing portions' },
  { label: 'Packed & Checked', desc: 'Final macro weight confirmation' },
  { label: 'Out for Delivery', desc: 'Rider dispatched (10 mins away)' }
];

function OrderConfirmation() {
  const { id } = useParams();
  const { role, customerId } = useRole();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Progress state (0 to 3) for status stepper
  const [currentStep, setCurrentStep] = useState(0);
  const [recipePreview, setRecipePreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
          headers: {
            'X-Customer-ID': customerId || 'demo_user'
          }
        });
        if (!response.ok) {
          throw new Error('Order not found or access denied.');
        }
        const data = await response.json();
        setOrder(data);
        setCurrentStep(getStepFromStatus(data.status));
        
        // Fetch recipe preview
        try {
          const previewRes = await fetch(`${API_BASE_URL}/api/recipe/preview?order_id=${id}`);
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
        const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
          headers: {
            'X-Customer-ID': customerId || 'demo_user'
          }
        });
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
  }, [id, customerId]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel your order? Inventory reserved for your meal will be released.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'X-Customer-ID': customerId || 'demo_user'
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Unable to cancel order.");
      }
      const data = await res.json();
      setOrder(prev => ({ ...prev, status: 'Cancelled' }));
    } catch (err) {
      alert(err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center font-sans">
        <Loader2 className="animate-spin text-[#6D28D9]" size={32} />
        <p className="text-xs text-gray-500 font-bold">Generating your warehouse kitchen ticket...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 font-sans">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-xl font-black text-gray-900 uppercase">Order Loading Failed</h1>
        <p className="text-xs text-gray-500 font-medium">{error || 'Order detail is unavailable.'}</p>
        <Link to="/diet-corner" className="inline-flex bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs uppercase tracking-wider">
          Return to Diet Corner
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-gray-800">
      
      {/* Back button */}
      <Link to="/diet-corner" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:underline uppercase tracking-wider">
        <ArrowLeft size={13} />
        <span>Return to Dashboard</span>
      </Link>

      <div className="grid md:grid-cols-5 gap-6">
        
        {/* Left Side: Order Ticket & Stepper (3 Cols) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Order Header / Success */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-4">
            {isCancelled ? (
              <div className="flex items-center gap-2 text-red-600">
                <div className="p-1 bg-red-50 rounded-full border border-red-200"><XCircle size={16} /></div>
                <h1 className="text-lg font-black uppercase tracking-wider">Order Cancelled</h1>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="p-1 bg-emerald-50 rounded-full border border-emerald-200"><Check size={16} /></div>
                <h1 className="text-lg font-black uppercase tracking-wider">Order Placed Successfully!</h1>
              </div>
            )}

            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              {isCancelled
                ? "This order has been cancelled and reserved inventory was released back to the warehouse."
                : "Your order is routed directly to the micro-assembly table in darkstore warehouse."}
            </p>
            <div className="flex justify-between items-center text-xs font-bold py-2.5 border-t border-b border-gray-150">
              <span className="text-gray-500">Order ID: <b className="text-gray-900 font-black">{order.id}</b></span>
              <span className="text-gray-500">Total Price: <b className="text-gray-900 font-black">₹{order.total_price}</b></span>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              {role === 'food_maker' && !isCancelled && (
                <Link
                  to={`/food-maker/orders/${order.id}`}
                  className="inline-flex bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all items-center gap-2 shadow-md"
                >
                  <span>🧑‍🍳 Open Food Maker Terminal</span>
                </Link>
              )}

              {!isCancelled && (order.status === 'Received' || order.status === 'Accepted') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2.5 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <XCircle size={15} />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Recipe Preview Box */}
          {recipePreview && !isCancelled && (
            <div className="bg-[#F3E8FF] border border-[#D8B4FE] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="bg-[#6D28D9] text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    AI Recipe Ready
                  </span>
                  <h3 className="text-xs font-black text-[#111827]">{recipePreview.recipe_name}</h3>
                </div>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="bg-white border border-[#6D28D9] text-[#6D28D9] hover:bg-[#F3E8FF] text-[10px] font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  View AI Recipe
                </button>
              </div>
            </div>
          )}

          {/* Real-time Delivery Stepper */}
          {!isCancelled && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-6">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Real-time Order Status</h2>
              <div className="relative pl-6 space-y-6 border-l border-gray-200 ml-2">
                {STEPPER.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;
                  
                  return (
                    <div key={idx} className="relative">
                      {/* Stepper Dot */}
                      <div className={`absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isActive 
                          ? 'bg-[#6D28D9] border-[#6D28D9] scale-125 ring-4 ring-[#F3E8FF]'
                          : isCompleted
                          ? 'bg-[#6D28D9] border-[#6D28D9]'
                          : 'bg-white border-gray-300'
                      }`}>
                        {isCompleted && <Check size={8} className="text-white mx-auto mt-0.5" />}
                      </div>
                      {/* Step Info */}
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-black ${isActive ? 'text-[#6D28D9]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Kitchen/Warehouse Ticket (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Visual Darkstore Kitchen Ticket */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-6 card-shadow space-y-5 font-mono text-xs relative overflow-hidden bg-opacity-30">
            {/* Header branding */}
            <div className="text-center pb-4 border-b border-dashed border-gray-200 space-y-1">
              <span className="font-black text-xs tracking-wider uppercase text-[#6D28D9]">AI Diet Corner</span>
              <span className="block text-[8px] text-gray-400 font-sans font-bold">DARKSTORE KITCHEN TICKET</span>
              <span className="block font-black text-xs text-red-600 mt-1">{order.id}</span>
            </div>

            {/* Meta details */}
            <div className="space-y-1 py-1 text-[10px] text-gray-600 font-bold">
              <p><b>CUSTOMER ID:</b> {order.user_id}</p>
              <p><b>DIET TYPE:</b> {order.diet_type.toUpperCase()}</p>
              <p><b>ALLERGIES:</b> {order.allergies && order.allergies.length > 0 ? order.allergies.join(", ").toUpperCase() : "NONE"}</p>
              <p><b>PREP TIER:</b> TIER {order.prep_tier}</p>
              <p><b>TARGETS:</b> P:{order.target_protein_g}g C:{order.target_carbs_g}g Cal:{order.target_calories}kcal</p>
            </div>

            {/* Portion recipe checklist */}
            <div className="space-y-2 py-2 border-t border-b border-dashed border-gray-200">
              <span className="font-extrabold block text-center uppercase tracking-wider text-[10px] mb-1">Portion Recipe Checklist</span>
              {order.components.map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                  <span>[ ] {comp.name}</span>
                  <span className="font-black text-[#6D28D9]">{comp.weight_g}g</span>
                </div>
              ))}
            </div>

            {/* Custom Notes */}
            {order.notes && (
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200 text-[10px]">
                <span className="font-bold block uppercase text-[9px] text-[#6D28D9]">Staff Instructions:</span>
                <span className="text-gray-600 font-semibold">{order.notes}</span>
              </div>
            )}

            {/* Substitution Log */}
            {order.substitution_applied && (
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[10px] text-amber-800 font-mono">
                <span className="font-bold block uppercase text-[9px]">SUBSTITUTION:</span>
                <span>{order.original_item} ➔ {order.replacement_item}</span>
              </div>
            )}

            {/* Macro Match Percent */}
            <div className="text-center py-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              MACRO MATCH: {order.match_percent}% ACHIEVED
            </div>

          </div>

        </div>

      </div>

      {/* Recipe Preview Modal */}
      {showPreviewModal && recipePreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-gray-200 shadow-xl font-sans text-gray-800">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <span className="font-black text-[9px] uppercase tracking-wider text-gray-400">AI Customer Recipe Preview</span>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">{recipePreview.recipe_name}</h3>
              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <span>Preparation Mode:</span>
                <span className="bg-[#F3E8FF] text-[#6D28D9] px-2 py-0.5 rounded text-[9px] font-black uppercase">{recipePreview.prep_tier}</span>
              </p>
              <p className="text-xs text-gray-500 font-semibold">
                Ingredients: <b>{recipePreview.ingredients_count} fresh items</b>
              </p>
            </div>
            
            <div className="p-3 bg-[#F3E8FF] rounded-xl text-[10px] text-[#6D28D9] leading-relaxed font-bold border border-[#D8B4FE]">
              ℹ️ Your custom portion ratios are configured dynamically based on PuLP optimization metrics.
            </div>
            
            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider shadow-xs"
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