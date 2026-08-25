import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { User, Activity, Flame, Target, Edit3, Check, RefreshCw, Scale, Ruler } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const ACTIVITY_MULTIPLIERS = {
  sedentary: { label: 'Sedentary (Little or no exercise)', value: 1.2 },
  lightly_active: { label: 'Lightly Active (1-3 days/week)', value: 1.375 },
  moderately_active: { label: 'Moderately Active (3-5 days/week)', value: 1.55 },
  very_active: { label: 'Very Active (6-7 days/week)', value: 1.725 },
  extremely_active: { label: 'Extra Active (Hard exercise & physical job)', value: 1.9 }
};

function Profile() {
  const { customerId } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft_in'
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  const [selectedGoal, setSelectedGoal] = useState('maintenance');

  // Calculated Results
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
  const [targetCalories, setTargetCalories] = useState(null);
  const [targetProtein, setTargetProtein] = useState(null);
  const [targetCarbs, setTargetCarbs] = useState(null);
  const [targetFat, setTargetFat] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [customerId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // First check local storage for customer_profile
      const localData = localStorage.getItem(`customer_profile_${customerId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        populateFields(parsed);
      } else {
        // Try backend
        const res = await fetch(`${API_BASE_URL}/api/nutrition/profile?user_id=${customerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.user_id) {
            populateFields(data);
          }
        }
      }
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (data) => {
    setProfile(data);
    setName(data.name || 'Customer');
    setAge(data.age || '');
    setSex(data.sex || 'male');
    setHeightCm(data.height_cm || '');
    setWeightKg(data.weight_kg || '');
    setActivityLevel(data.activity_level || 'moderately_active');
    setSelectedGoal(data.selected_goal || 'maintenance');
    setBmr(data.bmr);
    setTdee(data.maintenance_calories);
    setTargetCalories(data.target_calories);
    setTargetProtein(data.protein_target_g);
    setTargetCarbs(data.carbs_target_g);
    setTargetFat(data.fat_target_g);

    if (data.height_cm) {
      const totalInches = data.height_cm / 2.54;
      setHeightFt(Math.floor(totalInches / 12).toString());
      setHeightIn(Math.round(totalInches % 12).toString());
    }
  };

  const calculateNutrition = (hCm, wKg, aNum, sVal, actKey, goalKey) => {
    // Mifflin-St Jeor formula
    let calculatedBmr = 0;
    if (sVal === 'male') {
      calculatedBmr = 10 * wKg + 6.25 * hCm - 5 * aNum + 5;
    } else {
      calculatedBmr = 10 * wKg + 6.25 * hCm - 5 * aNum - 161;
    }

    const multiplier = ACTIVITY_MULTIPLIERS[actKey]?.value || 1.2;
    const calculatedTdee = Math.round(calculatedBmr * multiplier);

    let targetCal = calculatedTdee;
    if (goalKey === 'fat_loss') targetCal = Math.round(calculatedTdee - 500);
    else if (goalKey === 'mild_fat_loss') targetCal = Math.round(calculatedTdee - 250);
    else if (goalKey === 'weight_gain') targetCal = Math.round(calculatedTdee + 250);

    // Standard macros: 30% Protein, 45% Carbs, 25% Fat
    const proteinG = Math.round((targetCal * 0.30) / 4);
    const carbsG = Math.round((targetCal * 0.45) / 4);
    const fatG = Math.round((targetCal * 0.25) / 9);

    return {
      bmr: Math.round(calculatedBmr),
      tdee: calculatedTdee,
      targetCal,
      proteinG,
      carbsG,
      fatG
    };
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    const ageNum = parseInt(age, 10);
    if (!ageNum || ageNum < 12 || ageNum > 100) {
      setError('Please enter a valid age between 12 and 100.');
      return;
    }

    const weightNum = parseFloat(weightKg);
    if (!weightNum || weightNum < 30 || weightNum > 300) {
      setError('Please enter a valid weight in kg (30 - 300kg).');
      return;
    }

    let finalHeightCm = 0;
    if (heightUnit === 'cm') {
      finalHeightCm = parseFloat(heightCm);
      if (!finalHeightCm || finalHeightCm < 100 || finalHeightCm > 250) {
        setError('Please enter a valid height in cm (100 - 250cm).');
        return;
      }
    } else {
      const ft = parseInt(heightFt, 10) || 0;
      const inch = parseInt(heightIn, 10) || 0;
      if (ft < 3 || ft > 8 || inch < 0 || inch > 11) {
        setError('Please enter a valid height in feet & inches.');
        return;
      }
      finalHeightCm = Math.round((ft * 12 + inch) * 2.54);
      setHeightCm(finalHeightCm.toString());
    }

    setSaving(true);

    const calc = calculateNutrition(finalHeightCm, weightNum, ageNum, sex, activityLevel, selectedGoal);

    const profileData = {
      user_id: customerId,
      name: name || 'Customer',
      age: ageNum,
      sex,
      height_cm: finalHeightCm,
      weight_kg: weightNum,
      activity_level: activityLevel,
      bmr: calc.bmr,
      maintenance_calories: calc.tdee,
      selected_goal: selectedGoal,
      target_calories: calc.targetCal,
      protein_target_g: calc.proteinG,
      carbs_target_g: calc.carbsG,
      fat_target_g: calc.fatG
    };

    setBmr(calc.bmr);
    setTdee(calc.tdee);
    setTargetCalories(calc.targetCal);
    setTargetProtein(calc.proteinG);
    setTargetCarbs(calc.carbsG);
    setTargetFat(calc.fatG);
    setProfile(profileData);

    // Store in localStorage
    localStorage.setItem(`customer_profile_${customerId}`, JSON.stringify(profileData));

    // Send to backend
    try {
      await fetch(`${API_BASE_URL}/api/nutrition/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
    } catch (e) {
      console.error("Backend profile sync warning:", e);
    } finally {
      setSaving(false);
      setShowEditModal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <span className="animate-spin inline-block h-6 w-6 border-2 border-[#6D28D9] border-t-transparent rounded-full mb-2"></span>
        <p className="text-xs text-gray-500 font-bold">Loading your nutrition profile...</p>
      </div>
    );
  }

  // FIRST TIME CREATION WIZARD (No Profile Exists)
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 font-sans text-gray-800">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 card-shadow space-y-6">
          <div className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white p-6 rounded-2xl space-y-2">
            <h1 className="text-xl font-black flex items-center gap-2 uppercase tracking-wider text-white">
              <User size={22} className="text-[#F3E8FF]" />
              <span>Create Your Nutrition Profile</span>
            </h1>
            <p className="text-xs text-[#F3E8FF] font-semibold leading-relaxed">
              We calculate your BMR and maintenance calories using the Mifflin-St Jeor equation. No fake demo profile data is loaded.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="font-bold text-[#374151] block mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Darshan Prabhu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Age (Years)</label>
                <input
                  type="number"
                  required
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
                />
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Biological Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Height CM / Feet+Inches Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[#374151] flex items-center gap-1">
                  <Ruler size={14} className="text-[#6D28D9]" />
                  <span>Height</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      heightUnit === 'cm' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft_in')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      heightUnit === 'ft_in' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Feet + Inches
                  </button>
                </div>
              </div>

              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  required
                  placeholder="175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Feet (e.g. 5)"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
                  />
                  <input
                    type="number"
                    placeholder="Inches (e.g. 9)"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-[#374151] flex items-center gap-1 mb-1">
                <Scale size={14} className="text-[#6D28D9]" />
                <span>Weight (kg)</span>
              </label>
              <input
                type="number"
                required
                placeholder="75"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
              />
            </div>

            <div>
              <label className="font-bold text-[#374151] block mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#6D28D9] focus:border-[#6D28D9] bg-white text-[#111827]"
              >
                {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {saving ? 'Calculating Profile...' : 'Calculate My Calories & Save Profile'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // EXISTING PROFILE DISPLAY VIEW
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-gray-800 space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 card-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] flex items-center justify-center text-[#6D28D9] font-black text-2xl">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <span className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider block">Customer Profile</span>
            <h1 className="text-xl font-black text-[#111827]">{profile.name || 'Customer'}</h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              {profile.age} yrs • {profile.sex?.toUpperCase()} • {profile.height_cm} cm • {profile.weight_kg} kg
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="px-5 py-2.5 bg-white border-2 border-[#6D28D9] text-[#6D28D9] hover:bg-[#F3E8FF] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
        >
          <Edit3 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Energy & Calories Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* BMR */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#4B5563] uppercase tracking-wider">BMR (Basal Metabolic)</span>
            <Flame size={18} className="text-[#6D28D9]" />
          </div>
          <span className="text-3xl font-black text-[#111827] block">{bmr} <span className="text-xs text-gray-500 font-bold">kcal/day</span></span>
          <p className="text-[10px] text-gray-500 font-medium">Calories burned at complete rest.</p>
        </div>

        {/* Maintenance / TDEE */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#4B5563] uppercase tracking-wider">TDEE / Maintenance</span>
            <Activity size={18} className="text-[#16A34A]" />
          </div>
          <span className="text-3xl font-black text-[#16A34A] block">{tdee} <span className="text-xs text-gray-500 font-bold">kcal/day</span></span>
          <p className="text-[10px] text-gray-500 font-medium">Daily calories to maintain current weight.</p>
        </div>

        {/* Selected Goal Target */}
        <div className="bg-[#F3E8FF] border border-[#D8B4FE] rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#6D28D9] uppercase tracking-wider">Target Calorie Cap</span>
            <Target size={18} className="text-[#6D28D9]" />
          </div>
          <span className="text-3xl font-black text-[#6D28D9] block">{targetCalories || tdee} <span className="text-xs text-[#6D28D9] font-bold">kcal/day</span></span>
          <p className="text-[10px] text-[#4B5563] font-medium capitalize">Current Goal: {profile.selected_goal?.replace('_', ' ') || 'maintenance'}</p>
        </div>

      </div>

      {/* Suggested Macros Breakdown */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm card-shadow space-y-4">
        <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider">Calculated Macro Target</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
            <span className="text-2xl font-black text-[#6D28D9] block">{targetProtein || 45}g</span>
            <span className="text-[10px] text-[#6D28D9] font-bold uppercase block">Protein</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <span className="text-2xl font-black text-blue-700 block">{targetCarbs || 60}g</span>
            <span className="text-[10px] text-blue-700 font-bold uppercase block">Carbs</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <span className="text-2xl font-black text-amber-700 block">{targetFat || 15}g</span>
            <span className="text-[10px] text-amber-700 font-bold uppercase block">Fat</span>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-xl space-y-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">Edit Nutrition Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base px-2"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Height conversion toggle */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[#374151]">Height</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        heightUnit === 'cm' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      CM
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('ft_in')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        heightUnit === 'ft_in' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Feet/Inches
                    </button>
                  </div>
                </div>

                {heightUnit === 'cm' ? (
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Feet"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                    />
                    <input
                      type="number"
                      placeholder="Inches"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                />
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                >
                  {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                    <option key={key} value={key}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Calorie Goal</label>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold bg-white text-[#111827]"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="mild_fat_loss">Mild Fat Loss (-250 kcal)</option>
                  <option value="fat_loss">Moderate Fat Loss (-500 kcal)</option>
                  <option value="weight_gain">Mild Weight Gain (+250 kcal)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  {saving ? 'Recalculating...' : 'Recalculate & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;