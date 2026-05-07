
import React, { useState } from 'react';
import { Shield, Lock, User, Key, ArrowRight, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';

interface LoginProps {
  onLogin: (role: 'admin' | 'student', studentCode?: string, email?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [activeTab, setActiveTab ] = useState<'admin' | 'student'>('admin');
  const [pin, setPin] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified logic for now: check against a default PIN or the one in profile if we had one
    // In a real app, this would be more secure.
    if (pin === '1234') { // Default PIN
      onLogin('admin', undefined, 'admin@sysbjj.com');
    } else {
      setError(t('login.pinIncorrect'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentCode.length >= 4) {
      onLogin('student', studentCode);
    } else {
      setError(t('login.studentNotFound'));
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-24 h-24 object-contain mb-4" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl">
                {profile.academyName?.[0] || 'S'}
              </div>
            )}
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">{profile.academyName}</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Intelligence System 2.0</p>
          </div>

          <div className="flex bg-slate-950/50 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Sensei
            </button>
            <button 
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              {t('common.students').split(' ')[0]}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'admin' ? (
              <motion.form 
                key="admin-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleAdminLogin}
                className="space-y-6"
              >
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block pl-2">
                    {t('login.insertPin')}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="password" 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={4}
                      placeholder="••••"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black tracking-[1em] text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:tracking-normal"
                    />
                  </div>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group uppercase text-xs tracking-widest">
                   {t('login.accessMaster')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="student-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleStudentLogin}
                className="space-y-6"
              >
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block pl-2">
                    {t('login.portalCode')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                      placeholder="OSS-XXXX"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black uppercase tracking-[0.2em] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:tracking-normal"
                    />
                  </div>
                  <p className="mt-3 text-[8px] text-slate-500 font-medium leading-relaxed px-2">
                    {t('login.portalCodeInfo')}
                  </p>
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>}
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase text-xs tracking-widest">
                   {t('login.enterPortal')}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <Shield size={16} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Security Protocol Active</span>
            </div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-2">© 2026 SYBJJ BY CT Pedro Honorio</p>
            <a href="https://instagram.com/sistemabjj" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-500 hover:text-blue-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                <Instagram size={12} /> @SISTEMABJJ
            </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
