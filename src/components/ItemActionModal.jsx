import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Copy, Trash2, Edit2, Check } from 'lucide-react';

export default function ItemActionModal({ isOpen, onClose, log, onMove, onCopy, onDelete, onUpdate }) {
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  
  // States for editing
  const [editAmount, setEditAmount] = useState(1);
  const [editMetric, setEditMetric] = useState('unit');

  // Reset states when the modal opens with a new log
  useEffect(() => {
    if (log) {
      setEditAmount(log.inputAmount || 1);
      setEditMetric(log.inputMetric || 'unit');
      setShowMoveOptions(false);
      setShowCopyOptions(false);
      setShowEditMode(false);
    }
  }, [log, isOpen]);

  const mealOptions = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].filter(m => m !== log?.mealType);

  if (!isOpen || !log) return null;

  const handleClose = () => {
    setShowMoveOptions(false);
    setShowCopyOptions(false);
    setShowEditMode(false);
    onClose();
  };

  // Math logic for the edit preview
  const ratio = log.baseFood ? (editMetric === 'grams' ? editAmount / log.baseFood.baseWeight : editAmount) : 1;

  const handleSaveChanges = () => {
    if (!log.baseFood) return; // Safeguard for older entries without baseFood

    onUpdate(log.id, {
      inputAmount: editAmount,
      inputMetric: editMetric,
      calories: log.baseFood.calories * ratio,
      protein: log.baseFood.protein * ratio,
      carbs: log.baseFood.carbs * ratio,
      fats: log.baseFood.fats * ratio,
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose}></div>
      
      <div className="bg-white rounded-t-3xl relative z-10 animate-in slide-in-from-bottom-8 duration-300 pb-10">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{log.foodName}</h2>
            <p className="text-sm text-slate-500">
              {showEditMode ? 'Edit Quantity' : `${Math.round(log.calories)} kcal • Currently in ${log.mealType}`}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          
          {/* VIEW 1: Move or Copy Menu */}
          {(showMoveOptions || showCopyOptions) ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
              <h3 className="px-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                {showMoveOptions ? "Move to..." : "Copy to..."}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {mealOptions.map(meal => (
                  <button 
                    key={meal}
                    onClick={() => {
                      showMoveOptions ? onMove(log.id, meal) : onCopy(log, meal);
                      handleClose();
                    }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 active:bg-green-50 active:border-green-500 transition-all"
                  >
                    {meal}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowMoveOptions(false); setShowCopyOptions(false); }} className="w-full p-4 mt-2 font-semibold text-slate-500 active:bg-slate-50 rounded-xl">
                Back
              </button>
            </div>

          ) : showEditMode ? (
            
            /* VIEW 2: Edit Quantity Form */
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              {!log.baseFood && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
                  Cannot edit older entries. Please delete and re-add this food.
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Amount</label>
                  <input 
                    type="number" 
                    min="0" step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 text-lg py-3 px-4 rounded-xl outline-none focus:border-green-500"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    disabled={!log.baseFood}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Metric</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-lg py-3 px-4 rounded-xl outline-none focus:border-green-500 appearance-none"
                    value={editMetric}
                    onChange={(e) => setEditMetric(e.target.value)}
                    disabled={!log.baseFood}
                  >
                    <option value="unit">Servings / Units</option>
                    <option value="grams">Grams (g)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Bar */}
              {log.baseFood && (
                <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center font-medium">
                  <span className="text-green-600 font-bold">{Math.round(log.baseFood.calories * ratio)} kcal</span>
                  <span className="text-slate-500 text-sm">
                    P: {Math.round(log.baseFood.protein * ratio * 10)/10}g • 
                    C: {Math.round(log.baseFood.carbs * ratio * 10)/10}g • 
                    F: {Math.round(log.baseFood.fats * ratio * 10)/10}g
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditMode(false)} className="px-6 py-4 font-semibold text-slate-500 bg-slate-100 rounded-xl active:scale-95 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveChanges} 
                  disabled={!log.baseFood}
                  className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" /> Save Changes
                </button>
              </div>
            </div>

          ) : (

            /* VIEW 3: Main Menu */
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4">
              <button onClick={() => setShowEditMode(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-slate-50 transition-all">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Edit2 className="w-5 h-5" /></div>
                <span className="font-semibold text-lg text-slate-700">Edit Quantity</span>
              </button>

              <button onClick={() => setShowMoveOptions(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-slate-50 transition-all">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ArrowRightLeft className="w-5 h-5" /></div>
                <span className="font-semibold text-lg text-slate-700">Move to another meal</span>
              </button>
              
              <button onClick={() => setShowCopyOptions(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-slate-50 transition-all">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Copy className="w-5 h-5" /></div>
                <span className="font-semibold text-lg text-slate-700">Copy to another meal</span>
              </button>
              
              <button onClick={() => { onDelete(log.id); handleClose(); }} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-red-50 transition-all">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                <span className="font-semibold text-lg text-red-600">Delete this entry</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}