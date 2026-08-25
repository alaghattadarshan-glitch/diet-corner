// frontend/src/components/MacroForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sliders, HelpCircle, ShieldCheck, X, User } from 'lucide-react';
import CalorieCalculator from './CalorieCalculator';
import { API_BASE_URL } from '../apiConfig';

const PRESETS = {
  'high-protein': { protein: 45, carbs: 35, fat: 15, calories: 500 },
  'low-carb': { protein: 35, carbs: 15, fat: 25, calories: 425 },
  'maintenance': { protein: 30, carbs: 50, fat: 18, calories: 600 },
  'custom': { protein: 40, carbs: 45, fat: 15, calories: 480 }
};

const ALLERGIES_LIST = ['Nuts', 'Dairy', 'Gluten', 'Eggs'];

function MacroForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // States
  const [preset, setPreset] = useState('custom');
  const [protein, setProtein] = useState(40);
  const [carbs, setCarbs] = useState(45);
  const [fat, setFat] = useState(15);
  const [calories, setCalories] = useState(480);
  const [minIngredients, setMinIngredients] = useState(2);
  const [maxIngredients, setMaxIngredients] = useState(5);
  
  const [diet, setDiet] = useState('veg');
  const [allergies, setAllergies] = useState([]);
  const [prepPreference, setPrepPreference] = useState('any');
  const [budget, setBudget] = useState(250);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  // Handle preset URL parameter
  useEffect(() => {
    const urlPreset = searchParams.get('preset');
    if (urlPreset && PRESETS[urlPreset]) {
      applyPreset(urlPreset);
    }
    const showCalc = searchParams.get('show_calc');
    if (showCalc === 'true') {
      setShowCalculator(true);
    }
  }, [searchParams]);

  const applyPreset = (presetName) => {
    setPreset(presetName);
    const values = PRESETS[presetName];
    setProtein(values.protein);
    setCarbs(values.carbs);
    setFat(values.fat);
    setCalories(values.calories);
  };

  const handleAllergyChange = (allergy) => {
    if (allergy === 'None') {
      setAllergies([]);
    } else {
      if (allergies.includes(allergy)) {
        setAllergies(allergies.filter(item => item !== allergy));
      } else {
        setAllergies([...allergies, allergy]);
      }
    }
  };

  const addNoteChip = (chipText) => {
    if (!notes.includes(chipText)) {
      setNotes(prev => prev ? `${prev}, ${chipText}` : chipText);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      target_protein_g: Number(protein),
      target_carbs_g: Number(carbs),
      target_fat_g: Number(fat),
      target_calories: Number(calories),
      diet_type: diet,
      allergies: allergies.map(a => a.toLowerCase()),
      budget: Number(budget),
      prep_preference: prepPreference,
      min_ingredients: Number(minIngredients),
      max_ingredients: Number(maxIngredients),
      notes: notes
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/match-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to match meal.');
      }

      const data = await response.json();
      
      // Navigate to results screen, passing matched options and original query payload
      navigate('/diet-corner/results', { 
        state: { 
          options: data.options,
          requestPayload: payload
        } 
      });
    } catch (err) {
      setError(err.message || 'Server error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-gray-800">
      
      {/* Personalized Nutrition Profile Button Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F3E8FF] border border-[#D8B4FE] rounded-3xl p-5 shadow-xs gap-3">
        <div className="space-y-1">
          <span className="text-xs font-black text-[#111827] flex items-center gap-1.5 uppercase tracking-wider">
            <User size={16} className="text-[#6D28D9]" />
            <span>Personalized Nutrition Profile</span>
          </span>
          <p className="text-[10px] text-[#4B5563] font-semibold">Use our calculator to estimate your daily macros and calories.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCalculator(true)}
          className="px-4 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs rounded-xl transition-all shadow-sm uppercase tracking-wider whitespace-nowrap shrink-0"
        >
          Calculate Targets
        </button>
      </div>

      {/* Main Macro Builder Form */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden card-shadow">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white p-6 md:p-8 space-y-2">
        <h1 className="text-lg md:text-xl font-black flex items-center gap-2 uppercase tracking-wider text-white">
          <Sliders size={20} className="text-[#F3E8FF]" />
          <span>Macro Target Builder</span>
        </h1>
        <p className="text-[#F3E8FF] text-[11px] font-semibold leading-relaxed">
          Define your targets. The PuLP linear programming engine will select ingredients and portion weights to match your goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#374151] uppercase tracking-wider block">Select Macro Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(PRESETS).map((p) => {
              const isSelected = preset === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`py-2.5 px-2 text-center text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9] shadow-sm font-extrabold'
                      : 'bg-white text-[#374151] border-gray-200 hover:bg-[#F3E8FF] hover:text-[#6D28D9] hover:border-[#C4B5FD]'
                  }`}
                >
                  {isSelected && <span>✓</span>}
                  <span>{p.replace('-', ' ').toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders for Protein, Carbs, Fat, Calories */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Protein */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#374151]">Protein Target</span>
              <span className="text-xs font-black text-[#6D28D9] bg-white border border-[#D8B4FE] px-2.5 py-0.5 rounded-lg shadow-xs">{protein}g</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={protein}
              onChange={(e) => { setProtein(e.target.value); setPreset('custom'); }}
              className="w-full accent-[#6D28D9]"
            />
          </div>

          {/* Carbs */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#374151]">Carbs Target</span>
              <span className="text-xs font-black text-[#6D28D9] bg-white border border-[#D8B4FE] px-2.5 py-0.5 rounded-lg shadow-xs">{carbs}g</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              value={carbs}
              onChange={(e) => { setCarbs(e.target.value); setPreset('custom'); }}
              className="w-full accent-[#6D28D9]"
            />
          </div>

          {/* Fat */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#374151]">Fat Target</span>
              <span className="text-xs font-black text-[#6D28D9] bg-white border border-[#D8B4FE] px-2.5 py-0.5 rounded-lg shadow-xs">{fat}g</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={fat}
              onChange={(e) => { setFat(e.target.value); setPreset('custom'); }}
              className="w-full accent-[#6D28D9]"
            />
          </div>

          {/* Calories */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#374151]">Calorie Cap</span>
              <span className="text-xs font-black text-[#6D28D9] bg-white border border-[#D8B4FE] px-2.5 py-0.5 rounded-lg shadow-xs">{calories} kcal</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              value={calories}
              onChange={(e) => { setCalories(e.target.value); setPreset('custom'); }}
              className="w-full accent-[#6D28D9]"
            />
          </div>
        </div>

        {/* Diet Preferences */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#374151] uppercase tracking-wider block">Dietary Preference</label>
          <div className="grid grid-cols-3 gap-3">
            {['veg', 'non-veg', 'vegan'].map((d) => {
              const isSelected = diet === d;
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDiet(d)}
                  className={`py-3 rounded-2xl border text-xs font-bold capitalize transition-all flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-[#F3E8FF] text-[#6D28D9] border-[#6D28D9] ring-2 ring-[#6D28D9] font-black'
                      : 'bg-white text-[#374151] border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isSelected && <span>✓</span>}
                  <span>{d}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergy Filter */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#374151] uppercase tracking-wider block">Exclude Allergens</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAllergyChange('None')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                allergies.length === 0
                  ? 'bg-[#F3E8FF] text-[#6D28D9] border-[#6D28D9] font-black'
                  : 'bg-white text-[#374151] border-gray-200 hover:bg-gray-50'
              }`}
            >
              {allergies.length === 0 && '✓ '}None
            </button>
            {ALLERGIES_LIST.map((allergy) => {
              const isSelected = allergies.includes(allergy);
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => handleAllergyChange(allergy)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-red-50 text-red-700 border-red-300 font-black'
                      : 'bg-white text-[#374151] border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isSelected && '✓ '}{allergy}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prep preference & Budget */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[#374151] uppercase tracking-wider block">Preparation Constraint</label>
            <select
              value={prepPreference}
              onChange={(e) => setPrepPreference(e.target.value)}
              className="block w-full border border-gray-200 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827] transition-all"
            >
              <option value="any">Any Preparation Tier</option>
              <option value="no_cook">Tier 0 Only (No-Cook Assembly)</option>
              <option value="tier_1">Tier 1 & under (Simple Prep)</option>
              <option value="tier_1_5">Tier 1.5 & under (Light Cooking)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-[#374151] uppercase tracking-wider">Max Budget</label>
              <span className="text-xs font-black text-[#6D28D9] bg-[#F3E8FF] border border-[#D8B4FE] px-2.5 py-0.5 rounded-lg">₹{budget}</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full accent-[#6D28D9] mt-2"
            />
          </div>
        </div>

        {/* Complexity Constraint (Min & Max Ingredients) */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Min Ingredients</label>
              <span className="text-xs font-black text-[#6D28D9]">{minIngredients} items</span>
            </div>
            <input
              type="range"
              min="2"
              max="4"
              value={minIngredients}
              onChange={(e) => setMinIngredients(Number(e.target.value))}
              className="w-full accent-[#6D28D9]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Max Ingredients</label>
              <span className="text-xs font-black text-[#6D28D9]">{maxIngredients} items</span>
            </div>
            <input
              type="range"
              min="3"
              max="7"
              value={maxIngredients}
              onChange={(e) => setMaxIngredients(Number(e.target.value))}
              className="w-full accent-[#6D28D9]"
            />
          </div>
        </div>

        {/* Preparation Notes & Chips */}
        <div className="space-y-3">
          <label className="text-xs font-black text-[#374151] uppercase tracking-wider block">Custom Assembly Notes</label>
          <div className="flex flex-wrap gap-2">
            {['Less spice', 'Less salt', 'No onion'].map((chip) => (
              <button
                type="button"
                key={chip}
                onClick={() => addNoteChip(chip)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-[#F3E8FF] hover:text-[#6D28D9] border border-gray-200 rounded-xl text-xs font-bold transition-all"
              >
                + {chip}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add any other preferences (e.g., extra lemon, dressing on side)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full border border-gray-200 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827] transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 font-bold">
            {error}
          </div>
        )}

        {/* Submit FIND MY MEAL button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 md:h-14 bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C1D95] text-white font-bold rounded-2xl shadow-md transition-all text-sm md:text-base flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-white font-bold">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Finding your best meal...</span>
            </span>
          ) : (
            <>
              <ShieldCheck size={20} className="text-white" />
              <span>FIND MY MEAL →</span>
            </>
          )}
        </button>

      </form>
      </div>

      {showCalculator && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl relative transition-brand">
            <button
              type="button"
              onClick={() => setShowCalculator(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-brand z-10"
            >
              <X size={18} />
            </button>
            <div className="p-1">
              <CalorieCalculator
                onApplyCalorieTarget={(cals) => {
                  setCalories(cals);
                  setShowCalculator(false);
                }}
                onApplyProteinTarget={(prot) => {
                  setProtein(prot);
                  setShowCalculator(false);
                }}
                onApplyAllTargets={(cals, prot, carbsVal, fatVal) => {
                  setCalories(cals);
                  setProtein(prot);
                  setCarbs(carbsVal);
                  setFat(fatVal);
                  setShowCalculator(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MacroForm;