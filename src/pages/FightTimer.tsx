
import React from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

const FightTimer: React.FC = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Timer de <span className="text-blue-600">Luta</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Controle de Tempo para Rola e Competições</p>
      </header>
      <div className="p-20 bg-slate-900 rounded-[3rem] border border-white/5 text-center flex flex-col items-center">
        <div className="text-[120px] font-black text-white tracking-widest mb-12">06:00</div>
        <div className="flex gap-6">
            <button className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white"><Play size={32}/></button>
            <button className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white"><Pause size={32}/></button>
            <button className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white"><RotateCcw size={32}/></button>
        </div>
      </div>
    </div>
  );
};

export default FightTimer;
