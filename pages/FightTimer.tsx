
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, ChevronUp, ChevronDown, BellRing, BellOff, Music, Trophy, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { GoogleGenAI, Modality } from "@google/genai";

const SOUNDS = (t: any, mateUrl?: string | null) => ({
  bjj: { name: 'BJJ Buzzer (Oficial)', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  mate: { name: t('timer.soundMate'), url: mateUrl || 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' }, 
  classic: { name: t('timer.soundClassic'), url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  military: { name: t('timer.soundMilitary'), url: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3' },
  alarm: { name: t('timer.soundAlarm'), url: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3' },
  bell: { name: t('timer.soundBell'), url: 'https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3' }
});

const pcmToWav = (pcmData: Int16Array, sampleRate: number): string => {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (v: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length * 2, true);

  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

const PRESETS = [
  { name: 'Branca / White', time: 300, color: 'bg-white text-slate-900 border-slate-200' },
  { name: 'Azul / Blue', time: 360, color: 'bg-blue-600 text-white border-blue-500' },
  { name: 'Roxa / Purple', time: 420, color: 'bg-purple-700 text-white border-purple-600' },
  { name: 'Marrom / Brown', time: 480, color: 'bg-amber-900 text-white border-amber-800' },
  { name: 'Preta / Black', time: 600, color: 'bg-slate-950 text-white border-slate-800' },
  { name: 'Kids / Juvenil', time: 240, color: 'bg-green-600 text-white border-green-500' }
];

interface CustomModel {
  id: string;
  name: string;
  roundTime: number;
  restTime: number;
  rounds: number;
}

const FightTimer: React.FC = () => {
  const { t } = useTranslation();
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
  const [mateUrl, setMateUrl] = useState<string | null>(null);
  const [isGeneratingMate, setIsGeneratingMate] = useState(false);
  
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = React.useMemo(() => SOUNDS(t, mateUrl), [t, mateUrl]);

  useEffect(() => {
    const generateMate = async () => {
      if (selectedSound === 'mate' && !mateUrl && !isGeneratingMate) {
        setIsGeneratingMate(true);
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
            console.warn("FightTimer: GEMINI_API_KEY is not defined. Mate sound generation disabled.");
            setIsGeneratingMate(false);
            return;
          }
          const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: 'Say in a thick, authoritative Japanese martial arts referee voice: "待て!" (Mate!)' }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const binaryString = window.atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const pcmData = new Int16Array(bytes.buffer);
            const wavUrl = pcmToWav(pcmData, 24000);
            setMateUrl(wavUrl);
          }
        } catch (error) {
          console.error("FightTimer: Error generating Mate sound:", error);
        } finally {
          setIsGeneratingMate(false);
        }
      }
    };
    generateMate();
  }, [selectedSound, mateUrl, isGeneratingMate]);

  const applyPreset = (time: number) => {
    stopAlarm();
    setIsActive(false);
    setIsResting(false);
    setRoundTime(time);
    setTimeLeft(time);
    setCurrentRound(1);
    setWarningAlarmed(false);
  };

  const applyCustomModel = (model: CustomModel) => {
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

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next === 60 && !isResting && !warningAlarmed) {
            if (!isMuted && warningAudioRef.current) {
              warningAudioRef.current.play().catch(() => {});
            }
            setWarningAlarmed(true);
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft <= 0 && isActive) {
      handlePhaseEnd();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft, isResting, warningAlarmed]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    setIsAlarming(true);
    setWarningAlarmed(false);
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    // Auto-advance after 20 seconds
    setTimeout(() => {
      setIsAlarming(prev => {
        if (prev) {
          nextPhase();
        }
        return false;
      });
    }, 20000);
  };

  const nextPhase = () => {
    stopAlarm();
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
    }

    if (isAlarming) {
      nextPhase();
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
    setTimeLeft(roundTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-full overflow-y-auto pb-32 lg:pb-8 scrollbar-hide">
      <div className={`max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 transition-all p-4 ${isAlarming ? 'bg-red-500/10 rounded-[2rem] scale-[1.01]' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black flex items-center gap-3 dark:text-white uppercase tracking-tighter">
              <TimerIcon className={isAlarming ? "text-red-500 animate-bounce" : "text-red-600"} size={32} />
              {t('timer.title')}
            </h1>
            <p className="text-[9px] font-black uppercase text-blue-500/60 ml-10 mt-1 tracking-widest">{t('timer.audioNotice')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {isGeneratingMate ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Music size={16} className="text-blue-500" />
              )}
              <select 
                value={selectedSound} 
                onChange={(e) => setSelectedSound(e.target.value as any)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none dark:text-white cursor-pointer"
              >
                {Object.entries(sounds).map(([key, value]: [string, any]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {isMuted ? <BellOff size={16} /> : <BellRing size={16} />}
              {isMuted ? 'OFF' : 'ON'}
            </button>
          </div>
        </div>

        {/* Presets & Custom Models Row */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-4 min-w-max">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                <Trophy size={20} />
              </div>
              <div className="flex gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.time)}
                    className={`px-5 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest border transition-all hover:scale-105 active:scale-95 ${preset.color} ${roundTime === preset.time && rounds === 5 && restTime === 60 ? 'ring-4 ring-blue-500/20 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-4 min-w-max">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                <Plus size={20} />
              </div>
              <div className="flex gap-2 items-center">
                {customModels.map((model) => (
                  <div key={model.id} className="relative group">
                    <button
                      onClick={() => applyCustomModel(model)}
                      className={`px-5 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 ${roundTime === model.roundTime && rounds === model.rounds && restTime === model.restTime ? 'ring-4 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                    >
                      {model.name}
                    </button>
                    <button 
                      onClick={(e) => deleteModel(model.id, e)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 size={8} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setShowSaveModel(true)}
                  className="px-5 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"
                >
                  {t('timer.customPresets')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Model Modal/Form */}
        {showSaveModel && (
          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t('timer.savePreset')}</h3>
              <div className="flex gap-4 text-[8px] font-black uppercase bg-white/10 px-3 py-1.5 rounded-full">
                <span>Rounds: {rounds}</span>
                <span>Tempo: {formatTime(roundTime)}</span>
                <span>Pausa: {formatTime(restTime)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder={t('timer.presetName')}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 outline-none placeholder:text-white/40 font-bold uppercase text-[10px]"
                onKeyDown={(e) => e.key === 'Enter' && saveModel()}
              />
              <button 
                onClick={saveModel}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
              >
                <Save size={16} /> {t('common.confirm')}
              </button>
              <button onClick={() => setShowSaveModel(false)} className="px-4 py-3 bg-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                X
              </button>
            </div>
          </div>
        )}

        <div className={`relative p-8 sm:p-16 rounded-[2.5rem] border-[10px] transition-all duration-700 text-center shadow-2xl overflow-hidden ${
          isAlarming 
          ? 'bg-red-600 border-white animate-pulse text-white' 
          : isResting 
            ? 'bg-blue-600 border-blue-400 text-white' 
            : (isActive && timeLeft <= 60 && !isResting) 
              ? 'bg-amber-500 border-amber-300 text-slate-900 animate-[pulse_2s_infinite]'
              : isActive ? 'bg-slate-900 border-red-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}>
          <p className={`text-xl sm:text-2xl font-black uppercase tracking-[0.4em] mb-4 relative ${isActive && timeLeft <= 60 && !isResting ? 'opacity-100 text-slate-900' : 'opacity-40'}`}>
            {isAlarming ? t('timer.endOfRound') : isResting ? t('timer.recovery') : (isActive && timeLeft <= 60 && !isResting) ? 'ÚLTIMO MINUTO' : `${t('timer.round')} ${currentRound} / ${rounds}`}
          </p>
          <h2 className="text-[7rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] font-bold font-mono leading-none tracking-tighter relative select-none">
            {formatTime(timeLeft)}
          </h2>
          <div className="mt-8 flex justify-center gap-6 sm:gap-10 relative">
            <button 
              onClick={toggle} 
              className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 ${
                isAlarming ? 'bg-white text-red-600 hover:scale-110 shadow-white/20' : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              {isAlarming ? <BellRing size={40} className="animate-wiggle" /> : isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
            </button>
            <button onClick={reset} className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 hover:bg-white/20 transition-all shadow-xl active:scale-90">
              <RotateCcw size={32} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity" style={{opacity: isAlarming ? 0.5 : 1}}>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('timer.roundTime')}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black dark:text-white font-mono">{formatTime(roundTime)}</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button disabled={isAlarming} onClick={() => {const v = Math.min(3600, roundTime + 60); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="hover:text-blue-600 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <ChevronUp size={16}/>
                    <span className="text-[6px] font-black -mt-1">+1m</span>
                  </button>
                  <button disabled={isAlarming} onClick={() => {const v = Math.max(10, roundTime - 60); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="hover:text-blue-600 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <span className="text-[6px] font-black -mb-1">-1m</span>
                    <ChevronDown size={16}/>
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button disabled={isAlarming} onClick={() => {const v = Math.min(3600, roundTime + 10); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="hover:text-amber-500 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <ChevronUp size={16}/>
                    <span className="text-[6px] font-black -mt-1">+10s</span>
                  </button>
                  <button disabled={isAlarming} onClick={() => {const v = Math.max(10, roundTime - 10); setRoundTime(v); if(!isActive) setTimeLeft(v);}} className="hover:text-amber-500 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <span className="text-[6px] font-black -mb-1">-10s</span>
                    <ChevronDown size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity" style={{opacity: isAlarming ? 0.5 : 1}}>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('timer.restTime')}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black dark:text-white font-mono">{formatTime(restTime)}</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button disabled={isAlarming} onClick={() => setRestTime(prev => Math.min(600, prev + 15))} className="hover:text-blue-600 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <ChevronUp size={16}/>
                    <span className="text-[6px] font-black -mt-1">+15s</span>
                  </button>
                  <button disabled={isAlarming} onClick={() => setRestTime(prev => Math.max(0, prev - 15))} className="hover:text-blue-600 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <span className="text-[6px] font-black -mb-1">-15s</span>
                    <ChevronDown size={16}/>
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button disabled={isAlarming} onClick={() => setRestTime(prev => Math.min(600, prev + 5))} className="hover:text-amber-500 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <ChevronUp size={16}/>
                    <span className="text-[6px] font-black -mt-1">+5s</span>
                  </button>
                  <button disabled={isAlarming} onClick={() => setRestTime(prev => Math.max(0, prev - 5))} className="hover:text-amber-500 disabled:opacity-30 p-0.5 flex flex-col items-center">
                    <span className="text-[6px] font-black -mb-1">-5s</span>
                    <ChevronDown size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity" style={{opacity: isAlarming ? 0.5 : 1}}>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('timer.totalRounds')}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black dark:text-white">{rounds}</span>
              <div className="flex flex-col gap-1">
                 <button disabled={isAlarming} onClick={() => setRounds(prev => Math.min(20, prev + 1))} className="hover:text-blue-600 disabled:opacity-30 p-1"><ChevronUp size={20}/></button>
                 <button disabled={isAlarming} onClick={() => setRounds(prev => Math.max(1, prev - 1))} className="hover:text-blue-600 disabled:opacity-30 p-1"><ChevronDown size={20}/></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FightTimer;
