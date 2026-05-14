import React, { useState, useEffect } from 'react';
import { X, Search, Clock } from 'lucide-react';
import foodData from '../db/foodData.json';
import { db, getCombos, logMeal, getCustomFoods } from '../db/database';

export default function SearchModal({ isOpen, onClose, mealType, onMealLogged, viewDate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [inputAmount, setInputAmount] = useState(1);
  const [inputMetric, setInputMetric] = useState('unit');
  
  const [customCombos, setCustomCombos] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [userFoods, setUserFoods] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // 1. Fetch combos first
      Promise.all([getCombos(), getCustomFoods()]).then(async ([combos, customFoodsData]) => {
        setCustomCombos(combos);
        setUserFoods(customFoodsData); // SAVE TO STATE
        
        // 2. Combine with standard foods to create our master list
        const allItems = [...combos, ...customFoodsData, ...foodData.foods];

        // 3. Fetch the last 50 items logged to the database
        const recentLogs = await db.logs.orderBy('id').reverse().limit(50).toArray();
        
        // 4. Extract just the names and remove duplicates
        const uniqueFoodNames = [...new Set(recentLogs.map(log => log.foodName))];
        
        // 5. Match those names back to our master list to get full food data
        const recents = uniqueFoodNames
          .map(name => allItems.find(item => item.name === name))
          .filter(Boolean) // Remove any nulls (like if a combo was deleted)
          .slice(0, 6);    // Keep only the top 6 most recent
          
        setRecentFoods(recents);
      });
    } else {
      // Reset state when closed
      setSearchQuery('');
      setSelectedFood(null);
      setInputAmount(1);
      setInputMetric('unit');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allSearchableItems = [...customCombos, ...userFoods, ...foodData.foods];

  const filteredFoods = allSearchableItems.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setInputAmount(1);
    setInputMetric('unit');
  };

  const handleSaveMeal = async () => {
    if (!selectedFood) return;

    const ratio = inputMetric === 'grams' ? (inputAmount / selectedFood.baseWeight) : inputAmount;

    await logMeal({
      date: viewDate,
      mealType: mealType,
      foodName: selectedFood.name,
      calories: selectedFood.calories * ratio,
      protein: selectedFood.protein * ratio,
      carbs: selectedFood.carbs * ratio,
      fats: selectedFood.fats * ratio,
      inputAmount: inputAmount,
      inputMetric: inputMetric,
      baseFood: selectedFood
    });

    onMealLogged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header */}
      <div className="bg-white px-6 pt-10 pb-4 shadow-sm flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Add to {mealType}</h2>
      </div>

      {!selectedFood ? (
        /* ================= VIEW 1: SEARCH & RECENTS ================= */
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search foods or combos..." 
              autoFocus
              className="w-full bg-white border border-slate-200 py-3 pl-12 pr-4 rounded-2xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all font-medium text-slate-700 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List Logic: If typing, show search. If empty, show recents. */}
          {searchQuery ? (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Search Results</h3>
              {filteredFoods.map((food) => (
                <div 
                  key={food.id || food.name} 
                  onClick={() => handleSelectFood(food)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-2xl cursor-pointer transition-all border border-slate-100 shadow-sm"
                >
                  <h3 className="font-semibold text-lg text-slate-700">
                    {food.name}
                    {food.isCombo && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">Combo</span>}
                    {food.isCustom && <span className="ml-2 bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full">Custom</span>}
                  </h3>
                  <span className="text-sm font-bold text-slate-400">{Math.round(food.calories)} kcal</span>
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="text-center text-slate-400 py-10">No foods found matching "{searchQuery}"</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recently Used</h3>
              </div>
              
              {recentFoods.length > 0 ? (
                recentFoods.map((food) => (
                  <div 
                    key={`recent-${food.id || food.name}`} 
                    onClick={() => handleSelectFood(food)}
                    className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-2xl cursor-pointer transition-all border border-slate-100 shadow-sm"
                  >
                    <h3 className="font-semibold text-lg text-slate-700">
                      {food.name}
                      {food.isCombo && <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">Combo</span>}
                      {food.isCustom && <span className="ml-2 bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full">Custom</span>}
                    </h3>
                    <span className="text-sm font-bold text-slate-400">{Math.round(food.calories)} kcal</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                  Search above to start logging foods!
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* ================= VIEW 2: AMOUNT SELECTION ================= */
        <div className="flex-1 p-6 flex flex-col">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedFood.name}</h2>
            <p className="text-slate-500 mb-6 font-medium">Base: {selectedFood.baseUnit} ({selectedFood.baseWeight}g)</p>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Amount</label>
                <input 
                  type="number" 
                  min="0" step="0.1"
                  className="w-full bg-slate-50 border border-slate-200 text-xl py-3 px-4 rounded-xl outline-none focus:border-green-500 font-bold text-slate-700 transition-all"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Metric</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-lg py-3.5 px-4 rounded-xl outline-none focus:border-green-500 appearance-none font-bold text-slate-700 transition-all"
                  value={inputMetric}
                  onChange={(e) => setInputMetric(e.target.value)}
                >
                  <option value="unit">Units</option>
                  <option value="grams">Grams</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mt-6 flex justify-between items-center border border-slate-100">
              <span className="text-green-600 font-bold text-xl">
                {Math.round(selectedFood.calories * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount))} kcal
              </span>
              <span className="text-slate-500 font-medium text-sm">
                P: {Math.round(selectedFood.protein * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g • 
                C: {Math.round(selectedFood.carbs * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g • 
                F: {Math.round(selectedFood.fats * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g
              </span>
            </div>
          </div>

          <div className="mt-auto pb-safe">
            <button 
              onClick={handleSaveMeal} 
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] active:scale-95 transition-all"
            >
              Add to Diary
            </button>
            <button 
              onClick={() => setSelectedFood(null)} 
              className="w-full mt-3 text-slate-500 font-bold py-4 rounded-2xl active:bg-slate-100 transition-all"
            >
              Back to Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}