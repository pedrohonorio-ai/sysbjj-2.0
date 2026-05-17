import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu, X, Bell, Sun, Moon, Search, Shield, LogOut, Clock, CheckCircle2, Instagram, ChevronRight, ShieldCheck, Lock, ArrowUpRight, CalendarCheck, Timer, Monitor, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NAVIGATION_ITEMS, BELT_COLORS, MASTER_ADMINS } from './constants';

const Dashboard = lazy(() => import('./pages/Dashboard.js'));
const Students = lazy(() => import('./pages/Students.js'));
const IBJJFRules = lazy(() => import('./pages/IBJJFRules.js'));
const BusinessHub = lazy(() => import('./pages/BusinessHub.js'));
const AttendancePage = lazy(() => import('./pages/Attendance.js'));
const AttendanceHistory = lazy(() => import('./pages/AttendanceHistory.js'));
const BeltSystem = lazy(() => import('./pages/BeltSystem.js'));
const Finances = lazy(() => import('./pages/Finances.js'));
const FightTimer = lazy(() => import('./pages/FightTimer.js'));
const Settings = lazy(() => import('./pages/Settings.js'));
const StudentPortal = lazy(() => import('./pages/StudentPortal.js'));
const CurriculumHub = lazy(() => import('./pages/CurriculumHub.js'));
const PerformanceAnalytics = lazy(() => import('./pages/PerformanceAnalytics.js'));
const ExhibitionMode = lazy(() => import('./pages/ExhibitionMode.js'));
const SystemAudit = lazy(() => import('./pages/SystemAudit.js'));
const LanguageSelection = lazy(() => import('./pages/LanguageSelection.js'));
const Login = lazy(() => import('./pages/Login.js'));

import NotificationCenter from './components/NotificationCenter.js';
import DatabaseWarning from './components/DatabaseWarning.js';
import { useTranslation } from './contexts/LanguageContext.js';
import { useTheme } from './contexts/ThemeContext.js';
import { useProfile } from './contexts/ProfileContext.js';
import { useData } from './contexts/DataContext.js';
import { useAuth } from './context/AuthContext.js';
import { api } from './services/api.js';

