// frontend/src/components/CalorieCalculator.jsx

import React, { useState, useEffect } from 'react';
import { Flame, Calculator, Sparkles, User, Dumbbell, ArrowRight } from 'lucide-react';

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise (x1.2)' },
  { id: 'lightly_active', label: 'Lightly Active', desc: 'Exercise 1–3 days/week (x1.375)' },
  { id: 'moderately_active', label: 'Moderately Active', desc: 'Exercise 3–5 days/week (x1.55)' },
  { id: 'very_active', label: 'Very Active', desc: 'Exercise 6–7 days/week (x1.725)' },
  { id: 'extremely_active', label: 'Extremely Active', desc: 'Intense exercise / physical work (x1.9)' }
];

function CalorieCalculator({ onApplyCalorieTarget, onApplyProteinTarget }) {
  // Profile state from localStorage
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('diet_calculator_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [editMode, setEditMode] = useState(!profile);

  // Form input states
  const [height, setHeight] = useState(profile ? profile.height_cm : '');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightFeet, setHeightFeet] = useState(() => {
    if (profile && profile.height_cm) {
      const totalInches = profile.height_cm / 2.54;
      return Math.floor(totalInches / 12).toString();
    }
    return '';
  });
  const [heightInches, setHeightInches] = useState(() => {
    if (profile && profile.height_cm) {
      const totalInches = profile.height_cm / 2.54;
      return Math.round(totalInches % 12).toString();
    }
    return '';
  });
  
  const [weight, setWeight] = useState(profile ? profile.weight_kg : '');
  const [age, setAge] = useState(profile ? profile.age : '');
  const [sex, setSex] = useState(profile ? profile.sex : 'male');
  const [activity, setActivity] = useState(profile ? profile.activity_level : 'sedentary');

  // Keep height state in sync when feet/inches change
  useEffect(() => {
    if (heightUnit === 'ft') {
      const f = parseFloat(heightFeet) || 0;
      const i = parseFloat(heightInches) || 0;
      const cm = Math.round((f * 12 + i) * 2.54);
      setHeight(cm.toString());
    }
  }, [heightFeet, heightInches, heightUnit]);
  
  // Protein helper sub-states
  const [proteinType, setProteinType] = useState('general');

  // Calculation results states
  const [results, setResults] = useState(profile ? {
    bmr: profile.bmr,
    maintenance_calories: profile.maintenance_calories,
    goals: {
      maintenance: profile.maintenance_calories,
      mild_fat_loss: profile.maintenance_calories - 250,
      moderate_fat_loss: profile.maintenance_calories - 500,
      mild_weight_gain: profile.maintenance_calories + 250
    }
  } : null);

  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    const hNum = parseFloat(height);
    const wNum = parseFloat(weight);
    const aNum = parseInt(age);

    if (isNaN(hNum) || hNum < 100 || hNum > 250) {
      setError('Height must be between 100 and 250 cm.');
      return;
    }
    if (isNaN(wNum) || wNum < 25 || wNum > 300) {
      setError('Weight must be between 25 and 300 kg.');
      return;
    }
    if (isNaN(aNum) || aNum < 13 || aNum > 100) {
      setError('Age must be between 13 and 100 years.');
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/nutrition/calculate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height_cm: hNum,
          weight_kg: wNum,
          age: aNum,
          sex: sex,
          activity_level: activity
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate calories.');
      }

      const data = await response.json();
      setResults(data);

      // Default protein target
      const pRatio = proteinType === 'higher' ? 1.6 : 1.2;
      const targetProtein = Math.round(wNum * pRatio);

      // Save profile
      const newProfile = {
        height_cm: hNum,
        weight_kg: wNum,
        age: aNum,
        sex: sex,
        activity_level: activity,
        bmr: data.bmr,
        maintenance_calories: data.maintenance_calories,
        target_calories: data.maintenance_calories,
        protein_target_g: targetProtein,
        last_calculated: 'Today'
      };
      
      localStorage.setItem('diet_calculator_profile', JSON.stringify(newProfile));
      setProfile(newProfile);
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Server error calculating targets.');
    } finally {
      setCalculating(false);
    }
  };

  // Recalculate protein target on toggle
  useEffect(() => {
    if (profile && weight) {
      const pRatio = proteinType === 'higher' ? 1.6 : 1.2;
      const targetProtein = Math.round(parseFloat(weight) * pRatio);
      const updated = { ...profile, protein_target_g: targetProtein };
      localStorage.setItem('diet_calculator_profile', JSON.stringify(updated));
      setProfile(updated);
    }
  }, [proteinType]);

  const handleApplyCalorie = (calories) => {
    onApplyCalorieTarget(calories);
  };

  const handleApplyProtein = () => {
    if (profile) {
      onApplyProteinTarget(profile.protein_target_g);
    }
  };

  if (!editMode && profile && results) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex justify-between items-start border-b border-gray-150 pb-4">
          <div>
            <h3 className="text-base font-black text-qcommerce-black flex items-center gap-1.5">
              <User size={18} className="text-diet-primary" />
              <span>My Nutrition Profile</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Last calculated: {profile.last_calculated}</span>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="text-xs font-bold text-diet-primary hover:underline border border-diet-primary px-3 py-1 rounded-xl"
          >
            Edit Profile
          </button>
        </div>

        {/* Profile Details List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-gray-600">
          <p>Height: <span className="text-gray-900 block font-bold">{profile.height_cm} cm</span></p>
          <p>Weight: <span className="text-gray-900 block font-bold">{profile.weight_kg} kg</span></p>
          <p>Age: <span className="text-gray-900 block font-bold">{profile.age} years</span></p>
          <p>BMR: <span className="text-gray-900 block font-bold">{results.bmr} kcal/day</span></p>
          <p>Maintenance: <span className="text-diet-primary block font-black">{results.maintenance_calories} kcal/day</span></p>
          <p>Activity: <span className="text-gray-900 block font-bold uppercase text-[9px]">{profile.activity_level.replace('_', ' ')}</span></p>
        </div>

        {/* Calorie Goals lanes */}
        <div className="space-y-3 pt-3 border-t border-gray-150">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Goal Calorie Targets</h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            
            {/* Maintenance */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase">Maintenance</span>
                <span className="block text-lg font-black text-qcommerce-black mt-1">⭐ {results.goals.maintenance} kcal/day</span>
              </div>
              <button
                onClick={() => handleApplyCalorie(results.goals.maintenance)}
                className="bg-white border border-diet-primary text-diet-primary font-black py-1.5 rounded-xl hover:bg-diet-light transition-all text-[11px]"
              >
                Use Maintenance Target
              </button>
            </div>

            {/* Mild Fat Loss */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase">Mild Fat Loss (-250 kcal)</span>
                <span className="block text-lg font-black text-qcommerce-black mt-1">⭐ {results.goals.mild_fat_loss} kcal/day</span>
              </div>
              <button
                onClick={() => handleApplyCalorie(results.goals.mild_fat_loss)}
                className="bg-white border border-diet-primary text-diet-primary font-black py-1.5 rounded-xl hover:bg-diet-light transition-all text-[11px]"
              >
                Use Fat Loss Target
              </button>
            </div>

            {/* Moderate Fat Loss */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase">Moderate Fat Loss (-500 kcal)</span>
                <span className="block text-lg font-black text-qcommerce-black mt-1">⭐ {results.goals.moderate_fat_loss} kcal/day</span>
              </div>
              <button
                onClick={() => handleApplyCalorie(results.goals.moderate_fat_loss)}
                className="bg-white border border-diet-primary text-diet-primary font-black py-1.5 rounded-xl hover:bg-diet-light transition-all text-[11px]"
              >
                Use Fat Loss Target
              </button>
            </div>

            {/* Mild Weight Gain */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase">Mild Weight Gain (+250 kcal)</span>
                <span className="block text-lg font-black text-qcommerce-black mt-1">⭐ {results.goals.mild_weight_gain} kcal/day</span>
              </div>
              <button
                onClick={() => handleApplyCalorie(results.goals.mild_weight_gain)}
                className="bg-white border border-diet-primary text-diet-primary font-black py-1.5 rounded-xl hover:bg-diet-light transition-all text-[11px]"
              >
                Use Weight Gain Target
              </button>
            </div>

          </div>
        </div>

        {/* Protein Helper section */}
        <div className="pt-4 border-t border-gray-150 space-y-3">
          <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Protein Target Helper</h4>
          <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="space-y-1.5">
              <div className="flex gap-3 text-xs font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={proteinType === 'general'}
                    onChange={() => setProteinType('general')}
                    className="text-diet-primary focus:ring-diet-primary"
                  />
                  <span>General (1.2g/kg)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={proteinType === 'higher'}
                    onChange={() => setProteinType('higher')}
                    className="text-diet-primary focus:ring-diet-primary"
                  />
                  <span>Higher Protein (1.6g/kg)</span>
                </label>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold">Suggested Target: <b className="text-diet-primary">{profile.protein_target_g}g Protein / day</b></p>
            </div>
            <button
              onClick={handleApplyProtein}
              className="bg-diet-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-diet-dark transition-colors shadow-xs"
            >
              Use Protein Target
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[9px] text-gray-400 font-semibold leading-relaxed">
          ⚠️ Calorie and protein estimates are approximate and based on the Mifflin-St Jeor equation. Actual energy needs can vary between individuals. Consult a professional before starting any calorie deficit.
        </p>

      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 font-sans">
      
      <div className="flex items-center gap-2 border-b border-gray-150 pb-4">
        <Flame className="text-diet-primary animate-pulse animate-duration-1000" />
        <div>
          <h3 className="text-base font-black text-qcommerce-black">Calorie & Nutrition Calculator</h3>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Determine your estimated maintenance requirements.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200 font-semibold">
          {error}
        </div>
      )}

      {/* Calculator input form */}
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Height */}
          <div className="space-y-1 text-xs font-bold text-gray-700">
            <div className="flex justify-between items-center mb-1">
              <span>Height</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setHeightUnit('cm')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${heightUnit === 'cm' ? 'bg-diet-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setHeightUnit('ft')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${heightUnit === 'ft' ? 'bg-diet-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  ft
                </button>
              </div>
            </div>
            
            {heightUnit === 'cm' ? (
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 175"
                className="block w-full border border-gray-200 rounded-xl p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
                required
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ft"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="block w-1/2 border border-gray-200 rounded-xl p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
                  min="3"
                  max="8"
                  required
                />
                <input
                  type="number"
                  placeholder="in"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="block w-1/2 border border-gray-200 rounded-xl p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
                  min="0"
                  max="11"
                  required
                />
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="space-y-1 text-xs font-bold text-gray-700">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75"
              className="block w-full border border-gray-200 rounded-xl p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
              required
            />
          </div>

          {/* Age */}
          <div className="space-y-1 text-xs font-bold text-gray-700">
            <label htmlFor="age">Age (years)</label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 21"
              className="block w-full border border-gray-200 rounded-xl p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
              required
            />
          </div>
        </div>

        {/* Biological sex selection */}
        <div className="space-y-1.5 text-xs font-bold text-gray-700">
          <span className="block">Biological Sex</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="radio"
                name="sex"
                checked={sex === 'male'}
                onChange={() => setSex('male')}
                className="text-diet-primary focus:ring-diet-primary"
              />
              <span>Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="radio"
                name="sex"
                checked={sex === 'female'}
                onChange={() => setSex('female')}
                className="text-diet-primary focus:ring-diet-primary"
              />
              <span>Female</span>
            </label>
          </div>
        </div>

        {/* Activity Selection dropdown */}
        <div className="space-y-1 text-xs font-bold text-gray-700">
          <label htmlFor="activity">Activity Level</label>
          <select
            id="activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl p-2.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-diet-primary focus:border-transparent font-semibold"
          >
            {ACTIVITY_LEVELS.map(lvl => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.label} — {lvl.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={calculating}
            className="w-full bg-diet-primary text-white font-black py-2.5 rounded-xl hover:bg-diet-dark transition-all text-xs shadow-sm flex items-center justify-center gap-1.5"
          >
            <Calculator size={14} />
            <span>{calculating ? 'Calculating...' : 'Calculate Maintenance Calories'}</span>
          </button>
          {profile && (
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="bg-gray-150 border border-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

    </div>
  );
}

export default CalorieCalculator;
