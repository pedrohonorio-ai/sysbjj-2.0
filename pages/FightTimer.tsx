
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, ChevronUp, ChevronDown, BellRing, BellOff, Music, Trophy, Plus, Trash2, Save, Shield, Activity, X, Layers, Copy, Zap } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

const SOUNDS = (t: any) => ({
  bjj: { name: 'BJJ Buzzer (Oficial)', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  classic: { name: t('timer.soundClassic'), url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  military: { name: t('timer.soundMilitary'), url: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3' },
  alarm: { name: t('timer.soundAlarm'), url: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3' },
  bell: { name: t('timer.soundBell'), url: 'https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3' }
});

const PRESETS = [
  { name: 'Branca / White', time: 300, color: 'bg-white text-slate-900 border-slate-200' },
  { name: 'Azul / Blue', time: 360, color: 'bg-blue-600 text-white border-blue-500' },
  { name: 'Roxa / Purple', time: 420, color: 'bg-purple-700 text-white border-purple-600' },
  { name: 'Marrom / Brown', time: 480, color: 'bg-amber-900 text-white border-amber-800' },
  { name: 'Preta / Black', time: 600, color: 'bg-slate-950 text-white border-slate-800' },
  { name: 'Kids / Juvenil', time: 240, color: 'bg-green-600 text-white border-green-500' }
];

enum TimerMode {
  FIGHT = 'fight',
  TIMER = 'timer',
  STOPWATCH = 'stopwatch'
}

interface CustomModel {
  id: string;
  name: string;
  roundTime: number;
  restTime: number;
  rounds: number;
}

const FightTimer: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TimerMode>(TimerMode.FIGHT);
  const [roundTime, setRoundTime] = useState(300);
  const [restTime, setRestTime] = useState(60);
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isResting, setIsResting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string>('bjj');
  const [warningAlarmed, setWarningAlarmed] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModel[]>(() => {
    const saved = localStorage.getItem('bjj_custom_timer_models');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaveModel, setShowSaveModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = React.useMemo(() => SOUNDS(t), [t]);

  const applyPreset = (time: number) => {
    setMode(TimerMode.FIGHT);
    stopAlarm();
    setIsActive(false);
    setIsResting(false);
    setRoundTime(time);
    setTimeLeft(time);
    setCurrentRound(1);
    setWarningAlarmed(false);
  };

  const applyCustomModel = (model: CustomModel) => {
    setMode(TimerMode.FIGHT);
    stopAlarm();
    setIsActive(false);
    setIsResting(false);
    setRoundTime(model.roundTime);
    setRestTime(model.restTime);
    setRounds(model.rounds);
    setTimeLeft(model.roundTime);
    setCurrentRound(1);
    setWarningAlarmed(false);
  };

  const saveModel = () => {
    if (!newModelName.trim()) return;
    const model: CustomModel = {
      id: Date.now().toString(),
      name: newModelName,
      roundTime,
      restTime,
      rounds
    };
    const updated = [...customModels, model];
    setCustomModels(updated);
    localStorage.setItem('bjj_custom_timer_models', JSON.stringify(updated));
    setNewModelName('');
    setShowSaveModel(false);
  };

  const deleteModel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customModels.filter(m => m.id !== id);
    setCustomModels(updated);
    localStorage.setItem('bjj_custom_timer_models', JSON.stringify(updated));
  };

  useEffect(() => {
    const soundUrl = (sounds as any)[selectedSound]?.url;
    if (soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.loop = true;
    }
    
    if (!warningAudioRef.current) {
      warningAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [selectedSound, sounds]);

  const startTimeRef = useRef<number | null>(null);
  const initialTimeLeftRef = useRef<number>(timeLeft);

  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        initialTimeLeftRef.current = timeLeft;
      }

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
        
        if (mode === TimerMode.STOPWATCH) {
          setTimeLeft(initialTimeLeftRef.current + elapsed);
        } else {
          const next = Math.max(0, initialTimeLeftRef.current - elapsed);
          setTimeLeft(next);

          if (next === 60 && mode === TimerMode.FIGHT && !isResting && !warningAlarmed) {
            if (!isMuted && warningAudioRef.current) {
              warningAudioRef.current.play().catch(() => {});
            }
            setWarningAlarmed(true);
          }

          if (next <= 0) {
            handlePhaseEnd();
            clearInterval(timerRef.current);
            startTimeRef.current = null;
          }
        }
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      startTimeRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isResting, warningAlarmed, mode]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    setIsAlarming(true);
    setWarningAlarmed(false);
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    if (mode === TimerMode.FIGHT) {
      setTimeout(() => {
        setIsAlarming(prev => {
          if (prev) {
            nextPhase();
          }
          return false;
        });
      }, 10000);
    }
  };

  const nextPhase = () => {
    stopAlarm();
    if (mode !== TimerMode.FIGHT) return;

    if (!isResting) {
      if (currentRound < rounds) {
        setIsResting(true);
        setTimeLeft(restTime);
        setIsActive(true);
      } else {
        reset();
      }
    } else {
      setIsResting(false);
      setCurrentRound((prev) => prev + 1);
      setTimeLeft(roundTime);
      setIsActive(true);
    }
  };

  const toggle = () => {
    if (!isActive && audioRef.current && !isAlarming) {
       audioRef.current.play().then(() => {
         audioRef.current?.pause();
         audioRef.current!.currentTime = 0;
       }).catch(() => {});
       
       const feedback = document.createElement('div');
       feedback.className = 'fixed inset-0 flex items-center justify-center z-[100] pointer-events-none animate-in zoom-in-150 duration-1000';
       feedback.innerHTML = `<h1 class="text-9xl font-black ${mode === TimerMode.STOPWATCH ? 'text-emerald-500' : 'text-blue-600'} uppercase italic drop-shadow-2xl">VAI! OSS!</h1>`;
       document.body.appendChild(feedback);
       setTimeout(() => feedback.remove(), 1000);
    }

    if (isAlarming) {
      if (mode === TimerMode.FIGHT) nextPhase();
      else stopAlarm();
    } else {
      setIsActive(!isActive);
    }
  };

  const stopAlarm = () => {
    setIsAlarming(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const reset = () => {
    stopAlarm();
    setIsActive(false);
    setIsResting(false);
    setCurrentRound(1);
    if (mode === TimerMode.STOPWATCH) {
      setTimeLeft(0);
    } else {
      setTimeLeft(roundTime);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    stopAlarm();
    if (newMode === TimerMode.STOPWATCH) {
      setTimeLeft(0);
    } else {
      setTimeLeft(roundTime);
    }
    setIsResting(false);
    setCurrentRound(1);
  };

  const getThemeColors = () => {
    if (isAlarming) return 'bg-red-600 border-white text-white shadow-[0_0_100px_rgba(239,68,68,0.5)]';
    if (mode === TimerMode.STOPWATCH) {
      return isActive ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-emerald-900 text-emerald-500/50';
    }
    if (isResting) return 'bg-indigo-600 border-indigo-400 text-white';
    if (isActive && timeLeft <= 60 && mode === TimerMode.FIGHT) return 'bg-amber-500 border-amber-300 text-slate-900';
    if (isActive) return 'bg-slate-950 border-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.2)]';
    return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white';
  };

  return (
    <div className="h-full overflow-y-auto pb-32 lg:pb-8 scrollbar-hide px-4 sm:px-8">
      <div className={`max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700`}>
        
        {/* Elite Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
              <div className="w-2 h-10 bg-blue-600 rounded-full" />
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Console de Tempo Elite</h1>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-6">Sincronização Atômica via SYSBJJ 2.0</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl transition-all hover:shadow-2xl">
            <button 
              onClick={() => changeMode(TimerMode.FIGHT)}
              className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === TimerMode.FIGHT ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Luta
            </button>
            <button 
              onClick={() => changeMode(TimerMode.TIMER)}
              className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === TimerMode.TIMER ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Temporizador
            </button>
            <button 
              onClick={() => changeMode(TimerMode.STOPWATCH)}
              className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === TimerMode.STOPWATCH ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Cronômetro
            </button>
          </div>
        </div>

        {/* Control Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Display Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className={`relative p-12 sm:p-24 rounded-[4rem] border-[12px] transition-all duration-1000 text-center group ${getThemeColors()}`}>
              
              {/* Background Glows */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-sm font-black uppercase tracking-[0.5em] opacity-60">
                    {isAlarming ? 'FIM DE ROUND' : isResting ? 'RECUPERAÇÃO' : mode.toUpperCase()}
                  </p>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>

                <h2 className={`text-[8rem] sm:text-[12rem] lg:text-[16rem] font-black font-mono leading-none tracking-tighter select-none tabular-nums drop-shadow-2xl transition-all duration-700 ${isActive ? 'scale-105' : 'scale-100 opacity-90'}`}>
                  {formatTime(timeLeft)}
                </h2>

                {mode === TimerMode.FIGHT && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {[...Array(rounds)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-2 rounded-full transition-all duration-500 ${i < currentRound ? 'w-12 bg-white' : 'w-4 bg-white/20'}`} 
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-center gap-8 mt-12 py-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggle} 
                    className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all shadow-3xl border-8 ${
                      isAlarming ? 'bg-white text-red-600 shadow-white/30 border-red-500' : 
                      isActive ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 
                      'bg-blue-600 text-white border-white/40 shadow-blue-500/50'
                    }`}
                  >
                    {isAlarming ? <BellRing size={64} className="animate-wiggle" /> : isActive ? <Pause size={64} fill="currentColor" /> : <Play size={64} className="ml-4" fill="currentColor" />}
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={reset} 
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white/10 text-white flex items-center justify-center border-8 border-white/5 hover:bg-white/20 transition-all shadow-2xl"
                  >
                    <RotateCcw size={48} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Sub Controls */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${mode === TimerMode.STOPWATCH ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'}`}>
               <div className="bento-card p-8 group">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo de Round</p>
                      <h4 className="text-3xl font-black dark:text-white tabular-nums italic">{formatTime(roundTime)}</h4>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600">
                      <TimerIcon size={24} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {const v = Math.min(3600, roundTime + 60); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">+1m</button>
                    <button onClick={() => {const v = Math.max(10, roundTime - 60); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">-1m</button>
                    <button onClick={() => {const v = Math.min(3600, roundTime + 10); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">+10s</button>
                  </div>
               </div>

               <div className="bento-card p-8 group">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Intervalo / Descanso</p>
                      <h4 className="text-3xl font-black dark:text-white tabular-nums italic">{formatTime(restTime)}</h4>
                    </div>
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Activity size={24} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setRestTime(prev => Math.min(600, prev + 15))} className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">+15s</button>
                    <button onClick={() => setRestTime(prev => Math.max(0, prev - 15))} className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">-15s</button>
                  </div>
               </div>
            </div>
          </div>

          {/* Configuration Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Rounds Selector */}
            <div className={`bento-card p-8 transition-all duration-500 ${mode !== TimerMode.FIGHT ? 'opacity-30 pointer-events-none' : ''}`}>
               <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                 <Plus size={16} className="text-blue-600" /> Séries / Rounds
               </h3>
               <div className="grid grid-cols-4 gap-3">
                 {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(n => (
                   <button 
                     key={n}
                     onClick={() => setRounds(n)}
                     className={`py-3 rounded-xl font-black text-[11px] transition-all ${rounds === n ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100'}`}
                   >
                     {n}
                   </button>
                 ))}
               </div>
            </div>

            {/* Presets Grid */}
            <div className="bento-card p-8">
               <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                 <Trophy size={16} className="text-amber-500" /> Presets de Graduação
               </h3>
               <div className="space-y-3">
                 {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset.time)}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 ${preset.color} ${roundTime === preset.time && mode === TimerMode.FIGHT ? 'scale-105 shadow-2xl relative z-10' : 'opacity-60'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{preset.name}</span>
                      <span className="text-xs font-black font-mono">{formatTime(preset.time)}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Audio Settings */}
            <div className="bento-card p-8">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Music size={16} className="text-purple-500" /> Áudio & Alerta
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sinal Sonoro de Fim</p>
                  <select 
                    value={selectedSound} 
                    onChange={(e) => setSelectedSound(e.target.value as any)}
                    className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest outline-none dark:text-white cursor-pointer hover:border-blue-500/50 transition-all"
                  >
                    {Object.entries(sounds).map(([key, value]: [string, any]) => (
                      <option key={key} value={key} className="bg-slate-900 text-white font-sans">{value.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${isMuted ? 'bg-red-500 text-white border-red-400' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{isMuted ? 'Modo Silencioso' : 'Áudio Ativado'}</span>
                  {isMuted ? <BellOff size={18} /> : <BellRing size={18} className="group-hover:animate-bounce" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistence Modal (Modified) */}
      <AnimatePresence>
        {showSaveModel && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-white/10 max-w-xl w-full space-y-8 shadow-elite"
            >
              <div className="flex items-center gap-4">
                 <div className="w-2 h-8 bg-blue-600 rounded-full" />
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Salvar Preset Elite</h2>
              </div>
              
              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl grid grid-cols-3 gap-4 text-center">
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Rounds</p>
                    <p className="text-lg font-black dark:text-white">{rounds}</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Tempo</p>
                    <p className="text-lg font-black dark:text-white">{formatTime(roundTime)}</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Pausa</p>
                    <p className="text-lg font-black dark:text-white">{formatTime(restTime)}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome do Modelo de Treino</p>
                <input 
                  type="text" 
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="EX: LUTA ESPECÍFICA MARROM"
                  className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-5 outline-none focus:border-blue-600 transition-all font-black uppercase text-xs dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={saveModel}
                  className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                >
                  Confirmar Registro
                </button>
                <button 
                  onClick={() => setShowSaveModel(false)}
                  className="px-8 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-2xl font-black uppercase text-xs flex items-center justify-center p-2"
                >
                  <X />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FightTimer;
