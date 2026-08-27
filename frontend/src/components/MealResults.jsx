// frontend/src/components/MealResults.jsx

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ChefHat, Tag, AlertTriangle, CheckCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../apiConfig';

function MealResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId } = useRole();
  const { addToCart } = useCart();
  
  const options = location.state?.options || (sessionStorage.getItem('last_meal_options') ? JSON.parse(sessionStorage.getItem('last_meal_options')) : []);
  const requestPayload = location.state?.requestPayload || (sessionStorage.getItem('last_meal_payload') ? JSON.parse(sessionStorage.getItem('last_meal_payload')) : {});

  React.useEffect(() => {
    if (location.state?.options) {
      sessionStorage.setItem('last_meal_options', JSON.stringify(location.state.options));
    }
    if (location.state?.requestPayload) {
      sessionStorage.setItem('last_meal_payload', JSON.stringify(location.state.requestPayload));
    }
  }, [location.state]);

  const [selectedOrderingOptionId, setSelectedOrderingOptionId] = useState(null);
  const [addedCartMap, setAddedCartMap] = useState({});
  const [error, setError] = useState('');

  if (!options || options.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 font-sans">
        <span className="text-6xl">🔍</span>
        <h1 className="text-xl font-black text-gray-900 uppercase">No Meals Found</h1>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          We couldn't generate a combination satisfying your constraints. Try relaxing your budget or allergy settings.
        </p>
        <Link
          to="/diet-corner/build"
          className="inline-flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-5 py-3 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Adjust Targets</span>
        </Link>
      </div>
    );
  }

  const handleAddToCart = (selectedOption) => {
    addToCart({
      type: 'meal',
      meal_id: selectedOption.id || selectedOption.name,
      name: selectedOption.name,
      price: selectedOption.price,
      components: selectedOption.components,
      macros: {
        protein_g: selectedOption.protein_g,
        carbs_g: selectedOption.carbs_g,
        fat_g: selectedOption.fat_g,
        calories: selectedOption.calories
      },
      prep_tier: selectedOption.prep_tier,
      substitution_applied: selectedOption.substitution_applied,
      original_item: selectedOption.original_item,
      replacement_item: selectedOption.replacement_item,
      similarity_score: selectedOption.similarity_score,
      allergies: requestPayload.allergies,
      notes: requestPayload.notes,
      diet_type: requestPayload.diet_type
    });

    setAddedCartMap(prev => ({ ...prev, [selectedOption.id]: true }));
    setTimeout(() => {
      setAddedCartMap(prev => ({ ...prev, [selectedOption.id]: false }));
    }, 2000);
  };

  const handleOrderNow = async (selectedOption) => {
    if (selectedOrderingOptionId !== null) return;
    setSelectedOrderingOptionId(selectedOption.id);
    setError('');

    const orderPayload = {
      user_id: customerId || "cust_prototype",
      target_protein_g: requestPayload.target_protein_g,
      target_carbs_g: requestPayload.target_carbs_g,
      target_calories: requestPayload.target_calories,
      diet_type: requestPayload.diet_type,
      allergies: requestPayload.allergies,
      notes: requestPayload.notes,
      selected_option: selectedOption
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to create order.');
      }

      const data = await response.json();
      navigate(`/orders/${data.order_id}`);
    } catch (err) {
      setError(err.message || 'Server error creating order.');
      setSelectedOrderingOptionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-gray-800">
      
      {/* Back button */}
      <Link to="/diet-corner/build" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] hover:underline uppercase tracking-wider">
        <ArrowLeft size={13} />
        <span>Adjust Macro Targets</span>
      </Link>

      {/* Header info */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-wider">AI Optimized Meal Matches</h1>
        <p className="text-xs text-gray-500 font-semibold">
          Optimized for targets:
          <span className="text-[#6D28D9] font-black"> {requestPayload.target_protein_g}g Protein • {requestPayload.target_carbs_g}g Carbs • {requestPayload.target_fat_g}g Fat • {requestPayload.target_calories} kcal</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 font-bold">
          {error}
        </div>
      )}

      {/* Options List */}
      <div className="space-y-6">
        {options.map((opt, idx) => {
          let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (opt.feasibility_status === "Good Match") {
            badgeClass = "bg-[#F3E8FF] text-[#6D28D9] border-[#D8B4FE]";
          } else if (opt.feasibility_status === "Closest Available") {
            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          }

          const isThisOrdering = selectedOrderingOptionId === opt.id;
          const isAddedToCart = addedCartMap[opt.id];

          return (
            <div
              key={opt.id}
              className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 md:p-8 card-shadow flex flex-col md:flex-row justify-between gap-6 hover:-translate-y-0.5 transition-all relative overflow-hidden"
            >
              {/* Option Number Tag */}
              <div className="absolute top-0 left-0 bg-[#6D28D9] text-white text-[9px] font-black px-3.5 py-1 rounded-br-2xl uppercase tracking-wider">
                Option #{idx + 1}
              </div>

              {/* Left Side: Information & Components */}
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base md:text-lg font-black text-gray-900">{opt.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${badgeClass}`}>
                    {opt.feasibility_status}
                  </span>
                </div>

                {/* AI Explanation Layer */}
                <div className="bg-[#F3E8FF] border border-[#D8B4FE] rounded-2xl p-4 flex flex-col gap-2 text-xs text-gray-700">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-[#6D28D9] shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{opt.explanation}</span>
                  </div>
                  {opt.explanation_detail && (
                    <details className="mt-1 text-[10px] text-gray-500 bg-white p-2.5 rounded-xl border border-gray-200 cursor-pointer w-full">
                      <summary className="font-bold text-[#6D28D9] select-none outline-none">Why this meal? (Optimizer Details)</summary>
                      <ul className="mt-1.5 space-y-1 pl-3.5 list-disc leading-relaxed font-semibold">
                        {Object.entries(opt.explanation_detail).map(([key, desc]) => (
                          <li key={key}>{desc}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>

                {/* Substitution Alert */}
                {opt.substitution_applied && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 uppercase tracking-wide">
                      <AlertTriangle size={13} />
                      <span>Substitution Applied</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                      {opt.replacement_item} substituted for {opt.original_item} because {opt.original_item.toLowerCase()} is out of stock. (Similarity score: {opt.similarity_score})
                    </p>
                  </div>
                )}

                {/* Ingredient breakdown */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portion Components</h3>
                  <div className="flex flex-wrap gap-2">
                    {opt.components.map((comp, cIdx) => (
                      <div key={cIdx} className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 font-bold text-gray-700">
                        <span className="text-[10px] text-gray-400">●</span>
                        <span>{comp.name}</span>
                        <span className="text-[#6D28D9] font-black">({comp.weight_g}g)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Macro bars, pricing, Actions */}
              <div className="w-full md:w-72 bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-200 flex flex-col justify-between gap-4">
                
                {/* Score and Price */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <div className="text-center md:text-left">
                    <span className="block text-2xl font-black text-[#6D28D9]">{opt.match_score}%</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Match Score</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-gray-900">₹{opt.price}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-0.5 justify-end">
                      <Tag size={10} /> Price
                    </span>
                  </div>
                </div>

                {/* Macro Progress Bars */}
                <div className="space-y-3 py-1 text-xs">
                  {/* Protein */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Protein</span>
                      <span className="flex items-center gap-1">
                        <span>{opt.protein_g}g / <span className="text-gray-400 font-medium">{requestPayload.target_protein_g}g</span></span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6D28D9] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (opt.protein_g / requestPayload.target_protein_g) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Carbs</span>
                      <span className="flex items-center gap-1">
                        <span>{opt.carbs_g}g / <span className="text-gray-400 font-medium">{requestPayload.target_carbs_g}g</span></span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6D28D9] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (opt.carbs_g / requestPayload.target_carbs_g) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Fat</span>
                      <span className="flex items-center gap-1">
                        <span>{opt.fat_g}g / <span className="text-gray-400 font-medium">{requestPayload.target_fat_g}g</span></span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6D28D9] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (opt.fat_g / requestPayload.target_fat_g) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Calories</span>
                      <span className="flex items-center gap-1">
                        <span>{opt.calories} kcal / <span className="text-gray-400 font-medium">{requestPayload.target_calories} kcal</span></span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6D28D9] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (opt.calories / requestPayload.target_calories) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Actions: Add to Cart & Order Now */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleAddToCart(opt)}
                    className={`w-full py-2.5 border-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isAddedToCart
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white border-[#C4B5FD] text-[#6D28D9] hover:bg-[#F3E8FF]'
                    }`}
                  >
                    {isAddedToCart ? (
                      <>
                        <CheckCircle size={14} />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOrderNow(opt)}
                    disabled={selectedOrderingOptionId !== null}
                    className="w-full py-3 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C1D95] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md uppercase tracking-wider active:scale-95 disabled:bg-gray-400"
                  >
                    {isThisOrdering ? (
                      <span className="flex items-center gap-2 text-white">
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                        <span>ORDERING...</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-white">Order Now</span>
                        <ArrowRight size={14} className="text-white" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MealResults;