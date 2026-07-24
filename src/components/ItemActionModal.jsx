import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Copy, Trash2, Edit2, Check, Plus } from 'lucide-react';

// --- Universal Normalizer for Metrics ---
// Returns true if the string is any variation of gram (Gram, grams, g)
const isGramMetric = (metricStr) => {
  if (!metricStr) return false;
  const normalized = metricStr.toLowerCase().trim();
  return normalized === 'gram' || normalized === 'grams' || normalized === 'g';
};

export default function ItemActionModal({ isOpen, onClose, log, onMove, onCopy, onDelete, onUpdate }) {
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  
  const [editTab, setEditTab] = useState('total'); 
  const [editAmount, setEditAmount] = useState(1);
  const [addAmount, setAddAmount] = useState('');
  const [editMetric, setEditMetric] = useState('unit');

  // Reset states when the modal opens with a new log
  useEffect(() => {
    if (log) {
      setEditAmount(log.inputAmount || 1);
      
      // FIX: Use the normalizer to guarantee the dropdown catches "Gram"
      setEditMetric(isGramMetric(log.inputMetric) ? 'grams' : 'unit');
      
      setAddAmount('');
      setEditTab('total');
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

  const finalAmount = editTab === 'total' 
    ? Number(editAmount) 
    : Number(log.inputAmount) + Number(addAmount || 0);

  // Use the normalizer here too, just to be bulletproof
  const ratio = log.baseFood 
    ? (isGramMetric(editMetric) ? finalAmount / log.baseFood.baseWeight : finalAmount) 
    : 1;

  const handleSaveChanges = () => {
    if (!log.baseFood) return; 

    if (editTab === 'add' && (!addAmount || Number(addAmount) <= 0)) return;

    onUpdate(log.id, {
      inputAmount: finalAmount,
      // If they leave it as 'unit', we try to save their original custom unit (like "Piece"). Otherwise save the dropdown value.
      inputMetric: editMetric === 'unit' && !isGramMetric(log.inputMetric) ? (log.inputMetric || 'unit') : editMetric,
      calories: log.baseFood.calories * ratio,
      protein: log.baseFood.protein * ratio,
      carbs: log.baseFood.carbs * ratio,
      fats: log.baseFood.fats * ratio,
    });
    handleClose();
  };

  // Check if the original log was a gram for the UI text displays
  const logIsGram = isGramMetric(log.inputMetric);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={handleClose}></div>
      
      <div className="bg-white rounded-t-3xl relative z-10 animate-in slide-in-from-bottom-8 duration-300 pb-10">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{log.foodName}</h2>
            <p className="text-sm text-slate-500">
              {showEditMode 
                ? `Currently: ${log.inputAmount}${logIsGram ? 'g' : ' servings'}` 
                : `${Math.round(log.calories)} kcal • Currently in ${log.mealType}`}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          
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
            
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              {!log.baseFood && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
                  Cannot edit older entries. Please delete and re-add this food.
                </div>
              )}
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setEditTab('total')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${editTab === 'total' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Set New Total
                </button>
                <button 
                  onClick={() => setEditTab('add')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${editTab === 'add' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Plus className="w-4 h-4" /> Add Extra
                </button>
              </div>

              {editTab === 'total' ? (
                <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
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
              ) : (
                <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">How much more did you have?</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="0" step="0.1"
                      placeholder={`e.g. ${logIsGram ? '50' : '1'}`}
                      className="flex-1 bg-amber-50 border border-amber-200 text-amber-900 text-lg py-3 px-4 rounded-xl outline-none focus:border-amber-500 placeholder:text-amber-300"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      disabled={!log.baseFood}
                      autoFocus
                    />
                    <div className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200">
                      {logIsGram ? 'g' : 'servings'}
                    </div>
                  </div>
                </div>
              )}

              {log.baseFood && (
                <div className={`${editTab === 'add' ? 'bg-amber-100' : 'bg-slate-100'} p-4 rounded-xl flex justify-between items-center font-medium transition-colors`}>
                  <div className="flex flex-col">
                    <span className={`${editTab === 'add' ? 'text-amber-700' : 'text-slate-500'} text-xs font-bold uppercase tracking-wider mb-0.5`}>
                      New Total: {finalAmount}{isGramMetric(editMetric) ? 'g' : ' units'}
                    </span>
                    <span className={`${editTab === 'add' ? 'text-amber-900' : 'text-green-600'} font-bold`}>
                      {Math.round(log.baseFood.calories * ratio)} kcal
                    </span>
                  </div>
                  <div className={`text-right text-sm ${editTab === 'add' ? 'text-amber-800/70' : 'text-slate-500'}`}>
                    <div>P: {Math.round(log.baseFood.protein * ratio * 10)/10}g</div>
                    <div>C: {Math.round(log.baseFood.carbs * ratio * 10)/10}g</div>
                    <div>F: {Math.round(log.baseFood.fats * ratio * 10)/10}g</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditMode(false)} className="px-6 py-4 font-semibold text-slate-500 bg-slate-100 rounded-xl active:scale-95 transition-all">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveChanges} 
                  disabled={!log.baseFood || (editTab === 'add' && (!addAmount || Number(addAmount) <= 0))}
                  className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" /> Save Changes
                </button>
              </div>
            </div>

          ) : (

            <div className="space-y-1 animate-in fade-in slide-in-from-left-4">
              
              <button onClick={() => setShowEditMode(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-slate-50 transition-all">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Edit2 className="w-5 h-5" /></div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-lg text-slate-700">Edit / Add Quantity</span>
                  <span className="text-sm text-slate-500 font-medium">Update total or log an extra serving</span>
                </div>
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