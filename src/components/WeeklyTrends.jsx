import React, { useEffect, useState } from 'react';
import { getWeeklyData } from '../db/database';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

export default function WeeklyTrends({ targetDate }) {
  const [data, setData] = useState([]);
  const [averages, setAverages] = useState({ calories: 0 });

  useEffect(() => {
    const fetchTrends = async () => {
      const weeklyData = await getWeeklyData(targetDate);
      setData(weeklyData);

      // Calculate the 7-day average for the summary cards
      const totalCals = weeklyData.reduce((sum, day) => sum + day.calories, 0);
      setAverages({ calories: Math.round(totalCals / 7) });
    };
    fetchTrends();
  }, [targetDate]);

  return (
    <div className="px-4 py-6 space-y-6 pb-24 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Average Summary Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm text-center">
        <h2 className="text-slate-500 font-medium">7-Day Calorie Average</h2>
        <div className="text-3xl font-bold text-slate-800 mt-2">{averages.calories} <span className="text-lg text-slate-400 font-normal">kcal/day</span></div>
      </div>

      {/* Calorie Bar Chart */}
      <div className="bg-white p-4 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 ml-2">Calorie Intake</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} name="Calories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macros Line Chart */}
      <div className="bg-white p-4 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg mb-4 ml-2">Macronutrients (g)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend iconType="circle" wrapperStyle={{fontSize: '14px', paddingTop: '10px'}}/>
              <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} name="Protein" />
              <Line type="monotone" dataKey="carbs" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="Carbs" />
              <Line type="monotone" dataKey="fats" stroke="#eab308" strokeWidth={3} dot={{r: 4}} name="Fats" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}