
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, TrendingUp, AlertCircle, Calendar, CreditCard,
  Timer, UserPlus, CheckCircle2, Trophy as TrophyIcon, Plus,
  ArrowUpRight, ArrowDownRight, BarChart3, ArrowRight, Baby,
  Edit2, X, Trash2, Clock, BookOpen, QrCode, Scan, Zap, Cake, Store, Activity, History, Shield, Instagram, ChevronRight, Monitor, RefreshCw, Settings, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { StudentStatus, BeltColor } from '../types';
import { MASTER_ADMINS, IBJJF_BELT_RULES } from '../constants';

const StatCard = ({ title, value, icon, color, trend, trendUp, delay = 0, suffix = '' }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-elite hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden h-full flex flex-col justify-between"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700" />
    <div className="flex items-center justify-between mb-8 relative z-10">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-slate-900 dark:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-'), size: 24 })}
      </div>
      <div className={`flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${trendUp ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
        {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {trend}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mb-2 leading-none">{title}</h3>
      <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter truncate">
        {value}<span className="text-lg ml-1 opacity-30 italic">{suffix}</span>
      </p>
    </div>
  </motion.div>
);

const BentoBox = ({ children, className = '', title = '', subtitle = '', icon: Icon, action, actionIcon: ActionIcon, actionText }: any) => (
  <div className={`bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative group transition-all duration-700 hover:shadow-elite hover:border-blue-500/10 ${className}`}>
    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000" />
    <div className="p-8 sm:p-10 relative z-10 flex flex-col h-full">
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="space-y-1.5">
            {title && (
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 italic">
                {Icon && <Icon size={24} className="text-blue-600" />} {title}
              </h3>
            )}
            {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none opacity-60 ml-9">{subtitle}</p>}
          </div>
          {action && (
            <button onClick={action} className="flex items-center gap-3 text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-widest bg-slate-900 dark:bg-white px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl group/btn">
              {actionText} {ActionIcon && <ActionIcon size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
            </button>
          )}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

const MasterDojoClock: React.FC = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left relative z-10">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-600/20">
          <Clock size={14} className="animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">{t('dashboard.masterClock')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg border border-white/10 dark:border-slate-900/10 transition-all hover:scale-105 active:scale-95 cursor-pointer group">
          <ShieldCheck size={14} className="text-blue-500" />
          <span className="text-[9px] font-black uppercase tracking-widest">Integridade Blindada Blockchain</span>
          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>
      <h2 className="text-6xl sm:text-9xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none group-hover:scale-[1.02] transition-transform duration-700">
        {now.toLocaleTimeString(t('common.dateLocale'), { hour: '2-digit', minute: '2-digit' })}
        <span className="text-3xl sm:text-4xl text-blue-600 ml-2 animate-pulse font-black opacity-80">{now.toLocaleTimeString(t('common.dateLocale'), { second: '2-digit' })}</span>
      </h2>
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest mt-4">
        {now.toLocaleDateString(t('common.dateLocale'), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
      </p>
    </div>
  );
};

const GlobalSearch: React.FC<{ 
  onSearch: (term: string) => void, 
  results: any[],
  onSelect: (item: any) => void 
}> = ({ onSearch, results, onSelect }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 z-30">
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Scan size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={t('dashboard.searchPlaceholder')}
          className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all shadow-xl dark:text-white"
        />
        <div className="absolute inset-y-0 right-5 flex items-center">
           <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">⌘ K</span>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-3xl max-h-[400px] overflow-y-auto scrollbar-hide z-50 p-4 space-y-2"
        >
          {results.map((item, i) => (
            <button 
              key={i}
              onClick={() => {
                onSelect(item);
                setQuery('');
                setIsOpen(false);
              }}
              className="w-full p-4 flex items-center justify-between rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {item.type === 'student' ? <Users size={18} /> : <Zap size={18} />}
                </div>
                <div>
                  <p className="text-xs font-black dark:text-white uppercase leading-none mb-1">{item.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.subtitle}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { t, tObj } = useTranslation();
  const { profile } = useProfile();
  const { students, payments, schedules, extraRevenue, lessonPlans } = useData();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState(() => {
    const saved = localStorage.getItem('oss_dashboard_layout');
    return saved ? JSON.parse(saved) : {
      showStats: true,
      showSearch: true,
      showSchedules: true,
      showPerformance: true,
      showLeaderboard: true,
      showBirthdays: true,
      showAnalytics: true
    };
  });

  useEffect(() => {
    localStorage.setItem('oss_dashboard_layout', JSON.stringify(layoutConfig));
  }, [layoutConfig]);

  const followEmpirePhrases = useMemo(() => tObj('dashboard.followEmpire') || [], [tObj]);
  const elitePlacePhrases = useMemo(() => tObj('dashboard.elitePlace') || [], [tObj]);

  const handleSearch = (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const termLower = term.toLowerCase();
    const matches: any[] = [];

    // Search Students
    students.forEach(s => {
      if (s.name.toLowerCase().includes(termLower) || (s.nickname && s.nickname.toLowerCase().includes(termLower))) {
        matches.push({
          type: 'student',
          id: s.id,
          name: s.name,
          subtitle: `${t(`belts.${s.belt}`)} • ${s.status}`,
          nav: `/students`
        });
      }
    });

    // Search Plans
    lessonPlans.forEach(p => {
      if (p.title.toLowerCase().includes(termLower)) {
        matches.push({
          type: 'plan',
          id: p.id,
          name: p.title,
          subtitle: `${p.date}`,
          nav: `/curriculum`
        });
      }
    });

    setSearchResults(matches.slice(0, 8));
  };

  const birthdaysToday = useMemo(() => {
    const todayStr = now.toISOString().substring(5, 10); // MM-DD
    return students.filter(s => s.birthDate && s.birthDate.substring(5, 10) === todayStr);
  }, [students, now]);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % (followEmpirePhrases.length || 1));
    }, 5000);

    // Refresh data-related time reference every hour
    const dataTimer = setInterval(() => setNow(new Date()), 3600000);

    return () => {
      clearInterval(phraseTimer);
      clearInterval(dataTimer);
    };
  }, [followEmpirePhrases.length]);

  const validStudents = students.filter(s => s.status !== StudentStatus.INACTIVE);
  const totalStudents = validStudents.length;
  const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE).length;
  
  const currentMonth = now.toISOString().substring(0, 7);
  const monthlyRevenue = payments
    .filter(p => (p.status === 'Confirmed' || p.status === 'completed') && p.date.startsWith(currentMonth))
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
      const promoDate = s.lastPromotionDate ? new Date(s.lastPromotionDate + 'T12:00:00') : new Date(s.birthDate || '2000-01-01');
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
      {/* Global Tactical Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <GlobalSearch 
            onSearch={handleSearch} 
            results={searchResults} 
            onSelect={(item) => navigate(item.nav)} 
          />
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className={`h-16 px-6 rounded-[2rem] border-2 transition-all flex items-center justify-center gap-3 ${showConfig ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 shadow-sm'}`}
        >
          <Settings size={20} className={showConfig ? 'animate-spin-slow' : ''} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
            {showConfig ? t('common.close') : t('common.customize')}
          </span>
        </button>
      </div>

      {showConfig && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-blue-600/20 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <Monitor size={20} className="text-blue-600" /> {t('dashboard.customizeLayout')}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(layoutConfig).map(([key, value]) => (
              <button 
                key={key}
                onClick={() => setLayoutConfig((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${value ? 'border-blue-600 bg-blue-600/5 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${value ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {value && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-center">{t(`dashboard.sections.${key.replace('show', '').toLowerCase()}`)}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Birthday Banner Ritual */}
      {layoutConfig.showBirthdays && birthdaysToday.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white rotate-6 group-hover:rotate-0 transition-transform">
                <Cake size={32} />
              </div>
              <div className="text-white">
                <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{t('dashboard.birthdaysToday')}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {birthdaysToday.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {s.nickname || s.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
              {t('dashboard.congratulate')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Master Dojo Clock Section */}
      {layoutConfig.showSchedules && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none" />
            <MasterDojoClock />
            
            <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto relative z-10">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('dashboard.dojoTemp')}</p>
                <p className="text-2xl font-black dark:text-white">24°C</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">{t('dashboard.statusLabel')}</p>
                <p className="text-2xl font-black dark:text-white uppercase italic">Oss!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/timer')}
            className="flex-1 bg-red-600 text-white rounded-[2.5rem] p-6 flex flex-col justify-between group overflow-hidden relative shadow-2xl hover:scale-[1.02] active:scale-95 transition-all border-4 border-red-500/50"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Timer size={32} className="mb-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{t('common.timer')}</h3>
            </div>
            <div className="relative z-10 flex items-center gap-2 mt-4">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{t('dashboard.roundSystem')}</span>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/exhibition')}
            className="flex-1 bg-slate-900 dark:bg-slate-800 text-white rounded-[2.5rem] p-6 flex flex-col justify-between group overflow-hidden relative shadow-xl hover:scale-[1.02] active:scale-95 transition-all border border-white/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Monitor size={32} className="mb-2 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{t('common.exhibitionMode')}</h3>
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-4">{t('dashboard.displayMode')}</p>
          </button>
        </div>
      </div>
      )}

      {/* Executive Header & Quick Actions */}
      {layoutConfig.showPerformance && (
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
                  <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{t('dashboard.activeStatus')}</p>
                </div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.timer')}</p>
                  <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{t('dashboard.standbyStatus')}</p>
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
      )}

      {/* Primary Stats Grid */}
      {layoutConfig.showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title={t('dashboard.stats.total')} value={totalStudents} icon={<Users />} color="bg-blue-600" trend={t('dashboard.stats.registrations')} trendUp delay={0.1} />
        <StatCard title={t('dashboard.stats.active')} value={activeStudents} icon={<CheckCircle2 />} color="bg-cyan-600" trend="+12.5%" trendUp delay={0.2} />
        <StatCard title={t('students.isCompetitor')} value={competitorsCount} icon={<TrophyIcon />} color="bg-yellow-500" trend={t('dashboard.stats.elite')} trendUp delay={0.3} />
        <StatCard title={t('dashboard.stats.revenue')} value={monthlyRevenue} icon={<TrendingUp />} color="bg-emerald-600" trend="+8.2%" trendUp delay={0.4} suffix={t('common.currencySymbol')} />
        <StatCard title={t('dashboard.stats.extra')} value={monthlyExtra} icon={<Store />} color="bg-indigo-600" trend={t('dashboard.stats.up')} trendUp delay={0.5} suffix={t('common.currencySymbol')} />
        <StatCard title={t('dashboard.stats.churnRisk')} value={churnRiskCount} icon={<ShieldAlert />} color="bg-orange-600" trend={churnRiskCount > 0 ? t('dashboard.stats.alert') : t('dashboard.stats.normal')} trendUp={false} delay={0.6} />
      </div>
      )}

      {/* Main Intelligent Bento Section */}
      {layoutConfig.showPerformance && (
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
      )}

      {/* Secondary Operational Row */}
      {layoutConfig.showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Tools replaced by Global Search/Shortcuts if needed, for now just cleaning */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
           <div className="h-full p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">{t('dashboard.stats.active')}</h4>
              <p className="text-4xl font-black dark:text-white uppercase italic tracking-tighter text-blue-600">{activeStudents} {t('dashboard.athletes')}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{t('dashboard.stats.registrations')}</p>
           </div>
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
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.status.cloudActive')}</p>
          </div>
        </div>
      </div>
      )}

      {/* Instagram Premium Impact Card */}
      {layoutConfig.showLeaderboard && (
        <>
          <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
         <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
               <Zap size={20} className="text-blue-500" /> {t('dashboard.masterInsights')}
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.pedagogy')}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{t('dashboard.insights.pedagogy')}</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t('dashboard.business')}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{t('dashboard.insights.business')}</p>
               </div>
            </div>
         </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 italic">{t('dashboard.turboAction')}</h3>
            <p className="text-xs text-indigo-100 opacity-80 mb-6 font-medium">{t('dashboard.retentionProtocolDesc', { count: churnRiskCount })}</p>
            <button onClick={() => navigate('/business')} className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">{t('dashboard.retentionProtocol')}</button>
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
                <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] italic transition-all duration-700">
                  {followEmpirePhrases[phraseIndex] || t('dashboard.followEmpire')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">SYSBJJ</span>
                </h3>
                <p className="text-slate-400 text-sm font-medium opacity-80 max-w-lg mx-auto md:mx-0 transition-opacity duration-700">
                  {elitePlacePhrases[phraseIndex] || t('dashboard.elitePlace')}
                </p>
              </div>
            </div>
            <div className="px-12 py-6 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 group/btn transition-transform group-hover:scale-105 active:scale-95 shrink-0">
              @sistemabjj <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
