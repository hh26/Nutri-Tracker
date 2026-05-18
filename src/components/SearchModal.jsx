import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Loader2 } from 'lucide-react';
import { getCombos, logMeal, getCustomFoods, getRecentLogs } from '../db/database';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../db/supabase'; // Adjust path as needed

// Add your Edamam keys here!
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID; 
const EDAMAM_APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY;

export default function SearchModal({ isOpen, onClose, mealType, onMealLogged, viewDate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [inputAmount, setInputAmount] = useState(1);
  const [inputMetric, setInputMetric] = useState('unit');
  
  const [customCombos, setCustomCombos] = useState([]);
  const [userFoods, setUserFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);

  const [apiFoods, setApiFoods] = useState([]);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);

  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true); // Start loading when opened
      // Fetch combos, custom foods, AND recent logs from Supabase all at the same time
      Promise.all([
        getCombos(), 
        getCustomFoods(), 
        getRecentLogs(50)
      ]).then(([combos, customFoodsData, recentLogs]) => {
        setCustomCombos(combos);
        setUserFoods(customFoodsData);
        
        // Calculate Recents from the Cloud Database History
        const allLocalItems = [...combos, ...customFoodsData];
        const uniqueFoodNames = [...new Set(recentLogs.map(log => log.foodName))];
        
        const recents = uniqueFoodNames
          .map(name => allLocalItems.find(item => item.name === name) || recentLogs.find(log => log.foodName === name)?.baseFood)
          .filter(Boolean)
          .slice(0, 6);
          
        setRecentFoods(recents);
        setIsLoading(false); // Stop loading when all data arrives
      });
    } else {
      // Reset when closed
      setSearchQuery('');
      setSelectedFood(null);
      setInputAmount(1);
      setInputMetric('unit');
      setApiFoods([]);
    }
  }, [isOpen]);

  // Edamam API Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setApiFoods([]);
      setIsSearchingAPI(false);
      return;
    }

    setIsSearchingAPI(true);

    const delayDebounceFn = setTimeout(async () => {
      try {

        // 1. Get the current user's session token securely
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("You must be logged in to search.");
        }
        
        // 2. Hit your Vercel API proxy
        const response = await fetch(`/api/food-search?query=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Pass the token so the backend can verify it!
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch food data");
        }

        const data = await response.json();

        // Map Edamam data to our app's standard format
        // Edamam returns data inside a 'hints' array
        const mappedData = (data.hints || []).map(item => {
          const food = item.food;
          return {
            id: food.foodId,
            name: food.label,
            calories: food.nutrients.ENERC_KCAL || 0,
            protein: food.nutrients.PROCNT || 0,
            carbs: food.nutrients.CHOCDF || 0,
            fats: food.nutrients.FAT || 0,
            baseUnit: '100g',
            baseWeight: 100, // Edamam's base nutrients are per 100g
            isApi: true
          };
        });

        // Remove duplicate API results (Edamam sometimes returns different brands of the same raw food)
        const uniqueApiFoods = Array.from(new Map(mappedData.map(item => [item.name.toLowerCase(), item])).values()).slice(0, 15);

        setApiFoods(uniqueApiFoods);
      } catch (error) {
        console.error("Failed to fetch Edamam foods:", error);
      } finally {
        setIsSearchingAPI(false);
      }
    }, 600); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen) return null;

  const localSearchableItems = [...customCombos, ...userFoods];
  const localFiltered = localSearchableItems.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const combinedResults = [...localFiltered, ...apiFoods];

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setInputMetric(food.isApi ? 'grams' : 'unit');
    setInputAmount(food.isApi ? 100 : 1);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100 animate-in slide-in-from-bottom-full duration-300">
      
      <div className="bg-stone-50 px-6 pt-10 pb-4 shadow-sm border-b border-stone-200 flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2 text-stone-500 hover:bg-stone-200 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-stone-800">Add to {mealType}</h2>
      </div>

      {!selectedFood ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search local or global foods..." 
              autoFocus
              className="w-full bg-white border border-stone-200 py-3 pl-12 pr-10 rounded-2xl outline-none focus:border-amber-500 font-medium text-stone-700 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearchingAPI && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-spin" />
            )}
          </div>

          {/* Conditional Rendering Block Starts Here */}
          {isLoading ? (
            <div className="mt-10">
               <LoadingSpinner message="Waking up Database..." />
            </div>
          ) : searchQuery ? (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-2">Search Results</h3>
              {combinedResults.map((food, idx) => (
                <div 
                  key={food.id || idx} 
                  onClick={() => handleSelectFood(food)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-stone-50 active:bg-stone-200 rounded-2xl cursor-pointer transition-all border border-stone-100 shadow-sm"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-stone-700 leading-tight">
                      {food.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      {food.isCombo && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Combo</span>}
                      {food.isCustom && <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">My DB</span>}
                      {food.isApi && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Global</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-stone-400 whitespace-nowrap">{Math.round(food.calories)} kcal</span>
                </div>
              ))}
              {!isSearchingAPI && combinedResults.length === 0 && (
                <div className="text-center text-stone-400 py-10">No foods found matching "{searchQuery}"</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 mb-3">
                <Clock className="w-4 h-4 text-stone-400" />
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Recently Logged</h3>
              </div>
              
              {recentFoods.length > 0 ? (
                recentFoods.map((food, idx) => (
                  <div 
                    key={`recent-${food.id || idx}`} 
                    onClick={() => handleSelectFood(food)}
                    className="flex justify-between items-center p-4 bg-white hover:bg-stone-50 active:bg-stone-200 rounded-2xl cursor-pointer transition-all border border-stone-100 shadow-sm"
                  >
                    <h3 className="font-semibold text-lg text-stone-700 truncate mr-2">{food.name}</h3>
                    <span className="text-sm font-bold text-stone-400 whitespace-nowrap">{Math.round(food.calories)} kcal</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-stone-400 py-10 bg-white rounded-2xl border border-stone-200 border-dashed">
                  Search above to pull from the global database!
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="flex-1 p-6 flex flex-col">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-1">{selectedFood.name}</h2>
            <p className="text-stone-500 mb-6 font-medium">Base Data: {selectedFood.baseWeight}g</p>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Amount</label>
                <input 
                  type="number" 
                  min="0" step="0.1"
                  className="w-full bg-stone-50 border border-stone-200 text-xl py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700 transition-all"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Metric</label>
                <select 
                  className="w-full bg-stone-50 border border-stone-200 text-lg py-3.5 px-4 rounded-xl outline-none focus:border-amber-500 appearance-none font-bold text-stone-700 transition-all"
                  value={inputMetric}
                  onChange={(e) => setInputMetric(e.target.value)}
                >
                  {!selectedFood.isApi && <option value="unit">Units</option>}
                  <option value="grams">Grams</option>
                </select>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl mt-6 flex justify-between items-center border border-stone-100">
              <span className="text-amber-600 font-bold text-xl">
                {Math.round(selectedFood.calories * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount))} kcal
              </span>
              <span className="text-stone-500 font-medium text-sm">
                P: {Math.round(selectedFood.protein * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g • 
                C: {Math.round(selectedFood.carbs * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g • 
                F: {Math.round(selectedFood.fats * (inputMetric === 'grams' ? inputAmount / selectedFood.baseWeight : inputAmount) * 10)/10}g
              </span>
            </div>
          </div>

          <div className="mt-auto pb-safe">
            <button 
              onClick={handleSaveMeal} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              Add to Diary
            </button>
            <button 
              onClick={() => setSelectedFood(null)} 
              className="w-full mt-3 text-stone-500 font-bold py-4 rounded-2xl active:bg-stone-200 transition-all"
            >
              Back to Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}