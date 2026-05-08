
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Minus, Trophy,
  Shield, Timer as TimerIcon, Volume2, Settings,
  AlertTriangle, Zap, Fullscreen, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FightTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(360); // 6:00 default
  const [isRunning, setIsRunning] = useState(false);
  const [isChampionshipMode, setIsChampionshipMode] = useState(false);

  // Score states
  const [athlete1, setAthlete1] = useState({ points: 0, advantages: 0, penalties: 0 });
  const [athlete2, setAthlete2] = useState({ points: 0, advantages: 0, penalties: 0 });

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(360);
    setAthlete1({ points: 0, advantages: 0, penalties: 0 });
    setAthlete2({ points: 0, advantages: 0, penalties: 0 });
  };

  const updateScore = (athlete: 1 | 2, field: 'points' | 'advantages' | 'penalties', delta: number) => {
    const setter = athlete === 1 ? setAthlete1 : setAthlete2;
    setter(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
            Pro <span className="text-blue-600">Timer</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3 italic flex items-center gap-2">
            <Trophy size={12} className="text-blue-500" />
            Painel de Competição Oficial IBJJF
          </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsChampionshipMode(!isChampionshipMode)}
             className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isChampionshipMode ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-white'}`}
           >
              <Zap size={14} /> {isChampionshipMode ? 'Modo Competição Ativo' : 'Ativar Modo Competição'}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Championship Scoreboard */}
        <AnimatePresence>
          {isChampionshipMode && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Athlete 1 - Blue */}
              <div className="bg-blue-600 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">Atleta Azul / Blue</h3>
                    <div className="text-[120px] font-black leading-none tabular-nums italic mb-10 drop-shadow-2xl">
                      {athlete1.points}
                    </div>
                    <div className="flex gap-4 mb-10">
                       <button onClick={() => updateScore(1, 'points', 2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+2</button>
                       <button onClick={() => updateScore(1, 'points', 3)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+3</button>
                       <button onClick={() => updateScore(1, 'points', 4)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+4</button>
                       <button onClick={() => updateScore(1, 'points', -2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all"><Minus size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-10">
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Vantagens</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(1, 'advantages', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-amber-400">{athlete1.advantages}</span>
                             <button onClick={() => updateScore(1, 'advantages', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Plus size={14} /></button>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Punições</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(1, 'penalties', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-rose-400">{athlete1.penalties}</span>
                             <button onClick={() => updateScore(1, 'penalties', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Plus size={14} /></button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Athlete 2 - White/Red */}
              <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} className="text-red-600" />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">Atleta Branco / White</h3>
                    <div className="text-[120px] font-black leading-none tabular-nums italic mb-10 drop-shadow-2xl">
                      {athlete2.points}
                    </div>
                    <div className="flex gap-4 mb-10">
                       <button onClick={() => updateScore(2, 'points', 2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+2</button>
                       <button onClick={() => updateScore(2, 'points', 3)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+3</button>
                       <button onClick={() => updateScore(2, 'points', 4)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all">+4</button>
                       <button onClick={() => updateScore(2, 'points', -2)} className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center font-black transition-all"><Minus size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full border-t border-white/20 pt-10">
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Vantagens</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(2, 'advantages', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-amber-400">{athlete2.advantages}</span>
                             <button onClick={() => updateScore(2, 'advantages', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Plus size={14} /></button>
                          </div>
                       </div>
                       <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Punições</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => updateScore(2, 'penalties', -1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Minus size={14} /></button>
                             <span className="text-4xl font-black italic tabular-nums text-rose-400">{athlete2.penalties}</span>
                             <button onClick={() => updateScore(2, 'penalties', 1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Plus size={14} /></button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer Display */}
        <div className="lg:col-span-12 gap-8">
           <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-12 md:p-20 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5 overflow-hidden">
                 <motion.div 
                   initial={{ width: '100%' }}
                   animate={{ width: `${(timeLeft / 360) * 100}%` }}
                   className={`h-full transition-colors ${timeLeft < 60 ? 'bg-rose-500' : 'bg-blue-600'}`}
                 />
              </div>

              <div className={`text-[120px] md:text-[220px] font-black tabular-nums tracking-tighter italic leading-none transition-colors ${timeLeft < 60 && timeLeft > 0 ? 'text-rose-500' : isRunning ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                 {formatTime(timeLeft)}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
                 <button 
                   onClick={() => setIsRunning(!isRunning)}
                   className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-white transition-all active:scale-95 shadow-2xl ${isRunning ? 'bg-slate-800 shadow-slate-900/40' : 'bg-emerald-600 shadow-emerald-700/40'}`}
                 >
                    {isRunning ? <Pause size={48} /> : <Play size={48} className="translate-x-1" />}
                 </button>

                 <button 
                    onClick={resetTimer}
                    className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 hover:text-amber-500 transition-all active:scale-95"
                 >
                    <RotateCcw size={32} />
                 </button>

                 <div className="flex gap-2">
                    {[1, 2, 4, 5, 6, 8, 10].map(m => (
                      <button 
                        key={m}
                        onClick={() => { setIsRunning(false); setTimeLeft(m * 60); }}
                        className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${timeLeft === m * 60 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900'}`}
                      >
                         {m} MIN
                      </button>
                    ))}
                 </div>
              </div>

              <div className="mt-12 flex items-center gap-6">
                 <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                    <Volume2 size={16} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Aviso Sonoro Ativo</span>
                 </div>
                 <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Regras IBJJF 2026</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FightTimer;
