
import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Key, User, ArrowRight, Zap, Info, Lock, CheckCircle2 } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (role: 'admin' | 'student', studentCode?: string, email?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const { students } = useData();
  const [accessMode, setAccessMode] = useState<'admin' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');
  const [isBioScanning, setIsBioScanning] = useState(false);
  
  // Estados para Primeiro Acesso
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupStep, setSetupStep] = useState(1);

  useEffect(() => {
    const savedPin = localStorage.getItem('pph_admin_pin');
    if (!savedPin) {
      setNeedsSetup(true);
      setAccessMode('admin');
    }
  }, []);

  const handleAdminLogin = () => {
    const savedPin = localStorage.getItem('pph_admin_pin');
    const allowedEmails = ['dashfire@gmail.com', 'pedro.honorio@gm.rio'];

    if (!allowedEmails.includes(email.toLowerCase())) {
      setError('Acesso negado: Email não autorizado.');
      return;
    }

    if (pin === savedPin) {
      onLogin('admin', undefined, email.toLowerCase());
    } else {
      setError(t('login.pinIncorrect'));
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSetupPassword = () => {
    if (setupPin.length !== 4) {
      setError(t('login.pinLengthError'));
      return;
    }
    if (setupPin !== confirmPin) {
      setError(t('login.pinMatchError'));
      return;
    }

    localStorage.setItem('pph_admin_pin', setupPin);
    setNeedsSetup(false);
    setError('');
    // Feedback de sucesso
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  const handleStudentLogin = () => {
    const student = students.find(s => s.portalAccessCode?.toUpperCase() === studentCode.toUpperCase());
    if (student) {
      onLogin('student', student.portalAccessCode);
    } else {
      setError(t('login.studentNotFound'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const simulateBiometry = () => {
    const savedPin = localStorage.getItem('pph_admin_pin');
    const allowedEmails = ['dashfire@gmail.com', 'pedro.honorio@gm.rio'];
    if (!savedPin) return;

    if (!allowedEmails.includes(email.toLowerCase())) {
      setError('Biometria requer email autorizado.');
      return;
    }

    setIsBioScanning(true);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    setTimeout(() => {
      setIsBioScanning(false);
      onLogin('admin', undefined, email.toLowerCase());
    }, 1500);
  };

  // View de Setup Inicial
  if (needsSetup) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[300]">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-3">
              <Lock size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{t('login.initialSetup')}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">{t('login.setPinSensei')}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('login.createPin')}</label>
                <input 
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-blue-500 outline-none focus:border-blue-500/50"
                  value={setupPin}
                  onChange={e => setSetupPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('login.confirmPin')}</label>
                <input 
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-blue-500 outline-none focus:border-blue-500/50"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button 
              onClick={handleSetupPassword}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {t('login.finishSetup')}
            </button>

            {error && (
              <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
            )}

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-start">
              <Info size={16} className="text-slate-500 shrink-0" />
              <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase">
                {t('login.pinWarning')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-[200]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[150px] opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[150px] opacity-10" />
      </div>

      <div className="w-full max-w-md space-y-8 relative animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-3">
            <Shield size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{profile.academyName}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">{t('login.unifiedAccess')}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-2xl">
          <div className="flex p-1 bg-slate-950 rounded-2xl mb-8">
            <button 
              onClick={() => setAccessMode('student')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${accessMode === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              {t('login.studentPortal')}
            </button>
            <button 
              onClick={() => setAccessMode('admin')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${accessMode === 'admin' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
            >
              {t('login.admin')}
            </button>
          </div>

          {accessMode === 'admin' ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email do Administrador</label>
                <input 
                  type="email"
                  placeholder="admin@exemplo.com"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-blue-500/50 transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('login.insertPin')}</label>
                <input 
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] text-blue-500 outline-none focus:border-blue-500/50 transition-all"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={e => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>

              <button 
                onClick={handleAdminLogin}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
              >
                {t('login.accessMaster')}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-600"><span className="bg-slate-900 px-4">{t('login.orBiometry')}</span></div>
              </div>

              <button 
                onClick={simulateBiometry}
                disabled={isBioScanning}
                className={`w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group transition-all ${isBioScanning ? 'bg-blue-600/20 border-blue-500 animate-pulse' : 'hover:border-blue-500/50 hover:bg-white/5'}`}
              >
                <Fingerprint size={48} className={isBioScanning ? 'text-blue-500' : 'text-slate-700 group-hover:text-blue-500 transition-colors'} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('login.touchId')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('login.portalCode')}</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                  <input 
                    type="text"
                    placeholder="PPH-XXX-000"
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleStudentLogin()}
                  />
                </div>
              </div>

              <button 
                onClick={handleStudentLogin}
                className="w-full py-5 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {t('login.enterPortal')} <ArrowRight size={18} />
              </button>

              <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex gap-4 items-start">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-400 font-medium leading-relaxed uppercase">{t('login.portalCodeInfo')}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-600/20 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
              {error}
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            OSS! SYSBJJ 2.0 • Elite Edition
          </p>
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
            Dev: dashfire@gmail.com • {t('login.supportViaPix')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
