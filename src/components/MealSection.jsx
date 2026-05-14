// src/components/MealSection.jsx
import React from 'react';
import { Plus } from 'lucide-react';

export default function MealSection({ title, icon, logs = [], onOpenSearch, onLogClick }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">{icon}</div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button 
          onClick={onOpenSearch} 
          className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {logs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => onLogClick(log)} // Opens the modal
              className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div>
                <p className="font-semibold text-slate-800">{log.foodName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-medium text-green-600">{Math.round(log.calories)} kcal</span>
                  <span className="mx-1">•</span>
                  P: {Math.round(log.protein)}g | C: {Math.round(log.carbs)}g | F: {Math.round(log.fats)}g
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}