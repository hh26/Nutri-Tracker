import React, { useState, useEffect } from 'react';
import { Coffee, Sun, Moon, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteMeal, moveMeal, copyMeal, updateMeal, getDailyLogs } from '../db/database';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LoadingSpinner from './LoadingSpinner';
import GoalCalculator from './GoalCalculator';

import MealSection from './MealSection';
import SearchModal from './SearchModal';
import ItemActionModal from './ItemActionModal';

const todayDateStr = new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [logs, setLogs] = useState([]);
  
  // 1. Calorie Goal State
  const [goalCalories, setGoalCalories] = useState(() => {
    const saved = localStorage.getItem('userCalorieGoal');
    return saved ? parseInt(saved, 10) : 2000; 
  });

  // 2. NEW: Protein Goal State
  const [goalProtein, setGoalProtein] = useState(() => {
    const saved = localStorage.getItem('userProteinGoal');
    return saved ? parseInt(saved, 10) : 120; // Default to 120g
  });
  
  // Date and Modal State
  const [viewDate, setViewDate] = useState(todayDateStr);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState('');
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 3. UPDATED: When a new goal is applied, update BOTH states in the Dashboard
  const handleNewGoal = (calculatedGoal) => {
    setGoalCalories(calculatedGoal);
    
    // The GoalCalculator saves the protein goal to localStorage right before calling this function,
    // so we can just grab it directly from storage to update our UI instantly!
    const updatedProtein = localStorage.getItem('userProteinGoal');
    if (updatedProtein) {
      setGoalProtein(parseInt(updatedProtein, 10));
    }
  };

  const refreshData = async () => {
    setIsLoading(true); 
    const dailyLogs = await getDailyLogs(viewDate); 
    
    setLogs(dailyLogs);
    
    const totals = dailyLogs.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    
    setDailyTotals(totals);
    setIsLoading(false); 
  };

  useEffect(() => {
    refreshData();
  }, [viewDate]);

  // Date Navigation Helpers
  const adjustDate = (days) => {
    const dateObj = new Date(viewDate + 'T12:00:00Z');
    dateObj.setDate(dateObj.getDate() + days);
    setViewDate(dateObj.toISOString().split('T')[0]);
  };

  const isToday = viewDate === todayDateStr;

  // Dynamic Title Logic
  let pageTitle = "Today's Intake";
  if (!isToday) {
    const viewDateObj = new Date(viewDate + 'T12:00:00Z');
    const todayObj = new Date(todayDateStr + 'T12:00:00Z');
    const diffDays = Math.ceil(Math.abs(todayObj - viewDateObj) / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1 && viewDateObj < todayObj) {
      pageTitle = "Yesterday's Intake";
    } else {
      pageTitle = `${viewDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Intake`;
    }
  }

  const handleOpenSearch = (mealType) => {
    setActiveMealType(mealType);
    setIsModalOpen(true);
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setIsActionModalOpen(true);
  };

  const progressPercentage = Math.min((dailyTotals.calories / goalCalories) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 relative animate-in fade-in">
      <GoalCalculator onSaveGoal={handleNewGoal} />
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm">
        
        {/* Title & Date Navigator Row */}
        <div className="flex flex-col items-center justify-center w-full">
          
          <h1 className="text-2xl font-bold text-slate-800 text-center">
            {pageTitle}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <button 
              onClick={() => adjustDate(-1)} 
              className="p-1.5 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 active:scale-95 transition-all border border-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <input 
                type="date" 
                max={todayDateStr}
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="bg-slate-50 text-slate-600 text-sm font-bold py-1.5 px-3 rounded-xl border border-slate-100 outline-none cursor-pointer text-center"
              />
            </div>

            <button 
              onClick={() => adjustDate(1)} 
              disabled={isToday}
              className={`p-1.5 rounded-full transition-all border ${isToday ? 'bg-transparent text-slate-300 border-transparent' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 active:scale-95'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
        </div>

        {/* Prominent Centered Progress Ring */}
        <div className="w-48 h-48 relative flex items-center justify-center mt-8 mb-6 mx-auto">
          <CircularProgressbar 
            value={progressPercentage} 
            strokeWidth={8}
            styles={buildStyles({
              pathColor: '#22c55e',
              trailColor: '#f8fafc',
              strokeLinecap: 'round',
            })}
          />
          <div className="absolute flex flex-col items-center justify-center mt-1">
            <span className="text-5xl font-extrabold text-slate-800 tracking-tight">
              {Math.round(dailyTotals.calories)}
            </span>
            <span className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
              Kcal
            </span>
            <div className="w-8 h-1 bg-slate-100 rounded-full my-2"></div>
            <span className="text-xs text-slate-400 font-medium">
              Goal: {goalCalories}
            </span>
          </div>
        </div>

        {/* 4. UPDATED: Pass the goalProtein down to the Protein MacroCard */}
        <div className="flex justify-between w-full max-w-sm px-2 mt-2 mx-auto">
          <MacroCard label="Carbs" value={dailyTotals.carbs} color="bg-blue-500" />
          <MacroCard label="Protein" value={dailyTotals.protein} goal={goalProtein} color="bg-red-500" />
          <MacroCard label="Fats" value={dailyTotals.fats} color="bg-yellow-500" />
        </div>
        
      </header>

      <main className="px-4 mt-6 space-y-4 relative min-h-[300px]">
        {isLoading ? (
          <LoadingSpinner message="Fetching Diary..." />
        ) : (
          <>
            <MealSection title="Breakfast" icon={<Coffee className="w-5 h-5 text-amber-600" />} logs={logs.filter(log => log.mealType === 'Breakfast')} onOpenSearch={() => handleOpenSearch("Breakfast")} onLogClick={handleLogClick} />
            <MealSection title="Lunch" icon={<Sun className="w-5 h-5 text-orange-500" />} logs={logs.filter(log => log.mealType === 'Lunch')} onOpenSearch={() => handleOpenSearch("Lunch")} onLogClick={handleLogClick} />
            <MealSection title="Snacks" icon={<Utensils className="w-5 h-5 text-purple-500" />} logs={logs.filter(log => log.mealType === 'Snacks')} onOpenSearch={() => handleOpenSearch("Snacks")} onLogClick={handleLogClick} />
            <MealSection title="Dinner" icon={<Moon className="w-5 h-5 text-indigo-500" />} logs={logs.filter(log => log.mealType === 'Dinner')} onOpenSearch={() => handleOpenSearch("Dinner")} onLogClick={handleLogClick} />
            <div className="h-16 shrink-0"></div>
          </>
        )}
      </main>

      <SearchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mealType={activeMealType} 
        onMealLogged={refreshData} 
        viewDate={viewDate} 
      />
      
      <ItemActionModal 
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        log={selectedLog}
        onMove={async (id, target) => { await moveMeal(id, target); refreshData(); }}
        onCopy={async (log, target) => { await copyMeal(log, target); refreshData(); }}
        onDelete={async (id) => { await deleteMeal(id); refreshData(); }}
        onUpdate={async (id, data) => { await updateMeal(id, data); refreshData(); }}
      />
    </div>
  );
}

// 5. UPDATED: MacroCard now accepts an optional 'goal' prop and formats it cleanly
function MacroCard({ label, value, goal, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-lg font-semibold text-slate-800">
        {Math.round(value)}
        {goal && <span className="text-sm text-slate-400 font-medium"> / {goal}</span>}
        <span className="text-sm font-medium">g</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        {label}
      </div>
    </div>
  );
}