import React, { useState } from 'react';
import { BookOpen, BarChart2, Layers, Utensils } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import ComboBuilder from './components/ComboBuilder';
import CustomFood from './components/CustomFood';

function App() {
  const [activeTab, setActiveTab] = useState('diary');
  
  return (
    <div className="antialiased h-screen overflow-y-auto bg-slate-50 relative">
      
      {/* View Router */}
      {activeTab === 'diary' && <Dashboard />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'combos' && <ComboBuilder />}
      {activeTab === 'foods' && <CustomFood />}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-100 flex justify-around pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        
        <button onClick={() => setActiveTab('diary')} className={`flex flex-col items-center p-3 w-20 transition-all ${activeTab === 'diary' ? 'text-green-600' : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl mb-1 ${activeTab === 'diary' ? 'bg-green-50' : ''}`}><BookOpen className="w-6 h-6" /></div>
          <span className="text-[10px] font-bold">DIARY</span>
        </button>

        <button onClick={() => setActiveTab('combos')} className={`flex flex-col items-center p-3 w-20 transition-all ${activeTab === 'combos' ? 'text-green-600' : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl mb-1 ${activeTab === 'combos' ? 'bg-green-50' : ''}`}><Layers className="w-6 h-6" /></div>
          <span className="text-[10px] font-bold">COMBOS</span>
        </button>

        <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center p-3 w-20 transition-all ${activeTab === 'analytics' ? 'text-green-600' : 'text-slate-400'}`}>
          <div className={`p-1.5 rounded-xl mb-1 ${activeTab === 'analytics' ? 'bg-green-50' : ''}`}><BarChart2 className="w-6 h-6" /></div>
          <span className="text-[10px] font-bold">STATS</span>
        </button>

        <button onClick={() => setActiveTab('foods')} className={`flex flex-col items-center p-3 w-16 transition-all ${activeTab === 'foods' ? 'text-amber-600' : 'text-stone-400'}`}>
          <div className={`p-1.5 rounded-xl mb-1 ${activeTab === 'foods' ? 'bg-amber-100/50' : ''}`}><Utensils className="w-6 h-6" /></div>
          <span className="text-[10px] font-bold">FOODS</span>
        </button>
      </nav>
    </div>
  );
}

export default App;