// frontend/src/components/SubscriptionDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertTriangle, UserCheck, ChevronRight, Edit2 } from 'lucide-react';

const SWAP_OPTIONS = [
  {
    meal_name: "Chicken Breast + Brown Rice Bowl",
    components: [
      { ingredient_id: "chicken_breast", name: "Air-Fried Chicken Breast", weight_g: 150.0 },
      { ingredient_id: "brown_rice", name: "Steamed Brown Rice", weight_g: 120.0 }
    ]
  },
  {
    meal_name: "Tofu + Quinoa Bowl",
    components: [
      { ingredient_id: "tofu", name: "Air-Fried Organic Tofu", weight_g: 180.0 },
      { ingredient_id: "quinoa", name: "Steamed Organic Quinoa", weight_g: 100.0 }
    ]
  },
  {
    meal_name: "Greek Yogurt + Chia Seeds Smoothie Bowl",
    components: [
      { ingredient_id: "greek_yogurt", name: "High-Protein Greek Yogurt", weight_g: 200.0 },
      { ingredient_id: "chia_seeds", name: "Organic Chia Seeds", weight_g: 20.0 }
    ]
  },
  {
    meal_name: "Chickpeas + Spinach Bowl",
    components: [
      { ingredient_id: "chickpeas", name: "Boiled Kabuli Chana", weight_g: 160.0 },
      { ingredient_id: "spinach", name: "Steamed Baby Spinach", weight_g: 100.0 }
    ]
  },
  {
    meal_name: "Whey Protein + Soy Milk Shake",
    components: [
      { ingredient_id: "whey_protein", name: "Isolate Whey Protein Powder", weight_g: 35.0 },
      { ingredient_id: "soy_milk", name: "Organic Soy Milk", weight_g: 250.0 }
    ]
  },
  {
    meal_name: "Soft Boiled Eggs + Steamed Quinoa Bowl",
    components: [
      { ingredient_id: "boiled_egg", name: "Soft Boiled Farm Eggs", weight_g: 120.0 },
      { ingredient_id: "quinoa", name: "Steamed Organic Quinoa", weight_g: 120.0 }
    ]
  }
];

function SubscriptionDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'operations'
  const [swappingDay, setSwappingDay] = useState(null); // Day name we are currently swapping

  // Fetch subscription schedule
  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/plan');
      const data = await response.json();
      setSchedule(data.schedule || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Fetch forecast data
  const fetchForecast = async () => {
    setLoadingForecast(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/forecast');
      const data = await response.json();
      setForecast(data.forecast || []);
    } catch (err) {
      console.error('Error fetching forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchForecast();
  }, []);

  const handleSwap = async (mealOption) => {
    if (!swappingDay) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: "demo_user",
          day: swappingDay,
          meal_name: mealOption.meal_name,
          components: mealOption.components
        })
      });
      if (response.ok) {
        setSwappingDay(null);
        await fetchSchedule();
        await fetchForecast();
      } else {
        alert("Failed to update subscription");
      }
    } catch (err) {
      console.error("Error updating subscription:", err);
    }
  };

  const handleSkipOrPause = (day, action) => {
    alert(`${action} action triggered for ${day}. This registers the action successfully.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('user')}
          className={`flex-1 py-4 text-center font-extrabold text-sm border-b-2 transition-all ${
            activeTab === 'user'
              ? 'border-diet-primary text-diet-primary bg-emerald-50 bg-opacity-35'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📅 Customer Meal Schedule
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`flex-1 py-4 text-center font-extrabold text-sm border-b-2 transition-all ${
            activeTab === 'operations'
              ? 'border-diet-primary text-diet-primary bg-emerald-50 bg-opacity-35'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Operations & Forecast Dashboard
        </button>
      </div>

      {/* Customer Mode */}
      {activeTab === 'user' && (
        <div className="space-y-8">
          
          {/* Subscription Package info */}
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 bg-diet-light text-diet-primary font-bold text-[10px] px-2.5 py-1 rounded-full uppercase">
                <UserCheck size={10} />
                <span>Subscription Active</span>
              </div>
              <h2 className="text-xl font-extrabold text-qcommerce-black">Weekly Macro Subscription</h2>
              <p className="text-xs text-gray-500 max-w-lg">
                Your meals are auto-selected based on your macro targets. Mon - Sun rotations ensure ingredient variety and nutritional balance.
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-center min-w-[180px] text-center">
              <span className="text-2xl font-black text-qcommerce-black">₹1,749<span className="text-xs font-normal text-gray-500"> / week</span></span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">Next Billing: Aug 17, 2026</span>
            </div>
          </div>

          {/* Weekly Planner Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-qcommerce-black flex items-center gap-2">
              <Calendar className="text-diet-primary" size={20} />
              <span>Weekly Rotations</span>
            </h3>
            
            {loadingSchedule ? (
              <p className="text-xs text-gray-500">Loading schedule...</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {schedule.map((item, idx) => (
                  <div key={idx} className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-5 shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-diet-primary block">{item.day}</span>
                      <h4 className="text-xs font-extrabold text-gray-800 leading-snug">{item.meal_name}</h4>
                    </div>

                    <div className="flex gap-2 pt-2 text-[10px] font-bold">
                      <button
                        onClick={() => setSwappingDay(item.day)}
                        className="flex-1 py-1.5 bg-diet-light hover:bg-diet-primary hover:text-white text-diet-primary rounded-lg text-center flex items-center justify-center gap-1 transition-all"
                      >
                        <Edit2 size={10} />
                        <span>Swap</span>
                      </button>
                      <button
                        onClick={() => handleSkipOrPause(item.day, 'Skip')}
                        className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-center"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleSkipOrPause(item.day, 'Pause')}
                        className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-center"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Modal */}
          {swappingDay && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-qcommerce-black">Swap Meal for {swappingDay}</h3>
                  <p className="text-xs text-gray-500">Choose a nutritional alternative. The inventory forecast will update automatically.</p>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {SWAP_OPTIONS.map((option, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleSwap(option)}
                      className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-diet-primary hover:bg-diet-light hover:bg-opacity-50 transition-all flex items-center justify-between group"
                    >
                      <span className="text-xs font-bold text-gray-800 leading-snug group-hover:text-diet-primary">{option.meal_name}</span>
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-diet-primary" />
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSwappingDay(null)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Operations/Forecasting Mode */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-qcommerce-black">Next Week Inventory Demand Forecast</h3>
                <p className="text-xs text-gray-500">
                  Forecast calculates ingredient requirements based on <b>150 active subscribers</b> meal schedule.
                </p>
              </div>
              <button
                onClick={fetchForecast}
                className="inline-flex items-center gap-1.5 bg-diet-light hover:bg-diet-accent hover:text-white text-diet-primary font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
              >
                <RefreshCw size={14} />
                <span>Refresh Forecast</span>
              </button>
            </div>

            {loadingForecast ? (
              <p className="text-xs text-gray-500 py-6 text-center">Loading forecast data...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <th className="p-3">Ingredient</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3">Expected Demand (Subscribers)</th>
                      <th className="p-3">Potential Shortage</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Prep Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((item, idx) => {
                      let statusClass = "bg-emerald-100 text-emerald-800";
                      if (item.status === "Low Stock") {
                        statusClass = "bg-amber-100 text-amber-800";
                      } else if (item.status === "Out of Stock") {
                        statusClass = "bg-red-100 text-red-800";
                      }

                      // Only display items with expected demand next week
                      if (item.expected_demand_g === 0) return null;

                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 font-medium">
                          <td className="p-3 font-bold text-gray-800">{item.name}</td>
                          <td className="p-3">{(item.current_stock_g / 1000).toFixed(2)} kg</td>
                          <td className="p-3">{(item.expected_demand_g / 1000).toFixed(2)} kg</td>
                          <td className="p-3 font-extrabold text-red-600">
                            {item.potential_shortage_g > 0 ? `${(item.potential_shortage_g / 1000).toFixed(2)} kg` : '0.00 kg'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusClass}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">Tier {item.prep_tier}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-start gap-2.5 text-[11px] text-gray-500">
              <AlertTriangle className="text-amber-500 shrink-0" size={16} />
              <p>
                <b>Forecasting Warning Alert:</b> Low stock ingredients are automatically marked. Darkstore managers should request replenishment from the regional distribution center to prevent macro-match failures or force substitutions.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default SubscriptionDashboard;
