
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Timer, Users, Calendar, Cake, Shield, 
  ArrowLeft, Zap, Clock, BookOpen, Trophy,
  Activity, Bell, QrCode
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { StudentStatus } from '../types';

const ExhibitionMode: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { students, schedules } = useData();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentClass = useMemo(() => {
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTotalMin = hour * 60 + minutes;
    
    return schedules.find(cls => {
      const [clsHour, clsMin] = cls.time.split(':').map(Number);
      const clsTotalMin = clsHour * 60 + clsMin;
      return currentTotalMin >= clsTotalMin && currentTotalMin < clsTotalMin + 90;
    });
  }, [schedules, now]);

  const nextClass = useMemo(() => {
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTotalMin = hour * 60 + minutes;
    
    return schedules
      .filter(cls => {
        const [clsHour, clsMin] = cls.time.split(':').map(Number);
        const clsTotalMin = clsHour * 60 + clsMin;
        return clsTotalMin > currentTotalMin;
      })
      .sort((a, b) => {
        const [aH, aM] = a.time.split(':').map(Number);
        const [bH, bM] = b.time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      })[0];
  }, [schedules, now]);

  const upcomingBirthdays = useMemo(() => {
    const currentMonthIdx = now.getMonth();
    return students.filter(s => {
      if (!s.birthDate) return false;
      const bDate = new Date(s.birthDate);
      return bDate.getMonth() === currentMonthIdx;
    }).sort((a, b) => new Date(a.birthDate).getDate() - new Date(b.birthDate).getDate());
  }, [students, now]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-y-auto flex flex-col font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-600 rounded-full blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-600 rounded-full blur-[150px] opacity-10 translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative z-10 p-4 sm:p-12 flex items-center justify-between border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/20">
            {profile.academyName[0] || 'S'}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">{profile.academyName}</h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">{t('exhibition.title')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-right">
            <p className="text-6xl font-black tracking-tighter tabular-nums leading-none mb-1">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
              {now.toLocaleDateString(t('common.dateLocale'), { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
            title={t('exhibition.exit')}
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 p-4 sm:p-12 overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Mat Status */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex-1 bg-white/5 px-6 py-6 sm:px-12 sm:py-12 rounded-[2.5rem] sm:rounded-[4rem] border border-white/5 flex flex-col justify-center relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[150px] opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-1000" />
            
            {currentClass ? (
              <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40">
                  <Activity size={14} className="animate-pulse" /> {t('exhibition.currentClass')}
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-sm">
                  {currentClass.title}
                </h2>
                <div className="flex flex-wrap items-center gap-8 sm:gap-16 pt-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-blue-400 border border-white/5 shadow-inner backdrop-blur-sm">
                      <Clock size={40} className="sm:w-12 sm:h-12" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">{t('classes.time')}</p>
                      <p className="text-xl sm:text-5xl font-black tabular-nums tracking-tighter">{currentClass.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-cyan-400 border border-white/5 shadow-inner backdrop-blur-sm">
                      <Shield size={40} className="sm:w-12 sm:h-12" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">{t('common.instructor')}</p>
                      <p className="text-xl sm:text-5xl font-black uppercase tracking-tighter">{currentClass.instructor}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 opacity-40">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Calendar size={64} />
                </div>
                <p className="text-2xl font-black uppercase tracking-widest italic">{t('exhibition.noClass')}</p>
              </div>
            )}
          </div>

          {/* Next Classes Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                  <Timer size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('common.timer')}</p>
                  <p className="text-2xl font-black uppercase tracking-tight">{t('exhibition.readyToSpar')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/timer')} className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <ArrowLeft className="rotate-180" size={20} />
              </button>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                  <QrCode size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Check-in</p>
                  <p className="text-2xl font-black uppercase tracking-tight">{t('exhibition.studentPortal')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/attendance')} className="p-4 bg-cyan-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                <ArrowLeft className="rotate-180" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
          {/* Next Class Card */}
          <div className="bg-blue-600 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-20" />
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em] mb-6">{t('exhibition.nextClass')}</p>
            {nextClass ? (
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{nextClass.title}</h3>
                <div className="flex items-center gap-4 text-blue-100">
                  <Clock size={18} />
                  <span className="text-xl font-black tabular-nums">{nextClass.time}</span>
                </div>
              </div>
            ) : (
              <p className="text-blue-200 font-bold italic">{t('exhibition.endOfActivities')}</p>
            )}
          </div>

          {/* Birthdays */}
          <div className="flex-1 bg-amber-500 rounded-[3rem] p-10 text-slate-900 relative overflow-hidden flex flex-col group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-20" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">{t('dashboard.celebrations')}</h3>
                <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">{t('dashboard.monthOf')} {now.toLocaleDateString(t('common.dateLocale'), { month: 'long' })}</p>
              </div>
              <Cake size={24} className="text-slate-800 group-hover:animate-bounce" />
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide pr-1">
              {upcomingBirthdays.slice(0, 5).map((s, i) => {
                const bDay = new Date(s.birthDate).getDate();
                const isToday = bDay === now.getDate();
                return (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${isToday ? 'bg-white shadow-xl' : 'bg-white/20'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isToday ? 'bg-amber-500 text-white' : 'bg-white/30 text-slate-800'}`}>
                        {bDay}
                      </div>
                      <p className="text-xs font-black uppercase tracking-tight truncate max-w-[150px]">{s.name}</p>
                    </div>
                    {isToday && <span className="text-[10px] animate-bounce">🎉</span>}
                  </div>
                );
              })}
              {upcomingBirthdays.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center">
                  <Cake size={48} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('exhibition.noBirthdays')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Footer */}
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
              <Shield size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">
              {t('exhibition.privacyActive')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitionMode;
