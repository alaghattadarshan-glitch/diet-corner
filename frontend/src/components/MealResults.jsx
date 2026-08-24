// frontend/src/components/MealResults.jsx

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ChefHat, Tag, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

function MealResults() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const options = location.state?.options || [];
  const requestPayload = location.state?.requestPayload || {};

  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');

  if (!options || options.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <span className="text-6xl">🔍</span>
        <h1 className="text-2xl font-black text-gray-900">No Meals Found</h1>
        <p className="text-sm text-gray-500">
          We couldn't generate a combination satisfying your constraints. Try relaxing your budget or allergy settings.
        </p>
        <Link
          to="/diet-corner/build"
          className="inline-flex items-center gap-2 bg-diet-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-diet-dark transition-all text-sm"
        >
          <ArrowLeft size={16} />
          <span>Adjust Targets</span>
        </Link>
      </div>
    );
  }

  const handleOrder = async (selectedOption) => {
    setOrdering(true);
    setError('');

    const orderPayload = {
      user_id: "demo_user",
      target_protein_g: requestPayload.target_protein_g,
      target_carbs_g: requestPayload.target_carbs_g,
      target_calories: requestPayload.target_calories,
      diet_type: requestPayload.diet_type,
      allergies: requestPayload.allergies,
      notes: requestPayload.notes,
      selected_option: selectedOption
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to create order.');
      }

      const data = await response.json();
      // Redirect to Order Confirmation screen
      navigate(`/diet-corner/order/${data.order_id}`);
    } catch (err) {
      setError(err.message || 'Server error creating order.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link to="/diet-corner/build" className="inline-flex items-center gap-1.5 text-xs font-bold text-diet-primary hover:underline">
        <ArrowLeft size={14} />
        <span>Adjust Macro Targets</span>
      </Link>

      {/* Header info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-qcommerce-black">AI Optimized Meal Matches</h1>
        <p className="text-xs text-gray-500">
          Below are the best combinations optimized for your targets:
          <span className="font-bold text-gray-700"> {requestPayload.target_protein_g}g Protein • {requestPayload.target_carbs_g}g Carbs • {requestPayload.target_fat_g}g Fat • {requestPayload.target_calories} kcal</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-200 font-semibold">
          {error}
        </div>
      )}

      {/* Options List */}
      <div className="space-y-6">
        {options.map((opt, idx) => {
          // Color coding for feasibility badges
          let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (opt.feasibility_status === "Good Match") {
            badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
          } else if (opt.feasibility_status === "Closest Available") {
            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          }

          return (
            <div
              key={opt.id}
              className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 p-6 md:p-8 shadow-lg flex flex-col md:flex-row justify-between gap-6 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Option Number Tag */}
              <div className="absolute top-0 left-0 bg-diet-primary text-white text-[10px] font-black px-3.5 py-1 rounded-br-2xl uppercase tracking-wider">
                Option #{idx + 1}
              </div>

              {/* Left Side: Information & Components */}
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg md:text-xl font-black text-qcommerce-black">{opt.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                    {opt.feasibility_status}
                  </span>
                </div>

                {/* AI Explanation Layer */}
                <div className="bg-emerald-50 bg-opacity-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-xs text-diet-dark">
                  <Sparkles size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{opt.explanation}</span>
                </div>

                {/* Substitution Alert */}
                {opt.substitution_applied && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                      <AlertTriangle size={14} />
                      <span>Substitution Applied (Meal Recalculated)</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-normal font-semibold">
                      {opt.replacement_item} substituted for {opt.original_item} because {opt.original_item.toLowerCase()} is out of stock. (Similarity score: {opt.similarity_score})
                    </p>
                  </div>
                )}

                {/* Ingredient breakdown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-700">Portion Components</h3>
                  <div className="flex flex-wrap gap-2">
                    {opt.components.map((comp, cIdx) => (
                      <div key={cIdx} className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold text-gray-700">
                        <span className="text-[10px] text-gray-400">●</span>
                        <span>{comp.name}</span>
                        <span className="text-diet-primary font-bold">({comp.weight_g}g)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Macro bars, pricing, Order button */}
              <div className="w-full md:w-72 bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 flex flex-col justify-between gap-4">
                
                {/* Score and Price */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <div className="text-center md:text-left">
                    <span className="block text-2xl font-black text-diet-primary">{opt.match_score}%</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Macro Match Score</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-qcommerce-black">₹{opt.price}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-0.5 justify-end">
                      <Tag size={10} /> Portioned Price
                    </span>
                  </div>
                </div>

                {/* Macro Progress Bars */}
                <div className="space-y-3 py-2 text-xs">
                  {/* Protein */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>Protein</span>
                      <span className="flex items-center gap-1">
                        <span>{opt.protein_g}g / <span className="text-gray-400 font-medium">{requestPayload.target_protein_g}g</span></span>
                        {requestPayload.target_protein_g - opt.protein_g > 1 && (
                          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black">
                            -{(requestPayload.target_protein_g - opt.protein_g).toFixed(1)}g shortfall
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-diet-primary rounded-full transition-all duration-500"
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
                        {requestPayload.target_carbs_g - opt.carbs_g > 1 && (
                          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black">
                            -{(requestPayload.target_carbs_g - opt.carbs_g).toFixed(1)}g shortfall
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
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
                        {requestPayload.target_fat_g - opt.fat_g > 1 && (
                          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black">
                            -{(requestPayload.target_fat_g - opt.fat_g).toFixed(1)}g shortfall
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
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
                        {requestPayload.target_calories - opt.calories > 10 && (
                          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black">
                            -{(requestPayload.target_calories - opt.calories).toFixed(0)} kcal shortfall
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (opt.calories / requestPayload.target_calories) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Prep Tier info */}
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 pt-2 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    <ChefHat size={12} /> Prep Tier {opt.prep_tier}
                  </span>
                  <span>Assemble Time: {opt.prep_time_min} mins</span>
                </div>

                {/* Order CTA */}
                <button
                  onClick={() => handleOrder(opt)}
                  disabled={ordering}
                  className="w-full mt-2 py-3 bg-qcommerce-black hover:bg-gray-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  {ordering ? (
                    'Ordering...'
                  ) : (
                    <>
                      <span>Select & Order Meal</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MealResults;
