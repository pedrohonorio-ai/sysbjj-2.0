
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, TrendingUp, AlertCircle, Calendar, CreditCard,
  Timer, UserPlus, CheckCircle2, Trophy as TrophyIcon, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, ArrowRight, Baby,
  Edit2, X, Trash2, Clock, BookOpen, QrCode, Scan, Zap, Cake, Store, Activity, History, Shield, Instagram, ChevronRight, Monitor, RefreshCw, Settings
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { StudentStatus } from '../types';
import { MASTER_ADMINS } from '../constants';

const StatCard = ({ title, value, icon, color, trend, trendUp, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    className="bg-white dark:bg-slate-900 px-6 py-6 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-'), size: 20 })}
      </div>
      <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${trendUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
        {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1 leading-none">{title}</h3>
      <p className="text-2xl font-display font-black text-slate-900 dark:text-white leading-none tracking-tighter truncate">{value}</p>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { students, payments, schedules, extraRevenue, lessonPlans } = useData();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const validStudents = students.filter(s => s.status !== StudentStatus.INACTIVE);
  const totalStudents = validStudents.length;
  const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE).length;
  
  const currentMonth = now.toISOString().substring(0, 7);
  const monthlyRevenue = payments
    .filter(p => p.status === 'Confirmed' && p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyExtra = extraRevenue
    .filter(r => r.date.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.amount, 0);
    
  const pendingPaymentsCount = students.filter(s => s.status === StudentStatus.OVERDUE).length;
  const competitorsCount = students.filter(s => s.isCompetitor).length;

  const upcomingBirthdays = useMemo(() => {
    const currentMonthIdx = now.getMonth();
    return students.filter(s => {
      if (!s.birthDate) return false;
      const bDate = new Date(s.birthDate);
      return bDate.getMonth() === currentMonthIdx;
    }).sort((a, b) => new Date(a.birthDate).getDate() - new Date(b.birthDate).getDate());
  }, [students, now]);

  const revenueGoal = 15000;
  const revenueProgress = Math.min((monthlyRevenue / revenueGoal) * 100, 100);

  const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
  const isMasterAdmin = MASTER_ADMINS.includes(auth.email?.toLowerCase());

  const latestPlan = useMemo(() => {
    return lessonPlans[0];
  }, [lessonPlans]);

  const currentClass = useMemo(() => {
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return schedules.find(cls => {
      const [clsHour, clsMin] = cls.time.split(':').map(Number);
      const clsTotalMin = clsHour * 60 + clsMin;
      const currentTotalMin = hour * 60 + minutes;
      // Considera aula em progresso se estiver dentro de 90 min do início
      return currentTotalMin >= clsTotalMin && currentTotalMin < clsTotalMin + 90;
    });
  }, [schedules, now]);

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in duration-700 overflow-x-hidden max-w-[1600px] mx-auto px-4 sm:px-6">
      {/* Hero Section - Compacta e Impactante */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-3xl group border border-white/5"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent z-10" />
        
        <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">
              <Zap size={10} /> {t('dashboard.welcomeBack')}
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-black uppercase leading-none tracking-tighter mb-2">
              {t('dashboard.oss')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">{profile.name.split(' ')[0]}!</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-2 opacity-80">
              <Shield size={14} className="text-blue-500" />
              {profile.academyName || 'SYSBJJ 2.0'} • {t('dashboard.evolutionReady')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/classes')}
              className="px-6 py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              {t('dashboard.startClass')} <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/students')}
              className="px-6 py-4 bg-slate-800/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-slate-800 transition-all active:scale-95"
            >
              {t('dashboard.manageStudents')}
            </button>
          </div>
        </div>
      </motion.div>

      {currentClass && (
        <div className="bg-blue-600 dark:bg-blue-600 p-4 rounded-2xl flex items-center justify-between group shadow-lg animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{t('dashboard.classInProgress')}</p>
              <h3 className="text-sm font-black uppercase leading-none">{currentClass.title}</h3>
            </div>
          </div>
          <button 
            onClick={() => navigate('/classes')}
            className="px-4 py-2 bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-50 transition-colors"
          >
            {t('common.details')}
          </button>
        </div>
      )}

      {/* Quick Action Navigation Bar - Alta Visibilidade */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/attendance')}
          className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-[1.25rem] flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-inner">
            <QrCode size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common.operation')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('common.attendance')}</span>
          </div>
        </button>

        <button 
          onClick={() => navigate('/exhibition')}
          className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-[1.25rem] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
            <Monitor size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common.display')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('common.exhibitionMode')}</span>
          </div>
        </button>

        <button 
          onClick={() => navigate('/timer')}
          className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-[1.25rem] flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform shadow-inner">
            <Timer size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('dashboard.training')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('common.timer')}</span>
          </div>
        </button>

        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-[1.25rem] flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform shadow-inner">
            <Settings size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common.settings')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('settings.title')}</span>
          </div>
        </button>
      </div>

      {/* Integridade & Segurança Blockchain - Estética Profissional */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-wrap items-center justify-between gap-6 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-[0.02]" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10 w-full lg:w-auto">
          <div className="flex -space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-[10px] font-black text-white ring-4 ring-white dark:ring-slate-900 shadow-2xl rotate-3 hover:translate-y-[-4px] transition-all cursor-default">DB</div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-[10px] font-black text-white ring-4 ring-white dark:ring-slate-900 shadow-2xl -rotate-3 hover:translate-y-[-4px] transition-all cursor-default">BC</div>
          </div>
          
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] leading-none">
              {t('dashboard.status.ecosystem')}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {t('dashboard.status.cloudActive')}
              </span>
              <span className="flex items-center gap-2 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                <Shield size={14} className="animate-bounce" style={{ animationDuration: '3s' }} />
                {t('dashboard.status.blockchainOk')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner flex items-center gap-4 flex-1 md:flex-none">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('dashboard.status.lastSync')}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <Clock size={12} className="text-blue-500" />
              </div>
            </div>
            <div className="w-1 h-8 bg-blue-600/20 rounded-full overflow-hidden">
              <div className="w-full h-1/2 bg-blue-600 animate-[bounce_2s_infinite]" />
            </div>
          </div>
          
          <button 
            onClick={() => {
              // Re-run animation/refresh effect
              const btn = document.getElementById('sync-trigger');
              if (btn) btn.classList.add('animate-spin');
              setTimeout(() => { if (btn) btn.classList.remove('animate-spin'); }, 1000);
            }}
            className="p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all group/sync"
          >
            <RefreshCw id="sync-trigger" size={18} className="group-hover/sync:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </motion.div>

      {/* Stats Quick Grid - Consolidada */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title={t('dashboard.stats.total')} value={totalStudents} icon={<Users size={20} />} color="bg-blue-600" trend={t('dashboard.stats.registrations')} trendUp={true} delay={0.1} />
        <StatCard title={t('dashboard.stats.active')} value={activeStudents} icon={<CheckCircle2 size={20} />} color="bg-cyan-600" trend={t('dashboard.stats.frequent')} trendUp={true} delay={0.2} />
        <StatCard title={t('students.isCompetitor')} value={competitorsCount} icon={<TrophyIcon size={20} />} color="bg-yellow-500" trend={t('common.athletes')} trendUp={true} delay={0.3} />
        <StatCard title={t('dashboard.stats.revenue')} value={`${t('common.currencySymbol')} ${monthlyRevenue}`} icon={<TrendingUp size={20} />} color="bg-orange-600" trend={t('dashboard.stats.month')} trendUp={true} delay={0.4} />
        <StatCard title={t('dashboard.stats.extra')} value={`${t('common.currencySymbol')} ${monthlyExtra}`} icon={<Store size={20} />} color="bg-emerald-600" trend={t('dashboard.stats.services')} trendUp={true} delay={0.5} />
        <StatCard title={t('dashboard.stats.pending')} value={pendingPaymentsCount} icon={<AlertCircle size={20} />} color="bg-red-600" trend={t('dashboard.stats.billing')} trendUp={false} delay={0.6} />
      </div>

      {/* Instagram Premium Destaque - Redesigned for High Impact */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group h-full"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
        <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-10 border border-white/5 shadow-3xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-[100px] -mr-64 -mt-64 group-hover:scale-110 transition-transform duration-[2000ms]" />
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-3xl rotate-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 ring-4 ring-white/10 shrink-0">
              <Instagram size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-[9px] font-black text-pink-500 uppercase tracking-[0.3em]">Comunidade VIP</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-display font-black text-white uppercase tracking-tighter leading-none mb-3">Siga o <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">Império SYSBJJ</span> no Instagram</h3>
              <p className="text-slate-400 text-sm font-medium opacity-80 max-w-lg">Ocupe seu lugar na elite mundial. Acompanhe seminários, atualizações do sistema e conecte-se com mestres em todo o globo.</p>
            </div>
          </div>

          <a 
            href="https://instagram.com/sistemabjj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative z-10 px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-100 active:scale-95 transition-all shadow-2xl shadow-white/10 flex items-center gap-4 group/btn shrink-0"
          >
            @sistemabjj 
            <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: QTD & Schedule */}
        <div className="lg:col-span-8 space-y-8">
          {/* QTD Card */}
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-[0.03]" />
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2 overflow-hidden">
                  <BookOpen size={28} className="text-blue-600 shrink-0" /> 
                  <span className="truncate">{t('curriculum.title')}</span>
                </h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-9">{t('curriculum.subtitle')}</p>
              </div>
              <button 
                onClick={() => navigate('/curriculum')} 
                className="group flex items-center gap-3 text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
              >
                {t('curriculum.plannerTab')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => navigate('/curriculum')}
                className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 relative group cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm"
              >
                <div className="flex items-center gap-5 mb-6">
                   <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-6 transition-transform">
                      <Zap size={28} />
                   </div>
                   <div>
                      <p className="font-black text-xl dark:text-white uppercase tracking-tight leading-none mb-1.5">{t('curriculum.techFocus')}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]">
                        {latestPlan ? latestPlan.title : t('curriculum.noActivePlan')}
                      </p>
                   </div>
                </div>
                <div className="space-y-3">
                  {latestPlan ? (
                    <>
                      {latestPlan.techniques.slice(0, 3).map(tech => (
                        <div key={tech.id} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">{tech.name}</span>
                        </div>
                      ))}
                      {latestPlan.ruleFocus && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-0.5">{t('ibjjfRules.ruleFocus')}</p>
                          <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{latestPlan.ruleFocus}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">{t('curriculum.noActivePlanDesc')}</p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white relative flex flex-col justify-between group cursor-pointer overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 rounded-full blur-[50px] opacity-20" />
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">{t('dashboard.revenueGoal')}</p>
                  <div className="flex items-end justify-between mb-3">
                    <h4 className="text-2xl font-black tracking-tighter">{t('common.currencySymbol')} {monthlyRevenue}</h4>
                    <span className="text-[10px] font-bold text-slate-400">{t('dashboard.goal')}: {t('common.currencySymbol')} {revenueGoal}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000 ease-out"
                      style={{ width: `${revenueProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{revenueProgress.toFixed(1)}% {t('dashboard.reached')}</p>
                </div>
                <button 
                  onClick={() => navigate('/business')}
                  className="relative z-10 mt-4 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  {t('dashboard.viewDetails')} <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Section - Mais Compacta e Sofisticada */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 px-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('dashboard.schedule')}</h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.dailySchedule')}</p>
              </div>
              <button onClick={() => navigate('/classes')} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                <Calendar size={16} />
              </button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {schedules.length > 0 ? schedules.map((cls, i) => (
                <div key={i} className="p-6 px-8 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800 group-hover:scale-105 transition-transform">
                      <span className="text-blue-600 dark:text-blue-400 font-black text-xs uppercase">{cls.time}</span>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase leading-none mb-2">{cls.title}</p>
                      <div className="flex items-center gap-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={12} className="text-blue-500" /> {cls.instructor || t('common.instructor')}
                        </p>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Users size={12} className="text-cyan-500" /> {cls.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/attendance'); }} 
                    className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg"
                  >
                    {t('common.attendance')}
                  </button>
                </div>
              )) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Calendar size={24} />
                  </div>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">{t('dashboard.noClassesToday')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Operações & Atividades */}
        <div className="lg:col-span-4 space-y-6">
          {isMasterAdmin && (
            <button 
              onClick={() => navigate('/audit')}
              className="w-full p-6 bg-slate-950 dark:bg-blue-600 rounded-3xl border border-white/5 shadow-2xl hover:-translate-y-1 transition-all group flex items-center gap-5"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md shadow-inner group-hover:rotate-12 transition-transform">
                <Shield size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">{t('audit.masterAccess')}</p>
                <p className="text-base font-black text-white uppercase tracking-tight leading-none">{t('audit.securityAuditor')}</p>
              </div>
              <ArrowRight size={20} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          )}

          {/* Unified Activity Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="p-5 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <History size={18} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-widest dark:text-white">{t('dashboard.recentFlow')}</h3>
             </div>
             <div className="divide-y divide-slate-50 dark:divide-slate-800/50 max-h-[300px] overflow-y-auto scrollbar-hide">
               {payments.length > 0 ? payments.slice(-5).reverse().map((act, i) => (
                 <div key={i} className="p-4 px-6 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black dark:text-white uppercase truncate">{act.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{t('common.currencySymbol')} {act.amount}</p>
                    </div>
                 </div>
               )) : (
                 <div className="p-8 text-center opacity-30 text-[9px] font-black uppercase tracking-widest">{t('dashboard.noRecentFlow')}</div>
               )}
             </div>
             <button onClick={() => navigate('/business')} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors border-t border-slate-100 dark:border-slate-800">
               {t('dashboard.financialBtn')}
             </button>
          </div>

          {/* Birthdays Card - Compacto */}
          <div className="bg-amber-500 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[80px] opacity-20 pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <Cake size={18} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">{t('dashboard.celebrations')}</h3>
            </div>
            <div className="space-y-2">
              {upcomingBirthdays.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-xs">
                      {new Date(s.birthDate).getDate()}
                    </div>
                    <p className="text-[10px] font-black uppercase truncate max-w-[100px]">{s.name}</p>
                  </div>
                  <ArrowRight size={12} className="opacity-50" />
                </div>
              ))}
              {upcomingBirthdays.length === 0 && (
                <p className="text-[9px] font-bold opacity-70 text-center py-2 italic">{t('reports.noBirthdays')}</p>
              )}
            </div>
            <button onClick={() => navigate('/reports')} className="w-full mt-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
              {t('dashboard.viewCalendar')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
