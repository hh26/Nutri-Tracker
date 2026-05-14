import React, { useState, useEffect } from 'react';
import { Save, Trash2, Edit2, Plus, ChevronLeft } from 'lucide-react';
import foodData from '../db/foodData.json';
import { saveCombo, getCombos, deleteCombo, updateCombo } from '../db/database';

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

  // Fetch combos on load
  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    const combos = await getCombos();
    setSavedCombos(combos);
  };

  // --- List View Actions ---
  const handleCreateNew = () => {
    setEditingComboId(null);
    setComboName('');
    setSelectedItems([]);
    setSearchQuery('');
    setViewMode('builder');
  };

  const handleEditCombo = (combo) => {
    setEditingComboId(combo.id);
    setComboName(combo.name);
    setSelectedItems(combo.items);
    setSearchQuery('');
    setViewMode('builder');
  };

  const handleDeleteCombo = async (id) => {
    await deleteCombo(id);
    fetchCombos();
  };

  // --- Builder View Actions ---
  const handleAddFood = (food) => {
    setSelectedItems([...selectedItems, { ...food, uniqueId: Date.now(), amount: 1, metric: 'unit' }]);
    setSearchQuery('');
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
    
    // Reset and return to list
    setComboName('');
    setSelectedItems([]);
    setEditingComboId(null);
    fetchCombos();
    setViewMode('list');
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totalCalories = selectedItems.reduce((sum, item) => {
    const ratio = item.metric === 'grams' ? (item.amount / item.baseWeight) : item.amount;
    return sum + (item.calories * ratio);
  }, 0);

  const filteredFoods = foodData.foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            
            {/* Create New Button */}
            <button 
              onClick={handleCreateNew}
              className="w-full bg-white border-2 border-dashed border-slate-200 text-slate-500 font-bold py-5 rounded-2xl active:bg-slate-50 transition-all flex justify-center items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Build New Combo
            </button>

            {/* Existing Combos List */}
            {savedCombos.length > 0 ? (
              <div className="space-y-3">
                {savedCombos.map(combo => (
                  <div key={combo.id} className="bg-white p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{combo.name}</h3>
                        <p className="text-green-600 font-semibold text-sm mt-0.5">{Math.round(combo.calories)} kcal</p>
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
                    {/* Preview of items inside */}
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
            <div className="bg-white p-5 rounded-3xl shadow-sm">
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
                            <option value="unit">Units</option>
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

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-xl">
                <span className="text-slate-800">Total:</span>
                <span className="text-green-600">{Math.round(totalCalories)} kcal</span>
              </div>

              <button 
                onClick={handleSaveCombo}
                disabled={!comboName || selectedItems.length === 0}
                className="w-full mt-6 bg-green-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                <Save className="w-5 h-5" /> {editingComboId ? 'Update Combo' : 'Save Combo'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Add Foods to Combo</h3>
              <input
                type="text"
                placeholder="Search Tamil foods..."
                className="w-full bg-slate-100 py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 transition-all mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchQuery && filteredFoods.map((food) => (
                  <div 
                    key={food.id} 
                    onClick={() => handleAddFood(food)}
                    className="flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-xl cursor-pointer transition-colors border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700">{food.name}</span>
                    <span className="text-sm font-bold text-slate-400">{food.calories} kcal</span>
                  </div>
                ))}
                {searchQuery && filteredFoods.length === 0 && (
                  <div className="text-center text-slate-400 py-4 text-sm">
                    No foods found.
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