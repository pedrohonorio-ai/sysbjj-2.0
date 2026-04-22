import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Menu, X, Bell, Sun, Moon, Search, Shield, LogOut, Clock, CheckCircle2, Instagram, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NAVIGATION_ITEMS, BELT_COLORS } from '../constants';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Classes from '../pages/Classes';
import IBJJFRules from '../pages/IBJJFRules';
import BusinessHub from '../pages/BusinessHub';
import AttendancePage from '../pages/Attendance';
import BeltSystem from '../pages/BeltSystem';
import FightTimer from '../pages/FightTimer';
import AICoach from '../pages/AICoach';
import Settings from '../pages/Settings';
import StudentPortal from '../pages/StudentPortal';
import Curriculum from '../pages/Curriculum';
import ExhibitionMode from '../pages/ExhibitionMode';
import SystemAudit from '../pages/SystemAudit';
import KidsSystem from '../pages/KidsSystem';
import Kimonos from '../pages/Kimonos';
import MusicPlayer from '../pages/MusicPlayer';
import LanguageSelection from '../pages/LanguageSelection';
import Login from '../pages/Login';
import { LanguageProvider, useTranslation } from '../contexts/LanguageContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ProfileProvider, useProfile } from '../contexts/ProfileContext';
import { DataProvider } from '../contexts/DataContext';

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

  if (location.pathname.startsWith('/portal/')) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggle}
      />
      
      <aside className={`fixed inset-y-0 left-0 z-[60] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transform transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col overflow-y-auto scrollbar-hide
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-20 xl:w-72'}`}>
        
        <div className="flex-none flex items-center justify-between p-6 h-20 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-blue-500/10 shrink-0">
              {profile.academyName[0] || 'P'}
            </div>
            <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-0 xl:opacity-100 lg:-translate-x-4 xl:translate-x-0'}`}>
              <h1 className="font-display font-black leading-none tracking-tight text-slate-900 dark:text-white uppercase text-sm">{(profile.academyName || 'PPH BJJ ACADEMY').toUpperCase()}</h1>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black mt-1">Elite Management</p>
            </div>
          </div>
          <button onClick={toggle} className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-2">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-3 space-y-1 scrollbar-hide">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
                onClick={() => { if(window.innerWidth < 1024) toggle(); }}
              >
                <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</div>
                <span className={`font-black tracking-tight uppercase text-[10px] truncate transition-all duration-500 ${isOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-0 xl:opacity-100 lg:-translate-x-4 xl:translate-x-0'}`}>
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
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap lg:block xl:hidden hidden border border-slate-800 dark:border-slate-700">
                    {t(`common.${item.id}`)}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex-none p-3 mt-8 mb-24 lg:mb-6 space-y-2 overflow-hidden shrink-0 border-t border-slate-100 dark:border-slate-800/50 pt-6">
          <Link to="/settings" onClick={() => { if(window.innerWidth < 1024) toggle(); }}>
            <div className={`p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group ${!isOpen ? 'lg:p-2' : ''}`}>
               <div className="flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 ${BELT_COLORS[profile.belt] || 'bg-slate-700'}`}>
                   <span className="font-black text-[10px] text-white tracking-tighter">{profile.stripes}º</span>
                 </div>
                 <div className={`overflow-hidden flex-1 transition-all duration-500 ${isOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-0 xl:opacity-100 lg:-translate-x-4 xl:translate-x-0'}`}>
                   <p className="text-[11px] font-black underline decoration-blue-500/30 underline-offset-2 truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase">{profile.name}</p>
                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest truncate">{profile.specialization}</p>
                 </div>
               </div>
            </div>
          </Link>
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all uppercase font-black text-[10px] tracking-widest ${!isOpen ? 'lg:justify-center xl:justify-start' : ''}`}
          >
            <LogOut size={18} className="shrink-0 group-hover:rotate-12 transition-transform" /> 
            <span className={`transition-all duration-500 ${isOpen ? 'opacity-100 translate-x-0' : 'lg:opacity-0 xl:opacity-100 lg:-translate-x-4 xl:translate-x-0'}`}>
              {t('common.logout')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

const BottomNav = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const items = NAVIGATION_ITEMS.slice(0, 5); // Dashboard, Students, Classes, Business, Curriculum

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
              className={`flex flex-col items-center justify-center gap-1 h-full transition-all ${isActive ? 'text-slate-900 dark:text-blue-500 border-t-2 border-slate-900 dark:border-blue-500' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <div className={isActive ? 'scale-110 transition-transform' : ''}>{item.icon}</div>
              <span className={`text-[8px] font-bold uppercase tracking-tight truncate w-full px-1 text-center ${isActive ? 'text-slate-900 dark:text-blue-500' : ''}`}>
                {item.id === 'curriculum' ? t('common.curriculumShort') : t(`common.${item.id}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (location.pathname.startsWith('/portal/')) return (
    <header className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40 w-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm">PPH</div>
        <span className="text-white font-black text-xs uppercase tracking-widest">{t('portal.title')}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
           <p className="text-[10px] font-black text-white uppercase tracking-widest">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
           <p className="text-[8px] font-bold text-slate-500 uppercase">{currentTime.toLocaleDateString(t('common.dateLocale'))}</p>
        </div>
        <button 
          onClick={handleThemeToggle}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
  
  return (
    <header className="h-16 sm:h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 w-full transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleSidebar} className="lg:hidden p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl active:scale-95 transition-all">
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:flex flex-col">
           <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </h2>
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
             {currentTime.toLocaleDateString(t('common.dateLocale'), { weekday: 'long', day: 'numeric', month: 'short' })}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
          <Search size={16} className="text-slate-400 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-48 text-slate-900 dark:text-white placeholder:text-slate-400"
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('oss_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: null };
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (auth.isLoggedIn && auth.role === 'student' && !location.pathname.startsWith('/portal/')) {
      navigate(`/portal/${auth.studentCode}`);
    }
  }, [location.pathname, auth]);

  const handleLogin = (role: 'admin' | 'student', studentCode?: string, email?: string) => {
    const newAuth: AuthState = { isLoggedIn: true, role, studentCode, email };
    setAuth(newAuth);
    localStorage.setItem('oss_auth', JSON.stringify(newAuth));
    
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

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-400 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {isAdmin && <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />}
      <div className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${(isPortal || auth.role === 'student' || !isAdmin) 
          ? 'pl-0' 
          : (sidebarOpen ? 'lg:pl-72' : 'lg:pl-20 xl:pl-72')}`}>
        {isAdmin && <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />}
        <main className={`p-4 sm:p-8 pt-24 lg:pt-28 flex-1 w-full ${isPortal ? 'max-w-full' : 'max-w-full 2xl:max-w-7xl'} mx-auto overflow-x-hidden pb-24 lg:pb-8`}>
          <div className="page-transition">
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
                  <Route path="/kids" element={<KidsSystem />} />
                  <Route path="/kimonos" element={<Kimonos />} />
                  <Route path="/music" element={<MusicPlayer />} />
                  <Route path="/language" element={<LanguageSelection />} />
                  <Route path="/timer" element={<FightTimer />} />
                  <Route path="/assistant" element={<AICoach />} />
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

const RootApp = () => (
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <ProfileProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </ProfileProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default RootApp;
