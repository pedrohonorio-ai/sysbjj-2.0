
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, TrendingUp, AlertCircle, Calendar, CreditCard,
  Timer, UserPlus, CheckCircle2, Trophy as TrophyIcon, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, ArrowRight, Baby,
  Edit2, X, Trash2, Clock, BookOpen, QrCode, Scan, Zap, Cake, Store, Activity, History, Shield, Instagram, ChevronRight, Monitor, RefreshCw, Settings, ShieldAlert
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { StudentStatus, BeltColor } from '../types';
import { MASTER_ADMINS, IBJJF_BELT_RULES } from '../constants';

const StatCard = ({ title, value, icon, color, trend, trendUp, delay = 0, suffix = '' }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden h-full flex flex-col justify-between"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 rounded-full blur-[60px] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-2.5 rounded-[1rem] ${color} bg-opacity-10 text-slate-900 dark:text-white group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-'), size: 18 })}
      </div>
      <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${trendUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
        {trend}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1 leading-none">{title}</h3>
      <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter truncate">
        {value}<span className="text-sm ml-1 opacity-40">{suffix}</span>
      </p>
    </div>
  </motion.div>
);

const BentoBox = ({ children, className = '', title = '', subtitle = '', icon: Icon, action, actionIcon: ActionIcon, actionText }: any) => (
  <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group transition-all hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 ${className}`}>
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-[0.02]" />
    <div className="p-6 sm:p-8 relative z-10 flex flex-col h-full">
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                {Icon && <Icon size={20} className="text-blue-600" />} {title}
              </h3>
            )}
            {subtitle && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{subtitle}</p>}
          </div>
          {action && (
            <button onClick={action} className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              {actionText} {ActionIcon && <ActionIcon size={12} />}
            </button>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  </div>
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

  const churnRiskCount = useMemo(() => {
    return students.filter(s => {
      if (s.status === StudentStatus.INACTIVE) return false;
      const lastAttendance = s.lastAttendanceDate ? new Date(s.lastAttendanceDate) : new Date(s.joinedAt || '2000-01-01');
      const diffDays = Math.floor((now.getTime() - lastAttendance.getTime()) / (1000 * 3600 * 24));
      return diffDays > 20 || s.status === StudentStatus.OVERDUE;
    }).length;
  }, [students, now]);

  const candidatesCount = useMemo(() => {
    return students.filter(s => {
      if (s.status === StudentStatus.INACTIVE) return false;
      const promoDate = s.lastPromotionDate ? new Date(s.lastPromotionDate + 'T12:00:00') : new Date(s.birthDate);
      const monthsInBelt = Math.max(0, (now.getFullYear() - promoDate.getFullYear()) * 12 + (now.getMonth() - promoDate.getMonth()));
      const rule = (IBJJF_BELT_RULES as any)[s.belt as string];
      const minMonths = rule?.minTimeMonths ?? 0;
      const effectiveMinMonths = (s.belt === BeltColor.WHITE || s.isKid) ? 4 : minMonths;
      const attendanceThreshold = (s.belt === BeltColor.WHITE || s.isKid) ? 30 : 60;
      return monthsInBelt >= effectiveMinMonths && s.attendanceCount >= attendanceThreshold;
    }).length;
  }, [students, now]);

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
    <div className="space-y-8 pb-20 w-full animate-in fade-in duration-700 overflow-x-hidden max-w-[1600px] mx-auto px-4 sm:px-6">
      {/* Executive Header & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:col-span-8 relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-3xl group border border-white/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent z-10" />
          <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-[0.3em]">
                <Zap size={10} /> {t('dashboard.welcomeBack')}
              </div>
              <h2 className="text-4xl sm:text-6xl font-black uppercase leading-[0.85] tracking-tighter mb-2 italic">
                {t('dashboard.oss')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">{profile.name.split(' ')[0]}!</span>
              </h2>
              <p className="text-slate-400 text-xs font-medium flex items-center gap-2 opacity-80 uppercase tracking-widest">
                <Shield size={14} className="text-blue-500" />
                {profile.academyName || 'SYSBJJ 2.0'} • {t('dashboard.evolutionReady')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => navigate('/attendance')}
                className="px-8 py-5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <QrCode size={16} /> {t('common.attendance')}
              </button>
              <button 
                onClick={() => navigate('/classes')}
                className="px-8 py-5 bg-slate-800/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Calendar size={16} /> {t('dashboard.manageStudents')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Current Class Status Mini-Bento */}
        <BentoBox 
          className="xl:col-span-4" 
          title={t('dashboard.classInProgress')} 
          subtitle={t('dashboard.training')}
          icon={Activity}
          action={() => navigate('/classes')}
          actionText={t('common.details')}
          actionIcon={ArrowRight}
        >
          {currentClass ? (
            <div className="space-y-4 pt-2">
              <div className="bg-blue-600/10 border border-blue-600/20 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{currentClass.time}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{currentClass.title}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentClass.instructor}</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.attendance')}</p>
                  <p className="text-sm font-black dark:text-white">{t('dashboard.activeStatus')}</p>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.timer')}</p>
                  <p className="text-sm font-black dark:text-white">{t('dashboard.standbyStatus')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-6 text-center opacity-40">
              <History size={32} className="mb-2 text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">{t('dashboard.noClassesToday')}</p>
            </div>
          )}
        </BentoBox>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title={t('dashboard.stats.total')} value={totalStudents} icon={<Users />} color="bg-blue-600" trend={`${t('dashboard.stats.registrations')}`} trendUp delay={0.1} />
        <StatCard title={t('dashboard.stats.active')} value={activeStudents} icon={<CheckCircle2 />} color="bg-cyan-600" trend="+12.5%" trendUp delay={0.2} />
        <StatCard title={t('students.isCompetitor')} value={competitorsCount} icon={<TrophyIcon />} color="bg-yellow-500" trend="Elite" trendUp delay={0.3} />
        <StatCard title={t('dashboard.stats.revenue')} value={monthlyRevenue} icon={<TrendingUp />} color="bg-emerald-600" trend="+8.2%" trendUp delay={0.4} suffix={t('common.currencySymbol')} />
        <StatCard title={t('dashboard.stats.extra')} value={monthlyExtra} icon={<Store />} color="bg-indigo-600" trend="Up" trendUp delay={0.5} suffix={t('common.currencySymbol')} />
        <StatCard title="Risco Churn" value={churnRiskCount} icon={<ShieldAlert />} color="bg-orange-600" trend={churnRiskCount > 0 ? "ALERTA" : "NORMAL"} trendUp={false} delay={0.6} />
      </div>

      {/* Main Intelligent Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* QTD & Pedagogy Intelligence */}
        <BentoBox 
          className="lg:col-span-8" 
          title={t('curriculum.title')} 
          subtitle={t('curriculum.subtitle')}
          icon={BookOpen}
          action={() => navigate('/curriculum')}
          actionText={t('curriculum.plannerTab')}
          actionIcon={ArrowRight}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-2">
            <div className="md:col-span-3 space-y-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative group/tech cursor-pointer" onClick={() => navigate('/curriculum')}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover/tech:rotate-6 transition-transform">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none mb-1">{profile.technicalFocus || t('curriculum.techFocus')}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('curriculum.matStrategy')}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6 italic">
                  {profile.technicalFocusDescription || (latestPlan ? latestPlan.title : t('curriculum.noActivePlan'))}
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-600/10">{t('dashboard.baseEvolution')}</span>
                  <span className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest">{t('dashboard.masteryQ3')}</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex-1 p-5 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/50 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.upcomingGraduation')}</p>
                  <TrophyIcon size={14} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-black dark:text-white leading-none tracking-tighter mb-2">{candidatesCount} {t('dashboard.candidates')}</p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min((candidatesCount / (totalStudents || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
                <button onClick={() => navigate('/promotions', { state: { examMode: true } })} className="text-[9px] font-black text-blue-600 uppercase tracking-widest text-left mt-2">{t('dashboard.viewCandidates')} →</button>
              </div>
              <div className="flex-1 p-5 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-950 text-white flex flex-col justify-between">
                 <div className="flex items-center justify-between">
                   <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.financialIntelligence')}</p>
                   <TrendingUp size={14} className="text-emerald-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-black leading-none tracking-tighter mb-2">{(monthlyRevenue / revenueGoal * 100).toFixed(0)}% <span className="text-xs uppercase text-slate-400 tracking-widest ml-1">{t('dashboard.reached')}</span></p>
                   <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${revenueProgress}%` }} />
                   </div>
                 </div>
                 <button onClick={() => navigate('/business')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left mt-2 italic hover:text-white transition-colors">{t('dashboard.viewDetails')} →</button>
              </div>
            </div>
          </div>
        </BentoBox>

        {/* Real-time Activity Hub */}
        <BentoBox 
          className="lg:col-span-4" 
          title={t('dashboard.recentFlow')} 
          subtitle={t('dashboard.history')}
          icon={History}
          action={() => navigate('/business')}
          actionText={t('dashboard.viewDetails')}
        >
          <div className="space-y-3 mt-2 pr-1 max-h-[320px] overflow-y-auto scrollbar-hide">
            {payments.length > 0 ? payments.slice(-6).reverse().map((act, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all font-mono"
              >
                <div className={`w-10 h-10 rounded-xl ${act.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'} flex items-center justify-center shrink-0`}>
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black dark:text-white uppercase truncate tracking-tighter">{act.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{act.date} • {t('common.currencySymbol')} {act.amount}</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-300" />
              </motion.div>
            )) : (
              <div className="p-8 text-center opacity-30 text-[9px] font-black uppercase tracking-widest">{t('dashboard.noRecentFlow')}</div>
            )}
          </div>
        </BentoBox>
      </div>

      {/* Secondary Operational Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Tools */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
           <button onClick={() => navigate('/timer')} className="p-6 bg-rose-600 text-white rounded-[2rem] flex flex-col justify-between group overflow-hidden relative border border-rose-500 shadow-xl hover:-translate-y-1 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
             <Timer size={32} className="mb-4 group-hover:scale-110 transition-transform" />
             <div className="relative z-10 text-left">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{t('dashboard.training')}</span>
               <h4 className="text-xl font-black uppercase tracking-tighter leading-none">{t('common.timer')}</h4>
             </div>
           </button>
           <button onClick={() => navigate('/exhibition')} className="p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] flex flex-col justify-between group overflow-hidden relative shadow-xl hover:-translate-y-1 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/40 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
             <Monitor size={32} className="mb-4 group-hover:scale-110 transition-transform" />
             <div className="relative z-10 text-left">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{t('common.display')}</span>
               <h4 className="text-xl font-black uppercase tracking-tighter leading-none">{t('common.exhibitionMode')}</h4>
             </div>
           </button>
        </div>

        {/* Birthdays Bento */}
        <BentoBox className="lg:col-span-1" title={t('dashboard.celebrations')} icon={Cake} action={() => navigate('/reports')} actionText={t('common.viewAll')}>
          <div className="space-y-2 pt-2">
            {upcomingBirthdays.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                    {new Date(s.birthDate).getDate()}
                  </div>
                  <p className="text-[10px] font-black uppercase truncate max-w-[80px] dark:text-white">{s.name}</p>
                </div>
                <ArrowRight size={12} className="text-slate-300" />
              </div>
            ))}
            {upcomingBirthdays.length === 0 && (
              <p className="text-[9px] font-bold opacity-30 text-center py-4 italic uppercase tracking-widest">{t('reports.noBirthdays')}</p>
            )}
          </div>
        </BentoBox>

        {/* Sync & Health Bento */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="flex -space-x-3">
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-[8px] font-black text-white ring-4 ring-white dark:ring-slate-900 shadow-xl rotate-3">DB</div>
               <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-[8px] font-black text-white ring-4 ring-white dark:ring-slate-900 shadow-xl -rotate-3">BC</div>
             </div>
             <button id="sync-btn" onClick={() => {
                const btn = document.getElementById('sync-trigger-v2');
                btn?.classList.add('animate-spin');
                setTimeout(() => btn?.classList.remove('animate-spin'), 1000);
             }} className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
               <RefreshCw id="sync-trigger-v2" size={16} />
             </button>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('dashboard.status.ecosystem')}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.status.lastSync')} {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Instagram Premium Impact Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
         <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
               <Zap size={20} className="text-blue-500" /> Sensei Master Insights
            </h3>
            <div className="space-y-4">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Pedagogia</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Sua turma de Terça 19h está com 40% de novos alunos (faixa branca). Foque em fundamentos de guarda fechada para aumentar a retenção inicial.</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Negócios</p>
                  <p className="text-xs text-slate-400 leading-relaxed">Vendas de acessórios (faixas/patches) aumentaram 15%. Considere um kit de graduação exclusivo.</p>
               </div>
            </div>
         </div>

         <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Ação Turbo</h3>
            <p className="text-xs text-indigo-100 opacity-80 mb-6 font-medium">Detectamos {churnRiskCount} alunos com risco de churn. Clique abaixo para enviar uma mensagem automatizada de "Sentimos sua falta".</p>
            <button onClick={() => navigate('/business')} className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Protocolo de Retenção</button>
         </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group cursor-pointer lg:col-span-12"
        onClick={() => window.open('https://instagram.com/sistemabjj', '_blank')}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-[3rem] blur opacity-20 group-hover:opacity-60 transition duration-1000" />
        <div className="relative overflow-hidden bg-slate-950 rounded-[3rem] p-10 sm:p-14 border border-white/5 shadow-3xl text-center md:text-left">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-[120px] -mr-80 -mt-80 group-hover:scale-110 transition-transform duration-[3000ms]" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-3xl rotate-6 group-hover:rotate-12 transition-all duration-700 ring-4 ring-white/10 shrink-0">
                <Instagram size={48} />
              </div>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-[9px] font-black text-pink-500 uppercase tracking-[0.3em]">{t('dashboard.vipCommunity')}</span>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800" />
                    ))}
                    <div className="w-6 h-6 rounded-full border-2 border-slate-950 bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">+k</div>
                  </div>
                </div>
                <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] italic">{t('dashboard.followEmpire')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">SYSBJJ</span></h3>
                <p className="text-slate-400 text-sm font-medium opacity-80 max-w-lg mx-auto md:mx-0">{t('dashboard.elitePlace')}</p>
              </div>
            </div>
            <div className="px-12 py-6 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 group/btn transition-transform group-hover:scale-105 active:scale-95 shrink-0">
              @sistemabjj <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
