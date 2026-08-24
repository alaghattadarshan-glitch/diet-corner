// frontend/src/components/SubscriptionDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertTriangle, UserCheck, ChevronRight, Edit2, Check, X, ShieldAlert, TrendingUp } from 'lucide-react';

function SubscriptionDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'operations'
  const [swappingDay, setSwappingDay] = useState(null); // Day object we are currently swapping
  const [swapOptions, setSwapOptions] = useState([]);
  const [loadingSwapOptions, setLoadingSwapOptions] = useState(false);
  const [editingDay, setEditingDay] = useState(null); // Day/slot we are editing macros for (e.g., 'Monday:Meal 1')
  const [planType, setPlanType] = useState('weekly'); // 'weekly' or 'monthly'
  const [mealsPerDay, setMealsPerDay] = useState(1); // 1, 2, or 3
  const [editForm, setEditForm] = useState({
    target_protein_g: 40.0,
    target_carbs_g: 50.0,
    target_fat_g: 15.0,
    target_calories: 500.0
  });

  // Fetch subscription schedule
  const fetchSchedule = async (pType = planType, mPerDay = mealsPerDay) => {
    setLoadingSchedule(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/subscription/plan?plan_type=${pType}&meals_per_day=${mPerDay}`);
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
    fetchSchedule(planType, mealsPerDay);
    fetchForecast();
  }, []);

  // Fetch dynamic swap options from solver
  const fetchSwapOptions = async (dayItem) => {
    setLoadingSwapOptions(true);
    setSwappingDay(dayItem);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/swap-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_protein_g: dayItem.target_protein_g,
          target_carbs_g: dayItem.target_carbs_g,
          target_fat_g: dayItem.target_fat_g,
          target_calories: dayItem.target_calories
        })
      });
      const data = await response.json();
      setSwapOptions(data.options || []);
    } catch (err) {
      console.error('Error fetching swap options:', err);
    } finally {
      setLoadingSwapOptions(false);
    }
  };

  const handleSwap = async (option) => {
    if (!swappingDay) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "demo_user",
          day: swappingDay.day,
          meal_slot: swappingDay.meal_slot,
          meal_name: option.name,
          components: option.components
        })
      });
      if (response.ok) {
        setSwappingDay(null);
        setSwapOptions([]);
        await fetchSchedule(planType, mealsPerDay);
        await fetchForecast();
      } else {
        alert("Failed to update subscription");
      }
    } catch (err) {
      console.error("Error updating subscription:", err);
    }
  };

  const updateDayStatus = async (day, mealSlot, status) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "demo_user",
          day: day,
          meal_slot: mealSlot,
          status: status
        })
      });
      if (response.ok) {
        await fetchSchedule(planType, mealsPerDay);
        await fetchForecast();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const startEditing = (item) => {
    setEditingDay(`${item.day}:${item.meal_slot}`);
    setEditForm({
      target_protein_g: item.target_protein_g,
      target_carbs_g: item.target_carbs_g,
      target_fat_g: item.target_fat_g,
      target_calories: item.target_calories
    });
  };

  const saveMacros = async (dayName, mealSlot) => {
    try {
      const solveRes = await fetch('http://127.0.0.1:8000/api/subscription/swap-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const solveData = await solveRes.json();
      
      if (!solveData.options || solveData.options.length === 0) {
        alert(`No feasible meal combination matches these macros (Protein: ${editForm.target_protein_g}g, Carbs: ${editForm.target_carbs_g}g, Calories: ${editForm.target_calories}kcal) within constraints.`);
        return;
      }

      const bestOption = solveData.options[0];

      const response = await fetch('http://127.0.0.1:8000/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "demo_user",
          day: dayName,
          meal_slot: mealSlot,
          meal_name: bestOption.name,
          components: bestOption.components,
          target_protein_g: Number(editForm.target_protein_g),
          target_carbs_g: Number(editForm.target_carbs_g),
          target_fat_g: Number(editForm.target_fat_g),
          target_calories: Number(editForm.target_calories)
        })
      });

      if (response.ok) {
        setEditingDay(null);
        await fetchSchedule(planType, mealsPerDay);
        await fetchForecast();
      } else {
        alert("Failed to save macros");
      }
    } catch (err) {
      console.error("Error saving macros:", err);
    }
  };

  // Rollup metrics
  const activeMeals = schedule.filter(s => s.status === 'active');
  const totalWeeklyCalories = activeMeals.reduce((acc, curr) => acc + curr.target_calories, 0);
  const avgDailyProtein = activeMeals.length ? (activeMeals.reduce((acc, curr) => acc + curr.target_protein_g, 0) / activeMeals.length).toFixed(1) : 0;
  const avgDailyCarbs = activeMeals.length ? (activeMeals.reduce((acc, curr) => acc + curr.target_carbs_g, 0) / activeMeals.length).toFixed(1) : 0;
  const avgDailyCalories = activeMeals.length ? Math.round(totalWeeklyCalories / activeMeals.length) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Tab Navigation */}
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
        <div className="space-y-6">
          
          {/* Plan & Frequency Selection Controls */}
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-md flex flex-wrap gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">Plan Duration</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPlanType('weekly');
                      fetchSchedule('weekly', mealsPerDay);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      planType === 'weekly' ? 'bg-diet-primary text-white border-diet-primary shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Weekly Plan
                  </button>
                  <button
                    onClick={() => {
                      setPlanType('monthly');
                      fetchSchedule('monthly', mealsPerDay);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      planType === 'monthly' ? 'bg-diet-primary text-white border-diet-primary shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Monthly Plan
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">Meals Per Day (Frequency)</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setMealsPerDay(f);
                        fetchSchedule(planType, f);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        mealsPerDay === f ? 'bg-diet-primary text-white border-diet-primary shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f} Time{f > 1 ? 's' : ''} a Day
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Subscription Rate</span>
              <span className="text-xl font-black text-qcommerce-black">
                ₹{planType === 'weekly' ? (1749 * mealsPerDay) : (6499 * mealsPerDay)}
                <span className="text-xs font-normal text-gray-400"> / {planType === 'weekly' ? 'week' : 'month'}</span>
              </span>
            </div>
          </div>

          {/* Weekly Rollup Visualizer Widget */}
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-md space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-diet-primary" />
                <span>Plan Rollup (Avg per Meal)</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="block text-xs font-black text-gray-800">{avgDailyCalories}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Avg Kcal</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="block text-xs font-black text-emerald-600">{avgDailyProtein}g</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Avg Prot</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="block text-xs font-black text-blue-600">{avgDailyCarbs}g</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Avg Carb</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold text-center">
                Total Plan Calories: <span className="text-gray-600">{totalWeeklyCalories} kcal</span>
              </p>
            </div>

            {/* Premium CSS Chart */}
            <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-md md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daily Target Distribution</h4>
              <div className="flex items-end justify-between h-20 px-2 pt-2 border-b border-gray-100 overflow-x-auto gap-2">
                {schedule.map((item, idx) => {
                  const maxVal = 600;
                  const pct = Math.min(100, (item.target_calories / maxVal) * 100);
                  const isInactive = item.status !== 'active';
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 group min-w-[30px] flex-1">
                      <div className="relative w-full flex justify-center h-12">
                        <div 
                          style={{ height: `${isInactive ? 5 : pct}%` }}
                          className={`w-3 rounded-t-md transition-all duration-500 ${
                            isInactive ? 'bg-gray-200' : 'bg-gradient-to-t from-emerald-400 to-diet-primary'
                          }`}
                        />
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-qcommerce-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10 whitespace-nowrap">
                          {isInactive ? 'Inactive' : `${item.target_calories} kcal (${item.meal_slot})`}
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-gray-400">{item.day.substring(0, 5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Weekly Planner Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-qcommerce-black flex items-center gap-2">
              <Calendar className="text-diet-primary" size={20} />
              <span>Rotation Planner</span>
            </h3>
            
            {loadingSchedule ? (
              <p className="text-xs text-gray-500">Loading schedule...</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {schedule.map((item, idx) => {
                  const itemKey = `${item.day}:${item.meal_slot}`;
                  const isEditing = editingDay === itemKey;
                  const isSkipped = item.status === 'skipped';
                  const isPaused = item.status === 'paused';
                  const isInactive = isSkipped || isPaused;

                  return (
                    <div 
                      key={idx} 
                      className={`bg-white/90 backdrop-blur-sm border rounded-2xl p-5 shadow-md space-y-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${
                        isInactive ? 'border-gray-200 opacity-60 bg-gray-50' : 'border-white/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-black text-gray-700 block">{item.day}</span>
                            <span className="bg-gray-100 text-gray-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full block w-fit border border-gray-150">
                              {item.meal_slot}
                            </span>
                          </div>
                          {isSkipped && (
                            <span className="bg-red-100 text-red-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                              Skipped
                            </span>
                          )}
                          {isPaused && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                              Paused
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-150">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Edit Targets</span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-gray-400 font-bold mb-0.5">Protein (g)</label>
                                <input
                                  type="number"
                                  value={editForm.target_protein_g}
                                  onChange={(e) => setEditForm({ ...editForm, target_protein_g: e.target.value })}
                                  className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 font-bold mb-0.5">Carbs (g)</label>
                                <input
                                  type="number"
                                  value={editForm.target_carbs_g}
                                  onChange={(e) => setEditForm({ ...editForm, target_carbs_g: e.target.value })}
                                  className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 font-bold mb-0.5">Calories</label>
                                <input
                                  type="number"
                                  value={editForm.target_calories}
                                  onChange={(e) => setEditForm({ ...editForm, target_calories: e.target.value })}
                                  className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => saveMacros(item.day, item.meal_slot)}
                                className="flex-1 py-1 bg-diet-primary hover:bg-emerald-600 text-white font-bold rounded flex items-center justify-center gap-0.5 text-[9px]"
                              >
                                <Check size={8} /> Save
                              </button>
                              <button
                                onClick={() => setEditingDay(null)}
                                className="flex-1 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded flex items-center justify-center gap-0.5 text-[9px]"
                              >
                                <X size={8} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-xs font-extrabold text-gray-800 leading-snug">
                              {isInactive ? 'Meal Delivery Paused / Skipped' : item.meal_name}
                            </h4>

                            {!isInactive && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <span className="bg-emerald-50 text-diet-primary text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                                  P: {item.target_protein_g}g
                                </span>
                                <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold border border-blue-100">
                                  C: {item.target_carbs_g}g
                                </span>
                                <span className="bg-gray-50 text-gray-600 text-[9px] px-2 py-0.5 rounded-full font-bold border border-gray-100">
                                  {item.target_calories} kcal
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Card Buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-2 text-[9px] font-bold">
                        {isInactive ? (
                          <button
                            onClick={() => updateDayStatus(item.day, item.meal_slot, 'active')}
                            className="w-full py-1.5 bg-diet-primary hover:bg-emerald-600 text-white rounded-lg text-center shadow-xs"
                          >
                            Resume Delivery
                          </button>
                        ) : (
                          <>
                            {!isEditing && (
                              <>
                                <button
                                  onClick={() => fetchSwapOptions(item)}
                                  className="flex-1 py-1.5 bg-diet-light hover:bg-diet-primary hover:text-white text-diet-primary rounded-lg text-center flex items-center justify-center gap-1 transition-all border border-diet-primary border-opacity-20"
                                >
                                  <Edit2 size={10} />
                                  <span>Swap</span>
                                </button>
                                <button
                                  onClick={() => startEditing(item)}
                                  className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-center border border-gray-200"
                                >
                                  Macros
                                </button>
                                <button
                                  onClick={() => updateDayStatus(item.day, item.meal_slot, 'skipped')}
                                  className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-center"
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() => updateDayStatus(item.day, item.meal_slot, 'paused')}
                                  className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-center"
                                >
                                  Pause
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Swap Solver Modal */}
          {swappingDay && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-qcommerce-black">Solve Swap for {swappingDay.day} ({swappingDay.meal_slot})</h3>
                  <p className="text-xs text-gray-500">
                    Target Macros: {swappingDay.target_protein_g}g Protein, {swappingDay.target_carbs_g}g Carbs, {swappingDay.target_calories}kcal
                  </p>
                </div>
                
                {loadingSwapOptions ? (
                  <p className="text-xs text-gray-500 text-center py-6">Solving optimal ingredient weights...</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {swapOptions.length === 0 ? (
                      <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 text-xs flex gap-2">
                        <ShieldAlert className="shrink-0 text-red-600" size={16} />
                        <p>No feasible match found in current inventory for these targets. Try editing targets first.</p>
                      </div>
                    ) : (
                      swapOptions.map((option, oIdx) => (
                        <div
                          key={oIdx}
                          className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-diet-primary transition-all flex flex-col gap-2 bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-800 leading-snug">{option.name}</span>
                            <span className="bg-diet-light text-diet-primary text-[9px] font-black px-2 py-0.5 rounded-full">
                              Score: {option.match_score}%
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {option.components.map((c, cIdx) => (
                              <span key={cIdx} className="bg-white border border-gray-100 text-[8px] px-1.5 py-0.5 rounded text-gray-500 font-semibold">
                                {c.name} ({Math.round(c.weight_g)}g)
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold pt-1 border-t border-gray-100">
                            <span>₹{option.price}</span>
                            <button
                              onClick={() => handleSwap(option)}
                              className="px-3 py-1 bg-diet-primary hover:bg-emerald-600 text-white rounded font-bold"
                            >
                              Choose This
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setSwappingDay(null); setSwapOptions([]); }}
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
                  Calculates ingredient requirements based on active subscription rotations. Excludes skipped/paused days.
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