const Sidebar = ({ isOpen, toggle, onLogout, isMasterAdmin }: { isOpen: boolean, toggle: () => void, onLogout: () => void, isMasterAdmin: boolean }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { profile } = useProfile();

  if (location.pathname.startsWith('/portal/')) return null;

  const filteredItems = NAVIGATION_ITEMS.filter(item => {
    if (['audit', 'settings'].includes(item.id)) return isMasterAdmin;
    return true;
  });

  const coreItems = filteredItems.filter(item => ['dashboard', 'students', 'teaching-hub', 'performance', 'business', 'attendance', 'finances', 'timer'].includes(item.id));
  const footerItems = filteredItems.filter(item => ['promotions', 'ibjjf-rules', 'history'].includes(item.id));
  const masterItems = filteredItems.filter(item => ['audit', 'settings'].includes(item.id));

  const renderNavItem = (item: any) => {
    const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
    return (
      <Link
        key={item.id}
        to={`/${item.id}`}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
        onClick={() => { if(window.innerWidth < 1024) toggle(); }}
      >
        <div className={`shrink-0 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3 opacity-70'}`}>{item.icon}</div>
        <span className={`font-black tracking-[0.15em] uppercase text-[9px] truncate transition-all duration-700 flex-1 min-w-0 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          {t(`common.${item.id}`)}
        </span>
        {isActive && (
          <motion.div 
            layoutId="active-indicator"
            className="absolute left-0 w-1 h-5 bg-blue-500 dark:bg-blue-600 rounded-full ml-0.5"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        {!isOpen && (
          <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap lg:block hidden border border-slate-800 dark:border-slate-700">
            {t(`common.${item.id}`)}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggle}
      />
      
      <aside className={`fixed inset-y-0 left-0 z-[60] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transform transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col overflow-y-auto scrollbar-hide
        ${isOpen ? 'translate-x-0 w-72 shadow-3xl shadow-blue-500/10' : '-translate-x-full shadow-none'}`}>
        
        <div className={`flex-none flex items-center justify-between p-6 h-24 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800/50`}>
          <div className="flex items-center gap-4">
            {profile.logoUrl ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10 shrink-0 group">
                <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-slate-950 dark:bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-2xl shadow-blue-500/20 shrink-0 group">
                <span className="group-hover:scale-110 transition-transform duration-500">
                  {profile.academyName?.[0] || 'S'}
                </span>
              </div>
            )}
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden transition-all duration-700"
              >
                <h1 className="font-display font-black leading-none tracking-tight text-slate-900 dark:text-white uppercase text-base whitespace-nowrap">{(profile.academyName || 'SYSBJJ 2.0').toUpperCase()}</h1>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] font-black mt-1">Academy Suite</p>
              </motion.div>
            )}
          </div>
          <button onClick={toggle} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-3 space-y-8 scrollbar-hide pb-10">
          <div className={!isOpen ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <div className="mb-3 px-4 flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">{t('common.training')}</span>
               <div className="h-px bg-slate-100 dark:bg-slate-800/50 flex-1" />
            </div>
            <div className="space-y-1">
              {coreItems.map(renderNavItem)}
            </div>
          </div>

          <div className={!isOpen ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <div className="mb-3 px-4 flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">{t('common.tools')}</span>
               <div className="h-px bg-slate-100 dark:bg-slate-800/50 flex-1" />
            </div>
            <div className="space-y-1">
               {footerItems.map(renderNavItem)}
            </div>
          </div>

          {isMasterAdmin && (
            <div className={!isOpen ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
              <div className="mb-3 px-4 flex items-center gap-3">
                 <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] whitespace-nowrap">Governança Master</span>
                 <div className="h-px bg-rose-500/20 flex-1" />
              </div>
              <div className="space-y-1">
                {masterItems.map(renderNavItem)}
              </div>
            </div>
          )}
        </nav>
        
        <div className="flex-none p-3 mt-8 mb-24 lg:mb-6 space-y-2 overflow-hidden shrink-0 border-t border-slate-100 dark:border-slate-800/50 pt-6">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all uppercase font-black text-[10px] tracking-widest"
          >
            <LogOut size={18} className="shrink-0 group-hover:rotate-12 transition-transform" /> 
            <span className={`transition-all duration-500 flex-1 truncate min-w-0 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              {t('common.logout')}
            </span>
          </button>
        </div>
        
        <div className={`mt-auto p-6 border-t border-slate-100 dark:border-white/5 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-4 bg-slate-950 rounded-[1.5rem] relative overflow-hidden group/status shadow-2xl">
            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/status:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-tighter italic">{t('common.shieldedIntegrity')}</p>
            </div>
            <div className="mt-3 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                <ShieldCheck size={10} className="text-blue-500" />
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Antigravity 2.0</span>
              </div>
              <Lock size={12} className="text-slate-700 group-hover/status:text-blue-600 transition-colors" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest transition-opacity duration-300">© 2026 SYBJJ BY CT Pedro Honorio</p>
              <a href="https://instagram.com/sistemabjj" target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest italic flex items-center gap-1">
                <Instagram size={8} /> @SISTEMABJJ
              </a>
            </div>
            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter opacity-60">Criado e Produzido por PPH e CT PH de JIU-JITSU</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[6px] font-black text-blue-600/50 uppercase tracking-widest leading-none">Security_Node_Active</span>
              <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest opacity-40">Automatic_Sync: Enabled</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const BottomNav = ({ onLogout, isMasterAdmin }: { onLogout: () => void, isMasterAdmin: boolean }) => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const bottomItems = [
    { id: 'dashboard', icon: <Monitor size={20} />, label: t('common.dashboard') },
    { id: 'attendance', icon: <CalendarCheck size={20} />, label: t('common.attendance') },
    { id: 'timer', icon: <Timer size={20} />, label: t('common.timer') },
    { id: 'business', icon: <Activity size={20} />, label: t('common.business') },
    { id: 'students', icon: <Users size={20} />, label: t('common.students') }
  ];

  if (location.pathname.startsWith('/portal/')) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 lg:hidden pointer-events-none">
      <div className="max-w-lg mx-auto bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-around shadow-2xl pointer-events-auto ring-1 ring-white/20">
        {bottomItems.map((item) => {
          const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`relative p-4 rounded-full transition-all duration-500 ${isActive ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {item.icon}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Header = ({ toggleSidebar, auth, onLogout }: { toggleSidebar: () => void, auth: { role: 'admin' | 'student' | null, email?: string }, onLogout: () => void }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await response.json();
          if (data.current_weather) setTemperature(Math.round(data.current_weather.temperature));
        }, async () => {
          const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current_weather=true');
          const data = await response.json();
          if (data.current_weather) setTemperature(Math.round(data.current_weather.temperature));
        });
      } catch (e) {}
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(weatherInterval);
  }, []);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isPortal = location.pathname.startsWith('/portal/');

  if (isPortal) return (
    <header className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50 w-full transition-all duration-500">
      <div className="flex items-center gap-3">
        {profile.logoUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xl shrink-0">
            <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">
            {profile.academyName?.[0] || 'S'}
          </div>
        )}
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{profile.academyName || 'SYSBJJ 2.0'}</h2>
          <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">{t('portal.studentPortal')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex flex-col items-end mr-2">
           <p className="text-[10px] font-black text-white tabular-nums leading-none">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </p>
           <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">
             {currentTime.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
           </p>
        </div>
        {temperature !== null && (
          <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full border border-white/10 mr-2">
             <Activity size={10} className="text-blue-500" />
             <span className="text-[9px] font-black text-white">{temperature}°C</span>
          </div>
        )}
        <button 
          onClick={handleThemeToggle}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={() => {
            if (auth.role === 'admin') {
              navigate('/dashboard');
            } else {
              onLogout();
            }
          }}
          className="p-2 text-white/60 hover:text-white transition-colors flex items-center gap-2"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
            {auth.role === 'admin' ? t('common.back') : t('common.logout')}
          </span>
        </button>
      </div>
    </header>
  );
  
  return (
    <header className="h-16 sm:h-24 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-12 sticky top-0 z-40 w-full transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        <button onClick={toggleSidebar} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl active:scale-95 transition-all shadow-sm hover:shadow-md">
          <Menu size={20} />
        </button>
        
        <div className="hidden xl:flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{profile.academyName}</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronização Master Ativa</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-4 px-3 sm:px-6 border-r border-slate-200 dark:border-white/5 mr-2 text-right">
           <div>
             <p className="text-[10px] sm:text-sm font-black text-slate-900 dark:text-white leading-none tabular-nums">
               {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </p>
             <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
               {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
           </div>
           {temperature !== null && (
             <div className="hidden xs:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-white/5">
                <div className="text-sm sm:text-lg font-black italic text-blue-600 dark:text-blue-400 leading-none">{temperature}°C</div>
             </div>
           )}
        </div>
        <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search size={14} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-[0.25em] w-32 xl:w-64 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
          />
        </div>

        <NotificationCenter />
        
        <button 
          onClick={handleThemeToggle}
          className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { logAction } = useData();
  const { user, role, studentCode, loading, logout } = useAuth();
  
  // Track Online Status
  const { dbStatus } = useData();



  useEffect(() => {
    if (role === 'admin' && user?.email && user?.id && !dbStatus.isDemoMode) {
      const deviceId = localStorage.getItem('oss_device_id') || Math.random().toString(36).substring(2, 15);
      if (!localStorage.getItem('oss_device_id')) localStorage.setItem('oss_device_id', deviceId);

      const updatePresence = async () => {
        try {
          const ua = navigator.userAgent;
          let device = "Desktop";
          if (/Android/i.test(ua)) device = "Android";
          else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
          
          let browser = "Browser";
          if (/Chrome/i.test(ua)) browser = "Chrome";
          else if (/Safari/i.test(ua)) browser = "Safari";
          else if (/Firefox/i.test(ua)) browser = "Firefox";
          else if (/Edge/i.test(ua)) browser = "Edge";
          
          const deviceInfo = `${device} (${browser})`;
          await api.saveData('presence', user.id, {
            email: user.email,
            lastSeen: Date.now(),
            role: role,
            userAgent: deviceInfo,
            deviceId: deviceId
          });
        } catch (e) {
          console.error("Presence update failed", e);
        }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [role, user?.email, user?.id]);

  useEffect(() => {
    if (role && (user?.email || studentCode)) {
      logAction('Sessão Restaurada', `Usuário ${user?.email || studentCode} acessou o sistema`, 'System');
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (role === 'student' && studentCode && !location.pathname.startsWith('/portal/')) {
      navigate(`/portal/${studentCode}`);
    }
  }, [location.pathname, role, studentCode, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <ShieldCheck size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-white font-black text-[10px] tracking-[0.4em] uppercase">OSS SENSEI</h2>
          <p className="text-slate-500 text-[8px] font-bold tracking-[0.2em] uppercase">Sincronizando tatame...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }>
        <Login />
      </Suspense>
    );
  }

  const isPortal = location.pathname.startsWith('/portal/');
  const isAdmin = role === 'admin';
  const showHeader = isAdmin || isPortal;
  const isMasterAdmin = user?.email && MASTER_ADMINS.includes(user.email.toLowerCase());

  return (
    <div 
      className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-400 selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans group/app relative"
      style={profile.backgroundImageUrl ? {
        backgroundImage: `linear-gradient(rgba(var(--bg-overlay), 0.95), rgba(var(--bg-overlay), 0.95)), url(${profile.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        transition: 'background-image 1s ease-in-out'
      } : {}}
    >
      <style>{`
        :root { --bg-overlay: 248, 250, 252; }
        .dark { --bg-overlay: 2, 6, 23; }
        .page-transition {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {(isAdmin && !isPortal) && <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} isMasterAdmin={isMasterAdmin} />}
      <DatabaseWarning />
      <div className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${(isPortal || role === 'student' || !isAdmin) 
          ? 'pl-0' 
          : (sidebarOpen ? 'lg:pl-72' : 'lg:pl-0')}`}>
        {showHeader && <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} auth={{ role, email: user?.email }} onLogout={handleLogout} />}
        <main className={`p-4 sm:p-8 lg:p-12 pt-24 lg:pt-32 flex-1 w-full ${isPortal ? 'max-w-full' : 'max-w-[1920px]'} mx-auto overflow-x-hidden pb-32 lg:pb-12 relative group`}>
          {/* Version Tracking for Sync Verification */}
          <div className="fixed bottom-6 right-6 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity z-[100]">
            <span className="text-[10px] font-mono font-black text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 tracking-tighter">SYSBJJ-V2.1.2</span>
          </div>
          <div className="page-transition" key={location.pathname}>
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              </div>
            }>
              <Routes>
                {role === 'admin' ? (
                  <>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/teaching-hub" element={<CurriculumHub />} />
                    <Route path="/performance" element={<PerformanceAnalytics />} />
                    <Route path="/ibjjf-rules" element={<IBJJFRules />} />
                    <Route path="/business" element={<BusinessHub />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/finances" element={<Finances />} />
                    <Route path="/history" element={<AttendanceHistory />} />
                    <Route path="/promotions" element={<BeltSystem />} />
                    <Route path="/language" element={<LanguageSelection />} />
                    <Route path="/timer" element={<FightTimer />} />
                    
                    {/* Governança Master - Restrito */}
                    <Route path="/settings" element={isMasterAdmin ? <Settings /> : <Navigate to="/dashboard" />} />
                    <Route path="/audit" element={isMasterAdmin ? <SystemAudit /> : <Navigate to="/dashboard" />} />
                    
                    <Route path="/exhibition" element={<ExhibitionMode />} />
                    <Route path="/portal/:code" element={<StudentPortal />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </>
                ) : (
                  <>
                    <Route path="/portal/:code" element={<StudentPortal />} />
                    <Route path="*" element={<Navigate to={`/portal/${studentCode}`} />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </div>
        </main>

        {/* Global Footer Optimization */}
        {role === 'admin' && !isPortal && (
          <footer className="hidden md:block py-12 px-12 border-t border-slate-100 dark:border-white/5 bg-white/5 dark:bg-slate-950/20 mb-8 mx-auto w-full max-w-[1920px] rounded-[3rem] transition-all">
             <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-elite">
                      <ShieldCheck size={28} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">SYSBJJ INTELLIGENCE SYSTEM 2.0</p>
                      <div className="flex flex-col gap-0.5">
                         <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">Security_Node_Active</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Hash: SHA-256_Automatic_Sync_Enabled</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap justify-center gap-12">
                   <div className="flex flex-col items-center lg:items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Protocolo de Integridade</span>
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">Blindado & Imutável</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-center lg:items-end space-y-1">
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic">© 2026 SYBJJ BY CT Pedro Honorio</p>
                        <a href="https://instagram.com/sistemabjj" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:text-blue-500 transition-all uppercase tracking-widest italic flex items-center gap-1.5 group/ig">
                          <Instagram size={12} className="group-hover/ig:scale-110 transition-transform" />
                          <span>@SISTEMABJJ</span>
                        </a>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Criado e Produzido por PPH e CT PH de JIU-JITSU</p>
                   </div>
                </div>
             </div>
          </footer>
        )}
        
        {role === 'admin' && <BottomNav onLogout={handleLogout} isMasterAdmin={isMasterAdmin} />}
      </div>
    </div>
  );
};

export default App;
