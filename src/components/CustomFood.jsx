import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Utensils } from 'lucide-react';
import { saveCustomFood, getCustomFoods, deleteCustomFood } from '../db/database';

export default function CustomFood() {
  const [viewMode, setViewMode] = useState('list');
  const [savedFoods, setSavedFoods] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [baseUnit, setBaseUnit] = useState('1 Unit');
  const [baseWeight, setBaseWeight] = useState('');

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    const foods = await getCustomFoods();
    setSavedFoods(foods);
  };

  const handleSaveFood = async () => {
    if (!foodName || !calories || !baseWeight) return;
    
    await saveCustomFood({
      name: foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fats: Number(fats) || 0,
      baseUnit: baseUnit,
      baseWeight: Number(baseWeight)
    });
    
    // Reset Form
    setFoodName(''); setCalories(''); setProtein(''); 
    setCarbs(''); setFats(''); setBaseUnit('1 Unit'); setBaseWeight('');
    
    setSuccessMsg('Food added successfully!');
    fetchFoods();
    setViewMode('list');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    await deleteCustomFood(id);
    fetchFoods();
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-24 animate-in fade-in">
      <header className="bg-stone-50 px-6 pt-10 pb-6 rounded-b-3xl shadow-sm border-b border-stone-200/50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Custom Foods</h1>
          <p className="text-stone-500 text-sm">Add items not found in the database</p>
        </div>
        {viewMode === 'builder' && (
          <button onClick={() => setViewMode('list')} className="text-amber-600 font-bold text-sm bg-amber-50 px-4 py-2 rounded-xl">
            Cancel
          </button>
        )}
      </header>

      <main className="px-4 mt-6 space-y-6">
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-3 rounded-xl text-center font-bold">
            {successMsg}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <button 
              onClick={() => setViewMode('builder')}
              className="w-full bg-white border-2 border-dashed border-stone-300 text-stone-500 font-bold py-5 rounded-2xl active:bg-stone-50 transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" /> Add New Food
            </button>

            <div className="space-y-3">
              {savedFoods.map(food => (
                <div key={food.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-stone-800">{food.name}</h3>
                    <p className="text-amber-600 font-semibold text-sm mt-0.5">{food.calories} kcal <span className="text-stone-400 font-normal">per {food.baseUnit} ({food.baseWeight}g)</span></p>
                  </div>
                  <button onClick={() => handleDelete(food.id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {savedFoods.length === 0 && (
                <div className="text-center text-stone-400 py-10">No custom foods added yet.</div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'builder' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-5 animate-in fade-in slide-in-from-right-4">
            
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Food Name *</label>
              <input type="text" placeholder="e.g., Mom's Special Curry" value={foodName} onChange={e => setFoodName(e.target.value)} className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Calories *</label>
                <input type="number" placeholder="kcal" value={calories} onChange={e => setCalories(e.target.value)} className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Weight (g) *</label>
                <input type="number" placeholder="e.g., 150" value={baseWeight} onChange={e => setBaseWeight(e.target.value)} className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Base Unit Name *</label>
              <input type="text" placeholder="e.g., 1 Bowl, 1 Piece, 1 Serving" value={baseUnit} onChange={e => setBaseUnit(e.target.value)} className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700" />
            </div>

            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Macros (Optional)</p>
              <div className="flex gap-3">
                <div>
                  <label className="text-[10px] font-bold text-sky-600 uppercase tracking-wider ml-1">Carbs (g)</label>
                  <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="w-full mt-1 bg-sky-50 border border-sky-100 py-2.5 px-3 rounded-xl outline-none focus:border-sky-400 font-bold text-stone-700" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider ml-1">Protein (g)</label>
                  <input type="number" value={protein} onChange={e => setProtein(e.target.value)} className="w-full mt-1 bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl outline-none focus:border-rose-400 font-bold text-stone-700" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wider ml-1">Fats (g)</label>
                  <input type="number" value={fats} onChange={e => setFats(e.target.value)} className="w-full mt-1 bg-amber-50 border border-amber-100 py-2.5 px-3 rounded-xl outline-none focus:border-amber-400 font-bold text-stone-700" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveFood}
              disabled={!foodName || !calories || !baseWeight || !baseUnit}
              className="w-full mt-4 bg-amber-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> Save to Database
            </button>
          </div>
        )}
      </main>
    </div>
  );
}