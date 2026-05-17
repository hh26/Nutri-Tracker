import React, { useState } from 'react';
import { Target, X, Calculator, Ruler, Weight, Activity, User } from 'lucide-react';

export default function GoalCalculator({ onSaveGoal }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('1.2'); 
  
  const [result, setResult] = useState(null);

  const calculateCalories = (e) => {
    e.preventDefault();
    
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const act = parseFloat(activity);

    if (!w || !h || !a) return;

    // Mifflin-St Jeor Equation for BMR
    let bmr;
    if (gender === 'male') {
      bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    // Multiply by activity level to get TDEE
    const tdee = Math.round(bmr * act);
    setResult(tdee);
  };

  const handleSave = () => {
    if (result && onSaveGoal) {
      const proteinTarget = Math.round(parseFloat(weight) * 1.5);
      localStorage.setItem('userProteinGoal', proteinTarget);
      onSaveGoal(result);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button (Floating Top Right - Matches Dashboard styling) */}
      <div className="absolute top-6 right-6 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 font-bold py-2 px-3.5 rounded-full shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-sm"
        >
          <Target className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline">Set Goal</span>
        </button>
      </div>

      {/* Clean Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          
          {/* Modal Container */}
          <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Header Area */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2.5 rounded-2xl border border-green-100 text-green-600 shadow-sm transform -rotate-3">
                  <Calculator className="w-6 h-6 rotate-3" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Calorie Goal</h2>
                  <p className="text-xs text-slate-500 font-medium">Calculate maintenance target</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Content Area */}
            <div className="px-6 py-6 bg-white max-h-[70vh] overflow-y-auto">
              
              {result ? (
                <div className="text-center space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-inner">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Your Daily Goal</p>
                    <div className="text-5xl font-extrabold text-green-500 tracking-tight">
                      {result}
                    </div>
                    <p className="text-slate-400 font-medium mt-2">kcal / day</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setResult(null)} 
                      className="flex-1 py-3.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Recalculate
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-3.5 bg-green-500 text-white font-bold rounded-xl shadow-md hover:bg-green-600 hover:shadow-lg active:scale-95 transition-all"
                    >
                      Apply Goal
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={calculateCalories} className="space-y-4">
                  
                  {/* Gender Toggle */}
                  <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === 'male' ? 'bg-white text-green-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Male</button>
                    <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === 'female' ? 'bg-white text-green-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Female</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Age Input */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1">Age</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                        <input type="number" required min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 font-semibold transition-all" placeholder="Years" />
                      </div>
                    </div>

                    {/* Height Input */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1">Height</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Ruler className="h-4 w-4 text-slate-400" /></div>
                        <input type="number" required min="50" max="300" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 font-semibold transition-all" placeholder="cm" />
                      </div>
                    </div>
                  </div>

                  {/* Weight Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1">Weight</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Weight className="h-4 w-4 text-slate-400" /></div>
                      <input type="number" required step="0.1" min="20" max="400" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 font-semibold transition-all" placeholder="kg" />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 block mb-1">Activity Level</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Activity className="h-4 w-4 text-slate-400" /></div>
                      <select value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 font-semibold appearance-none transition-all cursor-pointer">
                        <option value="1.2">Sedentary (Little to no exercise)</option>
                        <option value="1.375">Lightly Active (1-3 days/week)</option>
                        <option value="1.55">Moderately Active (3-5 days/week)</option>
                        <option value="1.725">Very Active (6-7 days/week)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="w-full mt-4 bg-green-500 text-white font-extrabold text-lg py-3.5 rounded-xl shadow-md hover:bg-green-600 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                    Calculate
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}