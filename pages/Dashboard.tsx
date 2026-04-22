
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, TrendingUp, AlertCircle, Calendar, CreditCard,
  Timer, UserPlus, CheckCircle2, Trophy as TrophyIcon, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, ArrowRight, Baby,
  Edit2, X, Trash2, Clock, BookOpen, QrCode, Scan, Zap, Cake, Store, Activity, History, Shield, Instagram, ChevronRight
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { StudentStatus } from '../types';

const StatCard = ({ title, value, icon, color, trend, trendUp, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-slate-900 dark:text-white group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-'), size: 20 })}
      </div>
      <div className={`flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${trendUp ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
        {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </div>
    </div>
    <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{title}</h3>
    <p className="text-3xl font-display font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
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
  const isMasterAdmin = ['dashfire@gmail.com', 'pedro.honorio@gm.rio'].includes(auth.email?.toLowerCase());

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
    <div className="space-y-8 pb-20 w-full animate-in fade-in duration-700 overflow-x-hidden max-w-[1600px] mx-auto px-1 sm:px-0">
      {/* Welcome Section / Hero */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative overflow-hidden bg-slate-900 dark:bg-blue-950 rounded-[3rem] p-8 sm:p-16 text-white shadow-3xl group border border-white/5"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-transparent z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-400/20 transition-all duration-1000" />
        
        <div className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-12 h-full min-h-[250px]">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 animate-pulse">
              <Zap size={10} /> {t('dashboard.welcomeBack')}
            </div>
            <h2 className="text-5xl sm:text-7xl font-display font-black uppercase leading-[0.85] tracking-tighter mb-4">
              {t('dashboard.oss')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">
                {profile.name.split(' ')[0]}!
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium max-w-lg leading-relaxed flex items-center gap-3">
              <Shield size={20} className="text-blue-500 shrink-0" />
              {profile.academyName || 'PPH BJJ ACADEMY'} • {t('dashboard.evolutionReady')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/classes')}
              className="px-8 py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3"
            >
              {t('dashboard.startClass')} <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/students')}
              className="px-8 py-4 bg-slate-800/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-slate-700 hover:border-white/20 transition-all active:scale-95"
            >
              {t('dashboard.manageStudents').toUpperCase()}
            </button>
          </div>
        </div>
      </motion.div>

      {currentClass && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-xl flex items-center justify-between group shadow-sm transition-all hover:shadow-md animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-[0.2em] mb-1">{t('dashboard.classInProgress')}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase leading-none">{currentClass.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">{currentClass.time} • Prof. {currentClass.instructor}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/classes')}
            className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {t('common.details')} <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => navigate('/exhibition')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
        >
          <Activity size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> {t('exhibition.title')}
        </button>
        <button 
          onClick={() => navigate('/attendance')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
        >
          <QrCode size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" /> {t('common.attendance')}
        </button>
      </div>

      {/* Instagram Update Banner */}
      <div className="bg-gradient-to-r from-pink-600/10 to-purple-600/10 border border-pink-500/20 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Instagram size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest">Siga para Atualizações</p>
            <p className="text-sm font-bold dark:text-white">Acompanhe novidades e sugira melhorias em <span className="text-pink-500">@sysbjj.26</span></p>
          </div>
        </div>
        <a 
          href="https://instagram.com/sysbjj.26" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
        >
          Seguir Agora
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <StatCard title={t('dashboard.stats.total')} value={totalStudents} icon={<Users size={24} />} color="bg-blue-600" trend={t('dashboard.stats.registrations')} trendUp={true} delay={0.1} />
        <StatCard title={t('dashboard.stats.active')} value={activeStudents} icon={<CheckCircle2 size={24} />} color="bg-cyan-600" trend={t('dashboard.stats.frequent')} trendUp={true} delay={0.2} />
        <StatCard title={t('students.isCompetitor')} value={competitorsCount} icon={<TrophyIcon size={24} />} color="bg-yellow-500" trend="Atletas" trendUp={true} delay={0.3} />
        <StatCard title={t('dashboard.stats.revenue')} value={`${t('common.currencySymbol')} ${monthlyRevenue}`} icon={<TrendingUp size={24} />} color="bg-orange-600" trend={t('dashboard.stats.month')} trendUp={true} delay={0.4} />
        <StatCard title={t('dashboard.stats.extra')} value={`${t('common.currencySymbol')} ${monthlyExtra}`} icon={<Store size={24} />} color="bg-emerald-600" trend={t('dashboard.stats.services')} trendUp={true} delay={0.5} />
        <StatCard title={t('dashboard.stats.pending')} value={pendingPaymentsCount} icon={<AlertCircle size={24} />} color="bg-red-600" trend={t('dashboard.stats.billing')} trendUp={false} delay={0.6} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: QTD & Schedule */}
        <div className="lg:col-span-8 space-y-8">
          {/* QTD Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-[0.03]" />
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  <BookOpen size={24} className="text-blue-600" /> {t('curriculum.title')}
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-8">{t('curriculum.subtitle')}</p>
              </div>
              <button 
                onClick={() => navigate('/curriculum')} 
                className="group flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
              >
                {t('curriculum.plannerTab')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => navigate('/curriculum')}
                className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 relative group cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
                      <Zap size={24} />
                   </div>
                   <div>
                      <p className="font-black text-lg dark:text-white uppercase tracking-tight leading-none mb-1">{t('curriculum.techFocus')}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[150px]">
                        {latestPlan ? latestPlan.title : t('curriculum.noActivePlan')}
                      </p>
                   </div>
                </div>
                <div className="space-y-2">
                  {latestPlan ? (
                    <>
                      {latestPlan.techniques.slice(0, 2).map(tech => (
                        <div key={tech.id} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-600 rounded-full" />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">{tech.name}</span>
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

          {/* Schedule Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('dashboard.schedule')}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.dailySchedule')}</p>
              </div>
              <button onClick={() => navigate('/classes')} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm">
                <Calendar size={18} />
              </button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {schedules.length > 0 ? schedules.map((cls, i) => (
                <div key={i} className="p-8 sm:p-10 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group cursor-pointer">
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[2rem] flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800 group-hover:scale-105 transition-transform">
                      <span className="text-blue-600 dark:text-blue-400 font-black text-sm sm:text-base uppercase">{cls.time}</span>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight uppercase leading-none mb-3">{cls.title}</p>
                      <div className="flex flex-wrap items-center gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-blue-500" /> {cls.instructor || t('common.instructor')}
                        </p>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Users size={14} className="text-cyan-500" /> {cls.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/attendance'); }} 
                    className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                  >
                    {t('common.attendance')}
                  </button>
                </div>
              )) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Calendar size={32} />
                  </div>
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">{t('dashboard.noClassesToday')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Celebrations & Flow */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/timer')}
              className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
                <Timer size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.training')}</p>
              <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('common.timer')}</p>
            </button>
            <button 
              onClick={() => navigate('/assistant')}
              className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.ia')}</p>
              <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('common.assistant')}</p>
            </button>

            {isMasterAdmin && (
              <button 
                onClick={() => navigate('/audit')}
                className="p-6 bg-slate-900 dark:bg-blue-600 rounded-[2rem] border border-slate-800 dark:border-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Master Admin</p>
                <p className="font-black text-white uppercase tracking-tight">Auditoria</p>
              </button>
            )}
          </div>

          {/* Celebrations */}
          <div className="bg-amber-500 rounded-[2.5rem] sm:rounded-[3.5rem] text-slate-900 p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col border border-amber-400/20 group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[100px] opacity-20" />
              <div className="flex items-center justify-between mb-8 relative">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">{t('dashboard.celebrations')}</h3>
                  <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">{t('dashboard.monthBirthdays')}</p>
                </div>
                <Cake className="text-slate-800 group-hover:animate-bounce" size={24} />
              </div>
             <div className="space-y-3 flex-1 relative max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
               {upcomingBirthdays.length > 0 ? upcomingBirthdays.map((s, i) => {
                 const bDay = new Date(s.birthDate).getDate();
                 const isToday = bDay === now.getDate();
                 return (
                   <div key={i} className={`flex items-center justify-between p-5 rounded-2xl ${isToday ? 'bg-white shadow-xl scale-[1.02]' : 'bg-white/20'} transition-all`}>
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isToday ? 'bg-amber-500 text-white' : 'bg-white/30 text-slate-800'}`}>
                         {bDay}
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{s.name}</p>
                         {isToday && <p className="text-[8px] font-black text-amber-600 uppercase">{t('dashboard.congrats')}</p>}
                       </div>
                     </div>
                     <ArrowRight size={16} className="text-slate-800 opacity-30" />
                   </div>
                 );
               }) : (
                 <div className="py-12 text-center opacity-50 space-y-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <Cake size={24} className="text-slate-800" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('reports.noBirthdays')}</p>
                 </div>
               )}
             </div>
             <button onClick={() => navigate('/reports')} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-slate-800">
               {t('dashboard.viewCalendar')}
             </button>
          </div>

          {/* Recent Flow */}
          <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] text-white p-10 shadow-2xl relative overflow-hidden flex flex-col border border-white/5 group">
            <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600 rounded-full blur-[100px] opacity-10 pointer-events-none" />
            <div className="flex items-center justify-between mb-10 relative">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('dashboard.recentFlow')}</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('dashboard.recentTransactions')}</p>
              </div>
              <BarChart3 size={24} className="text-blue-500" />
            </div>
            <div className="space-y-8 flex-1 relative">
               {payments.length > 0 ? payments.slice(-4).reverse().map((act, i) => (
                 <div key={i} className="flex gap-6 relative group/item">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center shrink-0 z-10 group-hover/item:scale-110 transition-transform">
                     <CheckCircle2 className="text-green-400" size={20}/>
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('dashboard.paymentConfirmed')}</p>
                     <p className="text-sm font-black tracking-tight uppercase leading-none mb-1 truncate">{act.name}</p>
                     <p className="text-[10px] text-blue-400 font-bold">{t('common.currencySymbol')} {act.amount}</p>
                   </div>
                 </div>
               )) : (
                 <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">
                   {t('dashboard.noRecentFlow')}
                 </div>
               )}
            </div>
            <button onClick={() => navigate('/business')} className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 transition-all border border-white/5 flex items-center justify-center gap-3 group">
              {t('dashboard.financialBtn')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
