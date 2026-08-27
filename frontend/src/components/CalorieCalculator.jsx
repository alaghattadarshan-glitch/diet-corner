// frontend/src/components/CalorieCalculator.jsx

import React, { useState, useEffect } from 'react';
import { Flame, Calculator, User, Zap, Activity } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { API_BASE_URL } from '../apiConfig';

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', multiplier: 1.2 },
  { id: 'lightly_active', label: 'Lightly Active', desc: 'Exercise 1–3 days/week', multiplier: 1.375 },
  { id: 'moderately_active', label: 'Moderately Active', desc: 'Exercise 3–5 days/week', multiplier: 1.55 },
  { id: 'very_active', label: 'Very Active', desc: 'Exercise 6–7 days/week', multiplier: 1.725 },
  { id: 'extremely_active', label: 'Extremely Active', desc: 'Intense exercise / physical job', multiplier: 1.9 }
];

function CalorieCalculator({ onApplyCalorieTarget, onApplyProteinTarget, onApplyAllTargets }) {
  const { customerId } = useRole();

  // Unified Profile state from localStorage
  const [profile, setProfile] = useState(() => {
    const custSaved = customerId ? localStorage.getItem(`customer_profile_${customerId}`) : null;
    const calcSaved = localStorage.getItem('diet_calculator_profile');
    const raw = custSaved || calcSaved;
    return raw ? JSON.parse(raw) : null;
  });

  const [editMode, setEditMode] = useState(!profile);
  const [activeStep, setActiveStep] = useState(1); // 1: Height, 2: Weight, 3: Age, 4: Sex, 5: Activity

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
  
  const [proteinType, setProteinType] = useState('general');

  // Calculation results states
  const [results, setResults] = useState(profile ? {
    bmr: profile.bmr || Math.round(10 * (profile.weight_kg || 70) + 6.25 * (profile.height_cm || 175) - 5 * (profile.age || 25) + (profile.sex === 'male' ? 5 : -161)),
    maintenance_calories: profile.maintenance_calories || 2000,
    goals: {
      maintenance: profile.maintenance_calories || 2000,
      mild_fat_loss: (profile.maintenance_calories || 2000) - 250,
      moderate_fat_loss: (profile.maintenance_calories || 2000) - 500,
      mild_weight_gain: (profile.maintenance_calories || 2000) + 250
    }
  } : null);

  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    const hNum = parseFloat(height);
    const wNum = parseFloat(weight);
    const aNum = parseInt(age);

    if (isNaN(hNum) || hNum < 100 || hNum > 250) {
      setError('Height must be between 100 and 250 cm.');
      setActiveStep(1);
      return;
    }
    if (isNaN(wNum) || wNum < 25 || wNum > 300) {
      setError('Weight must be between 25 and 300 kg.');
      setActiveStep(2);
      return;
    }
    if (isNaN(aNum) || aNum < 13 || aNum > 100) {
      setError('Age must be between 13 and 100 years.');
      setActiveStep(3);
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/nutrition/calculate-calories`, {
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
        const errData = await response.json().catch(() => ({}));
        let errMsg = 'Failed to calculate calories.';
        if (errData && errData.detail) {
          if (Array.isArray(errData.detail)) {
            errMsg = errData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
          } else {
            errMsg = errData.detail;
          }
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResults(data);

      const pRatio = proteinType === 'higher' ? 1.6 : 1.2;
      const targetProtein = Math.round(wNum * pRatio);

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
      if (customerId) {
        localStorage.setItem(`customer_profile_${customerId}`, JSON.stringify(newProfile));
      }
      setProfile(newProfile);
      setEditMode(false);
      setActiveStep(1);
    } catch (err) {
      setError(err.message || 'Server error calculating targets.');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (profile && weight) {
      const pRatio = proteinType === 'higher' ? 1.6 : 1.2;
      const targetProtein = Math.round(parseFloat(weight) * pRatio);
      const updated = { ...profile, protein_target_g: targetProtein };
      localStorage.setItem('diet_calculator_profile', JSON.stringify(updated));
      if (customerId) {
        localStorage.setItem(`customer_profile_${customerId}`, JSON.stringify(updated));
      }
      setProfile(updated);
    }
  }, [proteinType]);

  const handleApplyCalorie = (calories) => {
    if (onApplyCalorieTarget) {
      onApplyCalorieTarget(calories);
    }
  };

  const handleApplyProtein = () => {
    if (profile && onApplyProteinTarget) {
      onApplyProteinTarget(profile.protein_target_g);
    }
  };

  const handleApplyAll = (calories) => {
    // 30% Protein, 45% Carbs, 25% Fat standard macro split
    const protG = Math.round((calories * 0.30) / 4);
    const carbsG = Math.round((calories * 0.45) / 4);
    const fatG = Math.round((calories * 0.25) / 9);

    if (onApplyAllTargets) {
      onApplyAllTargets(calories, protG, carbsG, fatG);
    } else {
      if (onApplyCalorieTarget) onApplyCalorieTarget(calories);
      if (onApplyProteinTarget) onApplyProteinTarget(protG);
    }
  };

  const nextStep = () => {
    if (activeStep === 1) {
      const hNum = parseFloat(height);
      if (isNaN(hNum) || hNum < 100 || hNum > 250) {
        setError('Please enter a valid height between 100 and 250 cm.');
        return;
      }
    }
    if (activeStep === 2) {
      const wNum = parseFloat(weight);
      if (isNaN(wNum) || wNum < 25 || wNum > 300) {
        setError('Please enter a valid weight between 25 and 300 kg.');
        return;
      }
    }
    if (activeStep === 3) {
      const aNum = parseInt(age);
      if (isNaN(aNum) || aNum < 13 || aNum > 100) {
        setError('Please enter a valid age between 13 and 100.');
        return;
      }
    }
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setActiveStep(prev => prev - 1);
  };

  // Helper for height display string
  const formatHeight = (cm) => {
    if (!cm) return '--';
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${cm} cm (${feet}'${inches}")`;
  };

  const currentActivityObj = ACTIVITY_LEVELS.find(a => a.id === (profile?.activity_level || 'sedentary'));

  if (!editMode && profile && results) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <User size={16} className="text-[#6D28D9]" />
              <span>Personalized Nutrition Parameters</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-bold block">Engine: Mifflin-St Jeor Formula</span>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="text-xs font-bold text-[#6D28D9] border border-[#D8B4FE] bg-[#F3E8FF] px-3.5 py-1.5 rounded-xl hover:bg-[#E9D5FF] transition-all"
          >
            Edit Parameters
          </button>
        </div>

        {/* Complete Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-xs font-semibold">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Height</span>
            <span className="text-gray-900 font-extrabold text-sm block mt-0.5">{formatHeight(profile.height_cm)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Weight</span>
            <span className="text-gray-900 font-extrabold text-sm block mt-0.5">{profile.weight_kg} kg</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Age & Sex</span>
            <span className="text-gray-900 font-extrabold text-sm block mt-0.5">{profile.age} yrs • {profile.sex === 'female' ? 'Female' : 'Male'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Activity Level</span>
            <span className="text-gray-900 font-extrabold text-xs block mt-0.5">{currentActivityObj?.label || 'Sedentary'} (x{currentActivityObj?.multiplier || 1.2})</span>
          </div>
        </div>

        {/* Calculated Energy Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-500 uppercase block">Basal Metabolic Rate (BMR)</span>
              <span className="text-base font-black text-gray-900 block">{results.bmr} <span className="text-xs font-semibold text-gray-500">kcal/day</span></span>
              <span className="text-[9px] text-gray-400 block">Energy required at total rest</span>
            </div>
          </div>

          <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-500 uppercase block">Maintenance (TDEE)</span>
              <span className="text-base font-black text-[#166534] block">{results.maintenance_calories} <span className="text-xs font-semibold text-gray-500">kcal/day</span></span>
              <span className="text-[9px] text-gray-400 block">Energy required to maintain weight</span>
            </div>
          </div>
        </div>

        {/* Calorie & Macro Target Goals */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Calculated Calorie & Macro Goals</h4>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            
            {[
              { id: 'maintenance', label: 'Maintain Weight', diff: '0 kcal', cals: results.goals.maintenance, badge: '⚡ Stable' },
              { id: 'mild_fat_loss', label: 'Mild Fat Loss', diff: '-250 kcal', cals: results.goals.mild_fat_loss, badge: '🔥 Recommended' },
              { id: 'moderate_fat_loss', label: 'Moderate Fat Loss', diff: '-500 kcal', cals: results.goals.moderate_fat_loss, badge: '💪 Aggressive' },
              { id: 'mild_weight_gain', label: 'Mild Weight Gain', diff: '+250 kcal', cals: results.goals.mild_weight_gain, badge: '📈 Muscle Gain' },
            ].map((goal) => {
              const pG = Math.round((goal.cals * 0.30) / 4);
              const cG = Math.round((goal.cals * 0.45) / 4);
              const fG = Math.round((goal.cals * 0.25) / 9);

              return (
                <div key={goal.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[#C4B5FD] transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider">{goal.label} ({goal.diff})</span>
                      <span className="text-[9px] font-bold bg-[#F3E8FF] text-[#6D28D9] px-2 py-0.5 rounded-md">{goal.badge}</span>
                    </div>
                    <span className="block text-lg font-black text-gray-900">{goal.cals} <span className="text-xs font-bold text-gray-500">kcal/day</span></span>
                    
                    {/* Calculated Macro Breakdown Parameters */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 bg-white p-2 rounded-xl border border-gray-200 text-[10px] text-center font-bold">
                      <div className="text-[#6D28D9]">
                        <span className="block text-[8px] uppercase text-gray-400">Protein</span>
                        <span>{pG}g</span>
                      </div>
                      <div className="text-[#0284C7]">
                        <span className="block text-[8px] uppercase text-gray-400">Carbs</span>
                        <span>{cG}g</span>
                      </div>
                      <div className="text-[#D97706]">
                        <span className="block text-[8px] uppercase text-gray-400">Fat</span>
                        <span>{fG}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyAll(goal.cals)}
                      className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold py-2 rounded-xl transition-all text-xs shadow-xs"
                    >
                      Apply All Parameters (Cals + Macros)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCalorie(goal.cals)}
                      className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-1.5 rounded-xl hover:bg-gray-100 transition-all text-[11px]"
                    >
                      Use Calories Only ({goal.cals} kcal)
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Protein Helper section */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Protein Target Helper</h4>
          <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="space-y-1.5">
              <div className="flex gap-4 text-xs font-bold text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={proteinType === 'general'}
                    onChange={() => setProteinType('general')}
                    className="text-[#6D28D9] focus:ring-[#6D28D9]"
                  />
                  <span>General (1.2g/kg)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={proteinType === 'higher'}
                    onChange={() => setProteinType('higher')}
                    className="text-[#6D28D9] focus:ring-[#6D28D9]"
                  />
                  <span>Higher Protein (1.6g/kg)</span>
                </label>
              </div>
              <p className="text-[11px] text-gray-600 font-semibold">Suggested Daily Protein: <b className="text-[#6D28D9]">{profile.protein_target_g}g Protein / day</b></p>
            </div>
            <button
              type="button"
              onClick={handleApplyProtein}
              className="bg-[#6D28D9] text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-all shadow-xs"
            >
              Use Protein Target Only
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
          ⚠️ Energy and macro targets are calculated using the Mifflin-St Jeor formula and standard macronutrient distribution ratios (30% Protein, 45% Carbs, 25% Fat).
        </p>

      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 card-shadow space-y-6 font-sans">
      
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <Flame className="text-[#6D28D9] animate-pulse" />
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Nutrition Calculator</h3>
          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Determine your estimated maintenance requirements and macros.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 font-bold">
          {error}
        </div>
      )}

      {/* Stepper Progress bar */}
      <div className="flex justify-between items-center text-xs font-bold text-gray-400 px-4">
        {[1, 2, 3, 4, 5].map(stepNum => (
          <span
            key={stepNum}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
              stepNum === activeStep 
                ? 'bg-[#6D28D9] text-white border-[#6D28D9] scale-110 shadow-xs' 
                : stepNum < activeStep 
                  ? 'bg-[#F3E8FF] text-[#6D28D9] border-[#D8B4FE]' 
                  : 'bg-white border-gray-200'
            }`}
          >
            {stepNum}
          </span>
        ))}
      </div>

      {/* Calculator step layouts */}
      <div className="py-4 min-h-[120px] flex items-center">
        {activeStep === 1 && (
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-gray-700 uppercase">STEP 1: Height</label>
              <div className="flex gap-1.5 bg-gray-50 border border-gray-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHeightUnit('cm')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${heightUnit === 'cm' ? 'bg-[#6D28D9] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setHeightUnit('ft')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${heightUnit === 'ft' ? 'bg-[#6D28D9] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  ft
                </button>
              </div>
            </div>
            
            {heightUnit === 'cm' ? (
              <div className="flex gap-2">
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height in cm (e.g. 175)"
                  className="block w-full border border-gray-200 rounded-2xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-bold"
                  required
                />
                <span className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-black flex items-center text-gray-500">cm</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-1/2 flex gap-1 items-center">
                  <input
                    type="number"
                    placeholder="5"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="block w-full border border-gray-200 rounded-2xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-bold text-center"
                    min="3"
                    max="8"
                    required
                  />
                  <span className="text-xs font-black text-gray-500">ft</span>
                </div>
                <div className="w-1/2 flex gap-1 items-center">
                  <input
                    type="number"
                    placeholder="9"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="block w-full border border-gray-200 rounded-2xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-bold text-center"
                    min="0"
                    max="11"
                    required
                  />
                  <span className="text-xs font-black text-gray-500">in</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeStep === 2 && (
          <div className="w-full space-y-3">
            <label htmlFor="weight" className="text-xs font-black text-gray-700 uppercase block">STEP 2: Weight</label>
            <div className="flex gap-2">
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight in kg (e.g. 75)"
                className="block w-full border border-gray-200 rounded-2xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-bold"
                required
              />
              <span className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-black flex items-center text-gray-500">kg</span>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="w-full space-y-3">
            <label htmlFor="age" className="text-xs font-black text-gray-700 uppercase block">STEP 3: Age</label>
            <div className="flex gap-2">
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age in years (e.g. 21)"
                className="block w-full border border-gray-200 rounded-2xl p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-bold"
                required
              />
              <span className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-black flex items-center text-gray-500">years</span>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="w-full space-y-3">
            <span className="text-xs font-black text-gray-700 uppercase block">STEP 4: Biological Sex</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSex('male')}
                className={`py-3.5 border-2 rounded-2xl font-black text-xs transition-all ${
                  sex === 'male' 
                    ? 'border-[#6D28D9] bg-[#F3E8FF] text-[#6D28D9]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setSex('female')}
                className={`py-3.5 border-2 rounded-2xl font-black text-xs transition-all ${
                  sex === 'female' 
                    ? 'border-[#6D28D9] bg-[#F3E8FF] text-[#6D28D9]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                Female
              </button>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="w-full space-y-3">
            <span className="text-xs font-black text-gray-700 uppercase block">STEP 5: Daily Activity Level</span>
            <div className="grid gap-2">
              {ACTIVITY_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setActivity(lvl.id)}
                  className={`text-left p-3 border-2 rounded-2xl transition-all flex justify-between items-center ${
                    activity === lvl.id 
                      ? 'border-[#6D28D9] bg-[#F3E8FF]' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-gray-900">{lvl.label} (x{lvl.multiplier})</span>
                    <span className="block text-[10px] text-gray-500 font-semibold mt-0.5">{lvl.desc}</span>
                  </div>
                  {activity === lvl.id && (
                    <span className="w-4 h-4 rounded-full bg-[#6D28D9] border-4 border-[#F3E8FF]"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="pt-2 flex justify-between items-center gap-3">
        {activeStep > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-xs"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        
        {activeStep < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-[#6D28D9] text-white font-black px-6 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-all text-xs shadow-xs"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCalculate}
            disabled={calculating}
            className="bg-[#6D28D9] text-white font-black px-6 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-all text-xs shadow-xs flex items-center gap-1.5"
          >
            <Calculator size={14} />
            <span>{calculating ? 'Calculating...' : 'Calculate Results'}</span>
          </button>
        )}
      </div>

    </div>
  );
}

export default CalorieCalculator;