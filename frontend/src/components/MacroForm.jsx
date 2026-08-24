// frontend/src/components/MacroForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sliders, HelpCircle, ShieldCheck } from 'lucide-react';
import CalorieCalculator from './CalorieCalculator';

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

  // Handle preset URL parameter
  useEffect(() => {
    const urlPreset = searchParams.get('preset');
    if (urlPreset && PRESETS[urlPreset]) {
      applyPreset(urlPreset);
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
      const response = await fetch('http://127.0.0.1:8000/api/match-meal', {
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
    <div className="grid md:grid-cols-5 gap-8 max-w-5xl mx-auto items-start">
      
      {/* Calorie & Protein Target Calculator */}
      <div className="md:col-span-2">
        <CalorieCalculator
          onApplyCalorieTarget={(cals) => setCalories(cals)}
          onApplyProteinTarget={(prot) => setProtein(prot)}
        />
      </div>

      {/* Main Macro Builder Form */}
      <div className="md:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Header Banner */}
      <div className="bg-diet-dark text-white p-6 md:p-8 space-y-2">
        <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
          <Sliders size={22} className="text-yellow-300" />
          <span>Macro Target Builder</span>
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm">
          Define your targets. The PuLP linear programming engine will select ingredients andportion weights to match your goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">Select Macro Preset</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(PRESETS).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => applyPreset(p)}
                className={`py-2 px-1 text-center text-xs font-bold rounded-lg border transition-all ${
                  preset === p
                    ? 'bg-diet-primary text-white border-diet-primary shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders for Protein, Carbs, Fat, Calories */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Protein */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Protein</span>
              <span className="text-xs font-black text-diet-primary">{protein}g</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={protein}
              onChange={(e) => { setProtein(e.target.value); setPreset('custom'); }}
              className="w-full accent-diet-primary"
            />
          </div>

          {/* Carbs */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Carbs</span>
              <span className="text-xs font-black text-blue-600">{carbs}g</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              value={carbs}
              onChange={(e) => { setCarbs(e.target.value); setPreset('custom'); }}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Fat */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Fat</span>
              <span className="text-xs font-black text-amber-500">{fat}g</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={fat}
              onChange={(e) => { setFat(e.target.value); setPreset('custom'); }}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Calories */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Calories</span>
              <span className="text-xs font-black text-red-500">{calories} kcal</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              value={calories}
              onChange={(e) => { setCalories(e.target.value); setPreset('custom'); }}
              className="w-full accent-red-500"
            />
          </div>
        </div>

        {/* Diet Preferences */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">Dietary Preference</label>
          <div className="grid grid-cols-3 gap-3">
            {['veg', 'non-veg', 'vegan'].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDiet(d)}
                className={`py-2.5 rounded-xl border text-xs font-extrabold capitalize transition-all ${
                  diet === d
                    ? 'bg-diet-light text-diet-primary border-diet-primary ring-1 ring-diet-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Allergy Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">Exclude Allergens</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAllergyChange('None')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                allergies.length === 0
                  ? 'bg-diet-light text-diet-primary border-diet-primary'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              None
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
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prep preference & Budget */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 block">Preparation Constraint</label>
            <select
              value={prepPreference}
              onChange={(e) => setPrepPreference(e.target.value)}
              className="block w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-diet-primary focus:border-diet-primary"
            >
              <option value="any">Any Preparation Tier</option>
              <option value="no_cook">Tier 0 Only (No-Cook Assembly)</option>
              <option value="tier_1">Tier 1 & under (Simple Prep)</option>
              <option value="tier_1_5">Tier 1.5 & under (Light Cooking)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Max Budget</label>
              <span className="text-xs font-extrabold text-qcommerce-black">₹{budget}</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full accent-qcommerce-black mt-2"
            />
          </div>
        </div>

        {/* Complexity Constraint (Min & Max Ingredients) */}
        <div className="grid sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Min Ingredients</label>
              <span className="text-xs font-extrabold text-diet-primary">{minIngredients} items</span>
            </div>
            <input
              type="range"
              min="2"
              max="4"
              value={minIngredients}
              onChange={(e) => setMinIngredients(Number(e.target.value))}
              className="w-full accent-diet-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700">Max Ingredients</label>
              <span className="text-xs font-extrabold text-diet-primary">{maxIngredients} items</span>
            </div>
            <input
              type="range"
              min="3"
              max="7"
              value={maxIngredients}
              onChange={(e) => setMaxIngredients(Number(e.target.value))}
              className="w-full accent-diet-primary"
            />
          </div>
        </div>

        {/* Preparation Notes & Chips */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700 block">Preparation Customizations / Notes</label>
          <div className="flex flex-wrap gap-2">
            {['Less spice', 'Less salt', 'No onion'].map((chip) => (
              <button
                type="button"
                key={chip}
                onClick={() => addNoteChip(chip)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all"
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
            className="block w-full border border-gray-300 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-diet-primary focus:border-diet-primary"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-200 font-semibold">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-diet-primary hover:bg-diet-dark text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Analyzing inventory and building your meal...
            </span>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Find My Meal</span>
            </>
          )}
        </button>

      </form>
      </div>
    </div>
  );
}

export default MacroForm;
