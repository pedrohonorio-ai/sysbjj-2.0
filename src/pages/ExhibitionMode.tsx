
import React, { useState, useEffect } from 'react';
import { Monitor, Clock, Users, Trophy, Zap, Calendar, Heart, Shield, Cake, ShieldCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useProfile } from '../contexts/ProfileContext';
import { motion, AnimatePresence } from 'motion/react';

const ExhibitionMode: React.FC = () => {
  const { students, schedules } = useData();
  const { profile } = useProfile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(360);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch weather
    const fetchWeather = async () => {
      try {
        // Try to get geolocation
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await response.json();
          if (data.current_weather) {
            setTemperature(Math.round(data.current_weather.temperature));
          }
        }, async () => {
          // Fallback if geolocation fails
          const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current_weather=true'); // Rio de Janeiro default
          const data = await response.json();
          if (data.current_weather) {
            setTemperature(Math.round(data.current_weather.temperature));
          }
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 1800000); // 30 mins
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play sound here if possible
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getTodaySchedules = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const today = days[currentTime.getDay()];
    return schedules.filter(s => s.days.includes(today)).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getBirthdays = () => {
    const today = new Date().toISOString().slice(5, 10);
    return students.filter(s => s.birthDate?.slice(5, 10) === today);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden p-8 font-sans selection:bg-blue-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Panel: Timer & Status */}
        <div className="lg:col-span-8 flex flex-col gap-8 h-full">
          <header className="flex items-center justify-between bg-white/5 p-8 rounded-[3rem] border border-white/5">
            <div className="flex items-center gap-6">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} className="h-16 w-16 object-contain" alt="Logo" />
              ) : (
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black italic shadow-2xl shadow-blue-600/20">
                  {profile.academyName?.[0] || 'S'}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{profile.academyName || 'SYSBJJ Academy'}</h1>
                <p className="text-blue-500 font-black uppercase tracking-widest text-[10px] mt-1 italic">Dojo Experience • Mode Monitor</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-8">
              {temperature !== null && (
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-black italic text-blue-500 leading-none">
                    {temperature}°C
                  </div>
                  <p className="text-slate-500 font-black uppercase tracking-widest text-[8px] mt-1">Temp. Local</p>
                </div>
              )}
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <div className="text-4xl font-black italic tabular-nums leading-none">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-[4rem] border border-white/5 relative overflow-hidden group">
            <div className={`text-[280px] font-black tabular-nums tracking-tighter italic leading-none transition-all duration-500 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : isRunning ? 'text-blue-500' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-6 mt-12">
               <button 
                 onClick={() => setIsRunning(!isRunning)}
                 className={`px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 shadow-2xl ${isRunning ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-600/30'}`}
               >
                 {isRunning ? 'Pausar Round' : 'Começar Round'}
               </button>
               <button 
                 onClick={() => { setTimeLeft(360); setIsRunning(false); }}
                 className="px-12 py-6 bg-white/10 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/20 transition-all active:scale-95 border border-white/5"
               >
                 Reiniciar
               </button>
            </div>

            <div className="absolute bottom-12 flex gap-4">
               {[5, 6, 8, 10].map(m => (
                 <button 
                   key={m}
                   onClick={() => { setTimeLeft(m * 60); setIsRunning(false); }}
                   className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${timeLeft === m * 60 ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-white/20 text-slate-400'}`}
                 >
                   {m} MIN
                 </button>
               ))}
            </div>
          </main>
        </div>

        {/* Right Panel: Daily Schedule & Birthdays */}
        <div className="lg:col-span-4 flex flex-col gap-8 h-full">
           <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/5 p-10 flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                 <Calendar className="text-blue-500" />
                 Próximas Aulas <span className="text-slate-500 opacity-50 ml-auto">Hoje</span>
              </h2>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {getTodaySchedules().length === 0 ? (
                  <p className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sem aulas programadas para hoje.</p>
                ) : (
                  getTodaySchedules().map((session, idx) => (
                    <div key={idx} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:bg-blue-600/10 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="text-3xl font-black italic text-blue-500">
                             {session.time}
                          </div>
                          <div>
                             <h4 className="font-black uppercase tracking-tight text-lg">{session.title}</h4>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{session.instructor} • {session.category}</p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           <div className="bg-blue-600 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-blue-600/30">
              <div className="absolute top-0 right-0 p-8 text-white/5">
                 <Heart size={140} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6 flex items-center gap-3">
                    <Cake className="text-white" />
                    Aniversariantes
                 </h3>
                 <div className="space-y-3">
                    {getBirthdays().length === 0 ? (
                      <p className="font-black uppercase tracking-[0.2em] text-[10px] text-blue-200">Ninguém completa ano hoje. OSS!</p>
                    ) : (
                      getBirthdays().map(student => (
                        <div key={student.id} className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl border border-white/10">
                           <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black">
                              {student.name[0]}
                           </div>
                           <span className="font-black uppercase tracking-widest text-xs italic">{student.name}</span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>

           {/* Academy Stats or System Integrity Pin */}
           <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none mb-1">Integridade Local</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 italic">Sistema Protegido</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/5 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Live</span>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionMode;
