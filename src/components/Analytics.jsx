import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeeklyData } from '../db/database';
import LoadingSpinner from './LoadingSpinner';

export default function Analytics() {
  const [data, setData] = useState([]);
  const [selectedMacro, setSelectedMacro] = useState('Protein');
  
  const [currentEndDate, setCurrentEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [skipEmptyDays, setSkipEmptyDays] = useState(false);

  // 1. Pull Goals from Local Storage
  const [goalCalories, setGoalCalories] = useState(() => {
    const saved = localStorage.getItem('userCalorieGoal');
    return saved ? parseInt(saved, 10) : 2000;
  });

  const [goalProtein, setGoalProtein] = useState(() => {
    const saved = localStorage.getItem('userProteinGoal');
    return saved ? parseInt(saved, 10) : 120; // Default to 120g if not set yet
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); 
      const stats = await getWeeklyData(currentEndDate);
      setData(stats);
      setIsLoading(false); 
    };
    fetchData();
  }, [currentEndDate]); 

  const handlePreviousWeek = () => {
    const newDate = new Date(currentEndDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentEndDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentEndDate);
    newDate.setDate(newDate.getDate() + 7);
    
    if (newDate <= new Date()) {
      setCurrentEndDate(newDate);
    } else {
      setCurrentEndDate(new Date()); 
    }
  };

  const isCurrentWeek = () => {
    const today = new Date();
    return currentEndDate.toDateString() === today.toDateString();
  };

  const totals = data.reduce((acc, day) => ({
    calories: acc.calories + (day.Calories || 0),
    protein: acc.protein + (day.Protein || 0),
    carbs: acc.carbs + (day.Carbs || 0),
    fats: acc.fats + (day.Fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const activeDaysCount = data.filter(day => day.Calories > 0).length;
  const divisor = skipEmptyDays ? Math.max(1, activeDaysCount) : 7;

  const averages = {
    calories: totals.calories / divisor,
    protein: totals.protein / divisor,
    carbs: totals.carbs / divisor,
    fats: totals.fats / divisor,
  };

  // Base colors for the macros
  const getMacroColor = () => {
    switch (selectedMacro) {
      case 'Protein': return '#ef4444'; // Red
      case 'Carbs': return '#3b82f6';   // Blue
      case 'Fats': return '#eab308';    // Yellow
      default: return '#cbd5e1';
    }
  };

  const dateRangeString = data.length > 0 
    ? `${new Date(data[0].fullDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(data[data.length-1].fullDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 animate-in fade-in">
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm">
        
        {/* ... (Keep your existing Header code exactly as it is) ... */}
        
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Weekly Overview</h1>
          <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1 border border-slate-100">
            <button onClick={handlePreviousWeek} className="p-1 text-slate-500 hover:bg-white hover:shadow-sm rounded-full transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextWeek} 
              disabled={isCurrentWeek()}
              className={`p-1 rounded-full transition-all ${isCurrentWeek() ? 'text-slate-300' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className="text-slate-500 text-sm font-medium">
            {isLoading ? 'Calculating dates...' : dateRangeString}
          </p>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${skipEmptyDays ? 'text-green-600' : 'text-slate-400'}`}>
              Active Days Only
            </span>
            <button 
              onClick={() => setSkipEmptyDays(!skipEmptyDays)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${skipEmptyDays ? 'bg-green-500' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${skipEmptyDays ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mt-6 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors">
            <div className="text-xl font-bold text-green-600">{isLoading ? '-' : Math.round(averages.calories)}</div>
            <div className="text-xs text-slate-500 mt-1">Kcal</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors">
            <div className="text-lg font-bold text-red-500">{isLoading ? '-' : Math.round(averages.protein)}</div>
            <div className="text-xs text-slate-500 mt-1">Prot</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors">
            <div className="text-lg font-bold text-blue-500">{isLoading ? '-' : Math.round(averages.carbs)}</div>
            <div className="text-xs text-slate-500 mt-1">Carb</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors">
            <div className="text-lg font-bold text-yellow-500">{isLoading ? '-' : Math.round(averages.fats)}</div>
            <div className="text-xs text-slate-500 mt-1">Fat</div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-6">
        {isLoading ? (
          <LoadingSpinner message="Crunching Weekly Data..." />
        ) : (
          <>
            {/* --- CALORIES CHART --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Calories Trend</h3>
                {skipEmptyDays && <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-lg border border-green-100">{activeDaysCount} Days Tracked</span>}
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    
                    <ReferenceLine 
                      y={goalCalories} 
                      stroke="#22c55e" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ position: 'insideTopRight', value: 'GOAL', fill: '#22c55e', fontSize: 10, fontWeight: 'bold', dy: -10 }}
                    />

                    <Bar dataKey="Calories" radius={[6, 6, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Calories > goalCalories ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- MACROS CHART --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg">Macros Trend</h3>
                  {/* Only show the Goal text if Protein is selected */}
                  {selectedMacro === 'Protein' && (
                    <p className="text-xs font-semibold text-slate-400 mt-1">Daily Target: {goalProtein}g</p>
                  )}
                </div>
                <select 
                  value={selectedMacro} 
                  onChange={(e) => setSelectedMacro(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm py-2 px-3 rounded-xl outline-none focus:border-slate-400 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="Protein">Protein</option>
                  <option value="Carbs">Carbs</option>
                  <option value="Fats">Fats</option>
                </select>
              </div>

              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 15, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    
                    {/* ONLY render the goal line if Protein is selected */}
                    {selectedMacro === 'Protein' && (
                      <ReferenceLine 
                        y={goalProtein} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ 
                          position: 'insideTopRight', 
                          value: 'GOAL', 
                          fill: '#ef4444', 
                          fontSize: 10, 
                          fontWeight: 'bold',
                          dy: -10
                        }}
                      />
                    )}

                    <Bar dataKey={selectedMacro} radius={[6, 6, 0, 0]}>
                      {data.map((entry, index) => {
                        let barColor = getMacroColor();
                        
                        // If we are looking at protein, turn the bar GREEN if they successfully hit their goal!
                        if (selectedMacro === 'Protein') {
                          barColor = entry.Protein >= goalProtein ? '#22c55e' : '#ef4444'; 
                        }
                        
                        return <Cell key={`macro-cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}