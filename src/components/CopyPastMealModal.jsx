import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Square, Copy } from 'lucide-react';
import { getDailyLogs, copySelectedMeals } from '../db/database';

export default function CopyPastMealModal({ isOpen, onClose, targetDate, onSuccess }) {
  const [sourceDate, setSourceDate] = useState('');
  const [pastLogs, setPastLogs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // 1. Set default source date when modal opens
  // 1. Manage Modal Open/Close State
  useEffect(() => {
    if (isOpen && targetDate) {
      // When opening: Set date to yesterday
      const targetObj = new Date(targetDate + 'T12:00:00Z');
      targetObj.setDate(targetObj.getDate() - 1);
      setSourceDate(targetObj.toISOString().split('T')[0]);
    } else if (!isOpen) {
      // 🚨 THE FIX: When closing: Completely wipe the modal's memory
      setSourceDate('');
      setPastLogs([]);
      setSelectedIds([]);
    }
  }, [isOpen, targetDate]);

  // 2. Fetch logs WHENEVER the sourceDate changes
  useEffect(() => {
    const fetchPastLogs = async () => {
      // 🚨 THE FIX: Do not fetch if the modal is closed or date is empty
      if (!sourceDate || !isOpen) return; 
      
      setIsLoading(true);
      setPastLogs([]); 
      setSelectedIds([]); 

      try {
        const logs = await getDailyLogs(sourceDate);
        setPastLogs(logs || []);
      } catch (error) {
        console.error("Failed to fetch past logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPastLogs();
  }, [sourceDate, isOpen]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === pastLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pastLogs.map(log => log.id));
    }
  };

  const handleCopy = async () => {
    if (selectedIds.length === 0) return;
    
    setIsCopying(true);
    const logsToCopy = pastLogs.filter(log => selectedIds.includes(log.id));
    
    const success = await copySelectedMeals(logsToCopy, targetDate);
    
    setIsCopying(false);
    if (success) {
      onSuccess(); // Triggers refreshData in Dashboard
      onClose();
    } else {
      alert("Failed to copy. Check your browser console (F12) for the exact Supabase error!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Copy Past Meals</h2>
            <p className="text-xs text-slate-500 font-medium">To: {new Date(targetDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors border border-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto">
          {/* Date Selector */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Date to Copy From</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="date" 
                max={targetDate} 
                value={sourceDate}
                onChange={(e) => setSourceDate(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold outline-none focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Meals</span>
              {pastLogs.length > 0 && (
                <button onClick={toggleAll} className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors">
                  {selectedIds.length === pastLogs.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm font-medium animate-pulse">Loading meals...</div>
            ) : pastLogs.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">No meals found on this date.</p>
              </div>
            ) : (
              pastLogs.map(log => (
                <div 
                  key={log.id} 
                  onClick={() => toggleSelection(log.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${selectedIds.includes(log.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className={`${selectedIds.includes(log.id) ? 'text-blue-500' : 'text-slate-300'}`}>
                    {selectedIds.includes(log.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* FIX 1: Safely check for multiple variations of the food name */}
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {log.name || log.foodName || log.food_name || log.item || 'Unknown Item'}
                    </p>
                    <div className="flex gap-2 text-[11px] font-semibold text-slate-500 mt-0.5">
                      <span className="text-amber-600">{log.mealType}</span>
                      <span>•</span>
                      <span>{Math.round(log.calories)} kcal</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button 
            onClick={handleCopy}
            disabled={selectedIds.length === 0 || isCopying}
            className="w-full py-3.5 bg-blue-500 text-white font-bold rounded-xl shadow-md hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isCopying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy {selectedIds.length > 0 ? selectedIds.length : ''} Items
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}