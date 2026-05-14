import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeeklyData } from '../db/database';

export default function Analytics() {
  const [data, setData] = useState([]);
  const [selectedMacro, setSelectedMacro] = useState('Protein');
  
  // NEW: State to track the end date of our 7-day window
  const [currentEndDate, setCurrentEndDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      // Pass the currentEndDate to our updated database function
      const stats = await getWeeklyData(currentEndDate);
      setData(stats);
    };
    fetchData();
  }, [currentEndDate]); // Re-run whenever the date changes

  // Helper functions to shift the date by 7 days
  const handlePreviousWeek = () => {
    const newDate = new Date(currentEndDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentEndDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentEndDate);
    newDate.setDate(newDate.getDate() + 7);
    
    // Prevent going into the future beyond today
    if (newDate <= new Date()) {
      setCurrentEndDate(newDate);
    } else {
      setCurrentEndDate(newDate); // Reset to exactly today if they try to over-click
    }
  };

  // Helper to check if we are viewing the current week (to disable the Next button)
  const isCurrentWeek = () => {
    const today = new Date();
    return currentEndDate.toDateString() === today.toDateString();
  };

  // Calculate 7-day averages based on the currently viewed data
  const averages = data.reduce((acc, day) => ({
    calories: acc.calories + day.Calories / 7,
    protein: acc.protein + day.Protein / 7,
    carbs: acc.carbs + day.Carbs / 7,
    fats: acc.fats + day.Fats / 7,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const getMacroColor = () => {
    switch (selectedMacro) {
      case 'Protein': return '#ef4444';
      case 'Carbs': return '#3b82f6';
      case 'Fats': return '#eab308';
      default: return '#cbd5e1';
    }
  };

  // Format the date range for the header (e.g., "Oct 12 - Oct 18")
  const dateRangeString = data.length > 0 
    ? `${new Date(data[0].fullDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(data[data.length-1].fullDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 animate-in fade-in">
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-3xl shadow-sm">
        
        {/* NEW: Date Navigator UI */}
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
        
        {/* Shows the dynamic date range */}
        <p className="text-slate-500 text-sm font-medium">{dateRangeString}</p>
        
        <div className="grid grid-cols-4 gap-2 mt-6 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-xl font-bold text-green-600">{Math.round(averages.calories)}</div>
            <div className="text-xs text-slate-500 mt-1">Kcal</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-lg font-bold text-red-500">{Math.round(averages.protein)}</div>
            <div className="text-xs text-slate-500 mt-1">Prot</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-lg font-bold text-blue-500">{Math.round(averages.carbs)}</div>
            <div className="text-xs text-slate-500 mt-1">Carb</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-lg font-bold text-yellow-500">{Math.round(averages.fats)}</div>
            <div className="text-xs text-slate-500 mt-1">Fat</div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-6">
        
        <div className="bg-white p-5 rounded-3xl shadow-sm">
          <h3 className="font-bold text-lg mb-6">Calories Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Calories" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Macros Trend</h3>
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

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey={selectedMacro} fill={getMacroColor()} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}