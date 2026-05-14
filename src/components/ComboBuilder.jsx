import React, { useState, useEffect } from 'react';
import { Save, Trash2, Edit2, Plus, ChevronLeft, Loader2 } from 'lucide-react';
import { saveCombo, getCombos, deleteCombo, updateCombo, getCustomFoods } from '../db/database';

// Pulling keys securely from the .env file
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID;
const EDAMAM_APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY;

export default function ComboBuilder() {
  // View State
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'builder'
  const [savedCombos, setSavedCombos] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Builder State
  const [editingComboId, setEditingComboId] = useState(null);
  const [comboName, setComboName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Local DB & API State
  const [userFoods, setUserFoods] = useState([]);
  const [apiFoods, setApiFoods] = useState([]);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);

  // Fetch initial local data
  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    const combos = await getCombos();
    const customFoodsData = await getCustomFoods();
    setSavedCombos(combos);
    setUserFoods(customFoodsData);
  };

  // Edamam API Search Logic with Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setApiFoods([]);
      setIsSearchingAPI(false);
      return;
    }

    setIsSearchingAPI(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        // Map Edamam data to our app's standard format
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
            baseWeight: 100, // Edamam defaults to 100g portions
            isApi: true
          };
        });

        // Deduplicate results
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

  // Combine local custom foods and global API foods
  const localFiltered = userFoods.filter(food => food.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const combinedResults = [...localFiltered, ...apiFoods];

  // --- List View Actions ---
  const handleCreateNew = () => {
    setEditingComboId(null);
    setComboName('');
    setSelectedItems([]);
    setSearchQuery('');
    setApiFoods([]);
    setViewMode('builder');
  };

  const handleEditCombo = (combo) => {
    setEditingComboId(combo.id);
    setComboName(combo.name);
    setSelectedItems(combo.items);
    setSearchQuery('');
    setApiFoods([]);
    setViewMode('builder');
  };

  const handleDeleteCombo = async (id) => {
    await deleteCombo(id);
    fetchCombos();
  };

  // --- Builder View Actions ---
  const handleAddFood = (food) => {
    // If it's an API food, default the input to 100 grams. If local, default to 1 unit.
    const defaultMetric = food.isApi ? 'grams' : 'unit';
    const defaultAmount = food.isApi ? 100 : 1;

    setSelectedItems([...selectedItems, { ...food, uniqueId: Date.now(), amount: defaultAmount, metric: defaultMetric }]);
    setSearchQuery('');
    setApiFoods([]);
  };

  const handleUpdateItem = (uniqueId, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.uniqueId === uniqueId ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveFood = (uniqueId) => {
    setSelectedItems(selectedItems.filter(item => item.uniqueId !== uniqueId));
  };

  const handleSaveCombo = async () => {
    if (!comboName || selectedItems.length === 0) return;
    
    if (editingComboId) {
      await updateCombo(editingComboId, comboName, selectedItems);
      setSuccessMsg('Combo updated successfully!');
    } else {
      await saveCombo(comboName, selectedItems);
      setSuccessMsg('Combo saved successfully!');
    }
    
    setComboName('');
    setSelectedItems([]);
    setEditingComboId(null);
    fetchCombos();
    setViewMode('list');
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totals = selectedItems.reduce((acc, item) => {
    const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
    return {
      calories: acc.calories + (item.calories * ratio),
      protein: acc.protein + (item.protein * ratio),
      carbs: acc.carbs + (item.carbs * ratio),
      fats: acc.fats + (item.fats * ratio)
    };
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 animate-in fade-in">
      
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm flex items-center gap-3">
        {viewMode === 'builder' && (
          <button onClick={() => setViewMode('list')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {viewMode === 'list' ? 'My Combos' : (editingComboId ? 'Edit Combo' : 'Create Combo')}
          </h1>
          <p className="text-slate-500 text-sm">
            {viewMode === 'list' ? 'Manage your frequent meals' : 'Group foods you eat together'}
          </p>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-6">
        {successMsg && (
          <div className="bg-green-100 text-green-700 p-3 rounded-xl text-center font-semibold animate-in slide-in-from-top-2">
            {successMsg}
          </div>
        )}

        {/* ================= LIST VIEW ================= */}
        {viewMode === 'list' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <button 
              onClick={handleCreateNew}
              className="w-full bg-white border-2 border-dashed border-slate-200 text-slate-500 font-bold py-5 rounded-2xl active:bg-slate-50 transition-all flex justify-center items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Build New Combo
            </button>

            {savedCombos.length > 0 ? (
              <div className="space-y-3">
                {savedCombos.map(combo => (
                  <div key={combo.id} className="bg-white p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{combo.name}</h3>
                        <p className="text-green-600 font-semibold text-sm mt-0.5">
                          {Math.round(combo.calories)} kcal
                          <span className="text-slate-400 font-medium ml-2">
                            (P: {Math.round(combo.protein || 0)}g • C: {Math.round(combo.carbs || 0)}g • F: {Math.round(combo.fats || 0)}g)
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditCombo(combo)} className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCombo(combo.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                      {combo.items.map(i => `${i.amount} ${i.metric === 'grams' ? 'g' : 'x'} ${i.name}`).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10">
                You haven't saved any combos yet.
              </div>
            )}
          </div>
        )}

        {/* ================= BUILDER VIEW ================= */}
        {viewMode === 'builder' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Combo Summary Card */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <input 
                type="text" 
                placeholder="Combo Name (e.g., Daily Breakfast)" 
                className="w-full bg-slate-50 border border-slate-200 text-lg py-3 px-4 rounded-xl outline-none focus:border-green-500 font-bold text-slate-700"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
              />

              <div className="mt-4 space-y-3">
                {selectedItems.map((item) => {
                  const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
                  const itemCalories = Math.round(item.calories * ratio);

                  return (
                    <div key={item.uniqueId} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-lg text-slate-700">{item.name}</span>
                        <button onClick={() => handleRemoveFood(item.uniqueId)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-xs text-slate-400 mb-2">Base: {item.baseUnit} ({item.baseWeight}g)</p>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input 
                            type="number" 
                            min="0" step="0.1"
                            value={item.amount}
                            onChange={(e) => handleUpdateItem(item.uniqueId, 'amount', e.target.value)}
                            className="w-full bg-white border border-slate-200 text-sm py-2.5 px-3 rounded-xl outline-none focus:border-green-500 font-medium"
                          />
                        </div>
                        <div className="flex-1">
                          <select 
                            value={item.metric}
                            onChange={(e) => handleUpdateItem(item.uniqueId, 'metric', e.target.value)}
                            className="w-full bg-white border border-slate-200 text-sm py-2.5 px-3 rounded-xl outline-none focus:border-green-500 appearance-none font-medium text-slate-700"
                          >
                            {!item.isApi && <option value="unit">Units</option>}
                            <option value="grams">Grams</option>
                          </select>
                        </div>
                        <div className="flex-1 flex justify-end items-center">
                          <span className="font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl text-sm w-full text-center border border-green-100">
                            {itemCalories} kcal
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between items-center font-bold text-xl">
                  <span className="text-slate-800">Total:</span>
                  <span className="text-green-600">{Math.round(totals.calories)} kcal</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                  <span>Protein: {Math.round(totals.protein)}g</span>
                  <span>Carbs: {Math.round(totals.carbs)}g</span>
                  <span>Fats: {Math.round(totals.fats)}g</span>
                </div>
              </div>

              <button 
                onClick={handleSaveCombo}
                disabled={!comboName || selectedItems.length === 0}
                className="w-full mt-6 bg-green-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                <Save className="w-5 h-5" /> {editingComboId ? 'Update Combo' : 'Save Combo'}
              </button>
            </div>

            {/* API Search Card */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Add Foods to Combo</h3>
              
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search local or global foods..."
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 pr-10 rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all font-medium text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearchingAPI && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-spin" />
                )}
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchQuery && combinedResults.map((food, idx) => (
                  <div 
                    key={food.id || idx} 
                    onClick={() => handleAddFood(food)}
                    className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-100 shadow-sm"
                  >
                    <div className="pr-2">
                      <span className="font-semibold text-slate-700 leading-tight block">{food.name}</span>
                      {food.isApi && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">Global</span>}
                      {food.isCustom && <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">My DB</span>}
                    </div>
                    <span className="text-sm font-bold text-slate-400 whitespace-nowrap">{Math.round(food.calories)} kcal</span>
                  </div>
                ))}
                
                {!isSearchingAPI && searchQuery && combinedResults.length === 0 && (
                  <div className="text-center text-slate-400 py-4 text-sm">
                    No foods found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}