import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu, X, Bell, Sun, Moon, Search, Shield, LogOut, Clock, CheckCircle2, Instagram, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NAVIGATION_ITEMS, BELT_COLORS, MASTER_ADMINS } from '../constants';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Classes from '../pages/Classes';
import IBJJFRules from '../pages/IBJJFRules';
import BusinessHub from '../pages/BusinessHub';
import AttendancePage from '../pages/Attendance';
import BeltSystem from '../pages/BeltSystem';
import FightTimer from '../pages/FightTimer';
import Settings from '../pages/Settings';
import StudentPortal from '../pages/StudentPortal';
import Curriculum from '../pages/Curriculum';
import ExhibitionMode from '../pages/ExhibitionMode';
import SystemAudit from '../pages/SystemAudit';
import LanguageSelection from '../pages/LanguageSelection';
import Login from '../pages/Login';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { db, auth as firebaseAuth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthState {
  isLoggedIn: boolean;
  role: 'admin' | 'student' | null;
  studentCode?: string;
  email?: string;
}

const Sidebar = ({ isOpen, toggle, onLogout }: { isOpen: boolean, toggle: () => void, onLogout: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
  const isMasterAdmin = MASTER_ADMINS.includes(auth.email?.toLowerCase());

  if (location.pathname.startsWith('/portal/')) return null;

  const filteredItems = NAVIGATION_ITEMS.filter(item => {
    if (item.id === 'audit') return isMasterAdmin;
    return true;
  });

  const coreItems = filteredItems.filter(item => ['dashboard', 'students', 'classes', 'business', 'curriculum', 'attendance'].includes(item.id));
  const evolutionItems = filteredItems.filter(item => ['promotions', 'ibjjf-rules'].includes(item.id));

  const renderNavItem = (item: any) => {
    const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
    return (
      <Link
        key={item.id}
        to={`/${item.id}`}
        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-1 ring-white/10' : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
        onClick={() => { if(window.innerWidth < 1024) toggle(); }}
      >
        <div className={`shrink-0 transition-all duration-500 ${isActive ? 'scale-110 rotate-0' : 'group-hover:scale-110 group-hover:-rotate-3'}`}>{item.icon}</div>
        <span className={`font-black tracking-wider uppercase text-[10px] truncate transition-all duration-700 flex-1 min-w-0 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
          {t(`common.${item.id}`)}
        </span>
        {isActive && (
          <motion.div 
            layoutId="active-indicator"
            className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1"
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
                  {profile.academyName[0] || 'S'}
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
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">{t('dashboard.training')}</span>
               <div className="h-px bg-slate-100 dark:bg-slate-800/50 flex-1" />
            </div>
            <div className="space-y-1">
              {coreItems.map(renderNavItem)}
            </div>
          </div>

          <div className={!isOpen ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <div className="mb-3 px-4 flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">{t('common.evolution')}</span>
               <div className="h-px bg-slate-100 dark:bg-slate-800/50 flex-1" />
            </div>
            <div className="space-y-1">
              {evolutionItems.map(renderNavItem)}
            </div>
          </div>
        </nav>
        
        <div className="flex-none p-3 mt-8 mb-24 lg:mb-6 space-y-2 overflow-hidden shrink-0 border-t border-slate-100 dark:border-slate-800/50 pt-6">
          <Link to="/settings" onClick={() => { if(window.innerWidth < 1024) toggle(); }}>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
               <div className="flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 ${BELT_COLORS[profile.belt] || 'bg-slate-700'}`}>
                   <span className="font-black text-[10px] text-white tracking-tighter">{profile.stripes}º</span>
                 </div>
                 <div className={`overflow-hidden flex-1 min-w-0 transition-all duration-500 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                   <p className="text-[11px] font-black underline decoration-blue-500/30 underline-offset-2 truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase">{profile.name}</p>
                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider truncate">{profile.specialization}</p>
                 </div>
               </div>
            </div>
          </Link>
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
        
        <div className={`mt-auto px-6 py-4 border-t border-slate-100 dark:border-slate-800/50 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] whitespace-nowrap">
            SYSBJJ v2.1.2 • ELITE EDITION
          </p>
        </div>
      </aside>
    </>
  );
};

const BottomNav = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const auth = JSON.parse(localStorage.getItem('oss_auth') || '{}');
  const isMasterAdmin = MASTER_ADMINS.includes(auth.email?.toLowerCase());
  
  const filteredNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.id === 'audit') return isMasterAdmin;
    return true;
  });

  const items = filteredNavItems.slice(0, 5); // Dashboard, Students, Classes, Business, Curriculum

  if (location.pathname.startsWith('/portal/')) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden pb-safe">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`flex flex-col items-center justify-center gap-1 h-full transition-all overflow-hidden ${isActive ? 'text-slate-900 dark:text-blue-500 border-t-2 border-slate-900 dark:border-blue-500' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <div className={isActive ? 'scale-110 transition-transform' : ''}>{item.icon}</div>
              <span className={`text-[7px] font-black uppercase tracking-tight truncate w-full px-1 text-center ${isActive ? 'text-slate-900 dark:text-blue-500' : ''}`}>
                {item.id === 'curriculum' ? t('common.curriculumShort') : t(`common.${item.id}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Header = ({ toggleSidebar, auth, onLogout }: { toggleSidebar: () => void, auth: AuthState, onLogout: () => void }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
            {profile.academyName[0] || 'S'}
          </div>
        )}
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{profile.academyName || 'SYSBJJ 2.0'}</h2>
          <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">{t('portal.studentPortal')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
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
    <header className="h-16 sm:h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 sm:px-12 sticky top-0 z-40 w-full transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleSidebar} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl active:scale-95 transition-all">
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:flex items-center gap-6 border-l border-slate-200 dark:border-slate-800/80 pl-8 h-12 ml-2">
           <div className="flex flex-col items-start justify-center h-full">
             <div className="flex items-baseline gap-2 leading-none group/time">
               <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tighter tabular-nums drop-shadow-sm group-hover/time:text-blue-600 transition-colors duration-500">
                 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </h2>
               <div className="flex flex-col">
                 <span className="text-[11px] font-black text-blue-600 dark:text-blue-500 font-mono tabular-nums leading-none mb-[2px] animate-pulse">
                   {currentTime.toLocaleTimeString([], { second: '2-digit' })}
                 </span>
                 <div className="w-full h-[1.5px] bg-gradient-to-r from-blue-500 to-transparent" />
               </div>
             </div>
             <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.45em] whitespace-nowrap flex items-center gap-2 mt-2 leading-none">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
               {currentTime.toLocaleDateString(t('common.dateLocale'), { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
             </p>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl group focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50 transition-all">
          <Search size={14} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.2em] w-32 xl:w-48 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
          />
        </div>

        <button className="relative p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-blue-600 transition-all group active:scale-95">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm shadow-red-500/50" />
        </button>
        
        <button 
          onClick={handleThemeToggle}
          className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-blue-600 transition-all active:scale-95"
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
  
  useEffect(() => {
    // Auto-login anonymously to enable Firestore writes if not authenticated
    // This is useful for student portal check-ins and logs when not fully logged in via email
    if (firebaseAuth) {
      signInAnonymously(firebaseAuth).catch(err => {
        // Silent specific errors that are expected in restricted environments
        const silentErrors = [
          'auth/admin-restricted-operation',
          'auth/operation-not-allowed',
          'auth/configuration-not-found'
        ];
        if (!silentErrors.includes(err.code)) {
          console.warn("Auth initialization note:", err.message);
        }
      });
    }
  }, []);

  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('oss_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: null };
  });

  // Track Online Status
  useEffect(() => {
    if (auth.isLoggedIn && auth.email && db) {
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
          const presenceRef = doc(db, 'presence', `${auth.email!.replace(/\./g, '_')}_${deviceId}`);
          await setDoc(presenceRef, {
            email: auth.email,
            lastSeen: Date.now(),
            role: auth.role,
            userAgent: deviceInfo,
            deviceId: deviceId
          }, { merge: true });
        } catch (e) {
          console.error("Presence update failed", e);
        }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [auth.isLoggedIn, auth.email, auth.role]);

  useEffect(() => {
    if (auth.isLoggedIn && auth.email) {
      logAction('Sessão Restaurada', `Usuário ${auth.email} acessou o sistema`, 'System');
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (auth.isLoggedIn && auth.role === 'student' && !location.pathname.startsWith('/portal/')) {
      navigate(`/portal/${auth.studentCode}`);
    }
  }, [location.pathname, auth, navigate]);

  const handleLogin = (role: 'admin' | 'student', studentCode?: string, email?: string) => {
    const newAuth: AuthState = { isLoggedIn: true, role, studentCode, email };
    setAuth(newAuth);
    localStorage.setItem('oss_auth', JSON.stringify(newAuth));
    
    // Log direct login
    if (email) {
      logAction('Login', `Usuário ${email} entrou no sistema (${role})`, 'Security');
    }
    
    if (role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate(`/portal/${studentCode}`);
    }
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, role: null });
    localStorage.removeItem('oss_auth');
    navigate('/');
  };

  if (!auth.isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const isPortal = location.pathname.startsWith('/portal/');
  const isAdmin = auth.role === 'admin';
  const showHeader = isAdmin || isPortal;

  return (
    <div 
      className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-400 selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans group/app relative"
      style={profile.backgroundImageUrl ? {
        backgroundImage: `linear-gradient(rgba(var(--bg-overlay), 0.94), rgba(var(--bg-overlay), 0.94)), url(${profile.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      <style>{`
        :root { --bg-overlay: 248, 250, 252; }
        .dark { --bg-overlay: 2, 6, 23; }
      `}</style>
      {(isAdmin && !isPortal) && <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />}
      <div className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${(isPortal || auth.role === 'student' || !isAdmin) 
          ? 'pl-0' 
          : (sidebarOpen ? 'lg:pl-72' : 'lg:pl-0')}`}>
        {showHeader && <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} auth={auth} onLogout={handleLogout} />}
        <main className={`p-4 sm:p-8 lg:p-12 pt-24 lg:pt-32 flex-1 w-full ${isPortal ? 'max-w-full' : 'max-w-[1920px]'} mx-auto overflow-x-hidden pb-24 lg:pb-12 relative group`}>
          {/* Version Tracking for Sync Verification */}
          <div className="fixed bottom-6 right-6 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity z-[100]">
            <span className="text-[10px] font-mono font-black text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 tracking-tighter">SYSBJJ-V2.1.2</span>
          </div>
          <div className="page-transition" key={location.pathname}>
            <Routes>
              {auth.role === 'admin' ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/ibjjf-rules" element={<IBJJFRules />} />
                  <Route path="/business" element={<BusinessHub />} />
                  <Route path="/curriculum" element={<Curriculum />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/promotions" element={<BeltSystem />} />
                  <Route path="/language" element={<LanguageSelection />} />
                  <Route path="/timer" element={<FightTimer />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/audit" element={<SystemAudit />} />
                  <Route path="/exhibition" element={<ExhibitionMode />} />
                  <Route path="/portal/:code" element={<StudentPortal />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              ) : (
                <>
                  <Route path="/portal/:code" element={<StudentPortal />} />
                  <Route path="*" element={<Navigate to={`/portal/${auth.studentCode}`} />} />
                </>
              )}
            </Routes>
          </div>
        </main>
        {auth.role === 'admin' && <BottomNav onLogout={handleLogout} />}
      </div>
    </div>
  );
};

export default App;
