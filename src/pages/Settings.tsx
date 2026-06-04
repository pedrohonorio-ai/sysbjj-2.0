
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { useProfile } from '../contexts/ProfileContext.js';
import { useData } from '../contexts/DataContext.js';
import { useAuth } from '../context/AuthContext.js';
import { AppLanguage } from '../types.js';
import { Check, Globe, User, Save, Shield, Database, Download, Upload, Trash2, CreditCard, Mail, BookOpen, MapPin, Monitor, Activity, Users, TrendingUp, Trophy, ShieldCheck, Palette } from 'lucide-react';
import { api } from '../services/api.js';
import { enterpriseApi } from '../services/enterpriseApi.js';
import { compressImage } from '../services/imageUtils.js';
import PlanCard from '../components/subscription/PlanCard.js';
import { MASTER_ADMINS } from '../constants/index.js';

const languages = [
  { code: AppLanguage.PORTUGUESE_BR, name: 'Português', native: 'Português (Brasil)', flag: '🇧🇷' },
  { code: AppLanguage.ENGLISH_US, name: 'English', native: 'English (US)', flag: '🇺🇸' },
  { code: AppLanguage.SPANISH_ES, name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: AppLanguage.JAPANESE, name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: AppLanguage.RUSSIAN, name: 'Russian', native: 'Русский', flag: '🇷🇺' }
];

const Settings: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const { exportData, importData } = useData();
  const { user } = useAuth();
  
  const getAuthData = () => {
    try {
      const saved = localStorage.getItem('oss_auth');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };
  const authData = getAuthData();
  const isAdmin = user?.role === 'admin' || authData.role === 'admin';
  const isDashfireAdmin = MASTER_ADMINS.includes(user?.email || '');
  
  const [formData, setFormData] = useState({
    ...profile,
    latitude: profile.latitude,
    longitude: profile.longitude,
    geofenceRadius: profile.geofenceRadius || 100,
    pixKey: profile.pixKey || '',
    pixName: profile.pixName || '',
    pixCity: profile.pixCity || ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [systemStats, setSystemStats] = useState({ 
    activeSessions: 0, 
    totalAcademies: 0,
    activeIdentities: [] as string[] 
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(!!(window as any).deferredPrompt);

  // 🥋 EXCLUSÃO DE CONTA SEGURA LOCAL STATE
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 🥋 ALTERAÇÃO DE SENHA LOCAL STATE & HANDLER
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Preencha todos os campos da alteração de senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('A nova senha e a confirmação não conferem.');
      return;
    }

    setPwdLoading(true);
    try {
      const auth = JSON.parse(localStorage.getItem("oss_auth") || "{}");
      const token = auth?.token;

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (data.success) {
        setPwdSuccess("Sua senha foi alterada com sucesso! OSS.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdError(data.error || 'Erro ao alterar a senha.');
      }
    } catch (err) {
      setPwdError('Erro de conexão com o servidor.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const targetUserId = user?.id || authData.id;
      if (!targetUserId) {
        throw new Error("Identificação do usuário não encontrada.");
      }
      
      const res = await enterpriseApi.fetchWithEnterprise(`/api/admin/delete-user/${targetUserId}`, {
        method: 'DELETE'
      });
      
      if (res && res.success) {
        localStorage.clear();
        sessionStorage.clear();
        setIsDeleteModalOpen(false);
        window.location.href = '/login';
      } else {
        setDeleteError(res?.error || "Erro ao solicitar exclusão no servidor.");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Falha ao processar exclusão segura.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    window.addEventListener('pwa-installable', handleInstallable);
    return () => window.removeEventListener('pwa-installable', handleInstallable);
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setCanInstall(false);
    }
  };

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await api.fetchSubscription();
        if (res) setSubscription(res);
      } catch (e) {}
    };
    fetchSub();
  }, []);

  useEffect(() => {
    if (isDashfireAdmin) {
      const fetchPresence = async () => {
        try {
          const presenceData = await api.fetchData('presence', authData.id || 'admin');
          if (Array.isArray(presenceData)) {
            const identities = presenceData.map((p: any) => p.email || p.id).filter(Boolean);
            setSystemStats({ 
              activeSessions: presenceData.length, 
              totalAcademies: presenceData.length,
              activeIdentities: identities
            });
          }
        } catch (e) {
          console.error("Presence fetch failed", e);
        }
      };

      fetchPresence();
      const interval = setInterval(fetchPresence, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isDashfireAdmin, authData.id]);

  const getCurrentLocation = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          geofenceRadius: formData.geofenceRadius || 100
        });
        setIsCapturing(false);
        alert(t('settings.locationCaptured'));
      }, (error) => {
        alert(t('settings.locationError') + error.message);
        setIsCapturing(false);
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      alert(t('settings.locationNotSupported'));
      setIsCapturing(false);
    }
  };

  const handleSave = () => {
    updateProfile(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') importData(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-20 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex items-center gap-4 px-2 sm:px-0">
        <div className="p-3 sm:p-4 bg-blue-600 rounded-[1.2rem] sm:rounded-[1.5rem] text-white shadow-xl shadow-blue-500/20">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{t('settings.title')}</h1>
          <p className="text-slate-500 italic font-medium mt-1 text-sm">{t('settings.subtitle')}</p>
        </div>
      </div>

      {subscription && (
        <div className="px-2 sm:px-0">
          <PlanCard subscription={subscription} />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <User size={18} className="text-blue-600" /> {t('settings.profileSection')}
          </h3>
          {showSuccess && (
            <span className="text-[9px] sm:text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest animate-bounce">
              {t('settings.saveSuccess')}
            </span>
          )}
        </div>
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.profName')}</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.academyName')}</label>
            <input type="text" value={formData.academyName} onChange={e => setFormData({...formData, academyName: e.target.value})} className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
            <Palette size={18} className="text-blue-600" /> {t('settings.visualIdentity')}
          </h3>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all">
            <Save size={14} /> {t('settings.save')}
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.academyLogo')}</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Upload size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <label className="block w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('settings.chooseFiles')}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const compressed = await compressImage(reader.result as string, 400, 0.7);
                            setFormData({ ...formData, logoUrl: compressed });
                          }
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    className="w-full text-[9px] font-bold text-red-500 uppercase tracking-tighter"
                  >
                    {t('settings.removeLogo')}
                  </button>
                </div>
              </div>
            </div>

            {/* Background Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.systemBackground')}</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.backgroundImageUrl ? (
                    <img src={formData.backgroundImageUrl} alt="BG Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Globe size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <label className="block w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('settings.loadBackground')}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const compressed = await compressImage(reader.result as string, 1200, 0.6);
                            setFormData({ ...formData, backgroundImageUrl: compressed });
                          }
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => setFormData({ ...formData, backgroundImageUrl: '' })}
                    className="w-full text-[9px] font-bold text-red-500 uppercase tracking-tighter"
                  >
                    {t('settings.removeBackground')}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom App Launcher & Installation Setup */}
            <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    📲 {t('settings.appInstallation') || 'Adicionar à Área de Trabalho (Instalar App)'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Fixe o SYSBJJ na tela inicial com o seu logotipo e o nome personalizado da sua academia!
                  </p>
                </div>
                {canInstall ? (
                  <button
                    onClick={handleInstallApp}
                    type="button"
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <ShieldCheck size={14} /> Instalar Aplicativo
                  </button>
                ) : (
                  <div className="bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Atalho Inteligente Pronto
                  </div>
                )}
              </div>

              {/* Step-by-Step Installation Instruction cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Dispositivos Apple iOS (Safari / iPhone)</span>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase mt-2 tracking-normal leading-relaxed">
                    1. Carregue o site no seu navegador <strong className="text-blue-500">Safari</strong> <br />
                    2. Toque no botão de <strong className="text-slate-700 dark:text-slate-200">Compartilhar</strong> (ícone de seta pra cima) <br />
                    3. Desça e marque <strong className="text-slate-700 dark:text-slate-200">"Adicionar à Tela de Início"</strong> <br />
                    4. O app será fixado com o logotipo exclusivo do seu Dojo!
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Dispositivos Android ou PC (Google Chrome)</span>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase mt-2 tracking-normal leading-relaxed">
                    1. Toque no botão verde <strong className="text-emerald-500">"Instalar Aplicativo"</strong> acima <br />
                    2. Ou toque nos <strong className="text-slate-700 dark:text-slate-200">três pontos (...)</strong> do Chrome <br />
                    3. Toque em <strong className="text-slate-700 dark:text-slate-200">"Instalar aplicativo"</strong> ou <strong className="text-slate-700 dark:text-slate-200">"Adicionar à tela inicial"</strong> <br />
                    4. Confirme para acessar sua academia diretamente da área de trabalho!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <CreditCard size={18} className="text-blue-600" /> {t('settings.financialSection')}
          </h3>
        </div>
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.pixKey')}</label>
            <input 
              type="text" 
              value={formData.pixKey} 
              onChange={e => setFormData({...formData, pixKey: e.target.value})} 
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
              placeholder={t('settings.pixKeyPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.pixName')}</label>
            <input 
              type="text" 
              value={formData.pixName} 
              onChange={e => setFormData({...formData, pixName: e.target.value})} 
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.pixCity')}</label>
            <input 
              type="text" 
              value={formData.pixCity} 
              onChange={e => setFormData({...formData, pixCity: e.target.value})} 
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all">
              <Save size={18} /> {t('settings.saveBtn')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
            <BookOpen size={18} className="text-blue-600" /> {t('settings.graduationRulesSection') || 'Regras da Academia'}
          </h3>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all">
            <Save size={14} /> {t('settings.saveBtn')}
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">
            {t('settings.graduationRulesDesc') || 'Defina os critérios próprios de sua equipe para graduação dos alunos (Markdown suportado).'}
          </p>
          <textarea 
            value={formData.graduationRules || ''} 
            onChange={e => setFormData({...formData, graduationRules: e.target.value})} 
            className="w-full px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-mono text-sm min-h-[300px]" 
            placeholder="# Regras de Graduação\n\n- Exemplo: 3 aulas por semana..."
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <MapPin size={18} className="text-blue-600" /> {t('settings.locationSection')}
          </h3>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all">
            <Save size={14} /> {t('settings.saveBtn')}
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {t('settings.locationDesc')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.latitude')}</label>
              <input 
                type="number" 
                step="any"
                value={formData.latitude ?? ''} 
                onChange={e => setFormData({...formData, latitude: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder={t('settings.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.longitude')}</label>
              <input 
                type="number" 
                step="any"
                value={formData.longitude ?? ''} 
                onChange={e => setFormData({...formData, longitude: e.target.value === '' ? undefined : parseFloat(e.target.value)})} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder={t('settings.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.radius')}</label>
              <input 
                type="number" 
                value={formData.geofenceRadius ?? ''} 
                onChange={e => setFormData({...formData, geofenceRadius: e.target.value === '' ? undefined : parseInt(e.target.value)})} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder={t('settings.radiusPlaceholder')}
              />
            </div>
          </div>

          <button 
            onClick={getCurrentLocation}
            disabled={isCapturing}
            className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${isCapturing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white shadow-xl'}`}
          >
            {isCapturing ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin size={18} />
            )}
            {t('settings.locationBtn')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <Database size={18} className="text-blue-600" /> {t('settings.dataSection')}
          </h3>
        </div>
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
           <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button onClick={exportData} className="flex-1 flex items-center justify-center gap-4 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all group">
                <Download size={24} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                   <p className="font-black text-sm uppercase dark:text-white">{t('settings.exportBackup')}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{t('settings.exportDesc')}</p>
                </div>
              </button>
              <label className="flex-1 flex items-center justify-center gap-4 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 hover:border-green-400 transition-all group cursor-pointer">
                <Upload size={24} className="text-green-600 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                   <p className="font-black text-sm uppercase dark:text-white">{t('settings.importBackup')}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{t('settings.importDesc')}</p>
                </div>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
           </div>
           <div className="p-5 sm:p-6 bg-red-50 dark:bg-red-900/10 rounded-[1.5rem] sm:rounded-[2rem] border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                 <Trash2 className="text-red-600" size={24} />
                 <div>
                    <p className="font-black text-sm uppercase text-red-600">{t('settings.flushData')}</p>
                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">{t('settings.flushDesc')}</p>
                 </div>
              </div>
              <button onClick={() => { if(confirm(t('settings.wipeConfirm'))) { localStorage.clear(); location.reload(); } }} className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">
                {t('settings.wipeCore')}
              </button>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <Globe size={18} className="text-blue-600" /> {t('settings.languageSection')}
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button key={lang.code} onClick={() => setLanguage(lang.code)} className="w-full p-6 sm:p-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                <div className="flex items-center gap-4 sm:gap-8">
                  <span className="text-3xl sm:text-5xl grayscale-[0.5] group-hover:grayscale-0 transition-all">{lang.flag}</span>
                  <div>
                    <p className={`font-black text-base sm:text-xl uppercase tracking-tighter ${isSelected ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{lang.name}</p>
                    <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.native}</p>
                  </div>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[1rem] sm:rounded-[1.2rem] border-2 sm:border-4 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white rotate-6' : 'border-slate-100 dark:border-slate-700 group-hover:border-blue-300'}`}>{isSelected && <Check size={20} />}</div>
              </button>
            );
          })}
        </div>
      </div>



      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">{t('settings.suggestionsTitle')}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('settings.suggestionsSubtitle')}</p>
            </div>
          </div>
          
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('settings.directContact')}</span>
              <span className="text-blue-400 font-bold">pedro.honorio@gm.rio</span>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('settings.supportPix')}</span>
              <span className="text-green-400 font-bold">dashfire@gmail.com</span>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
            "{t('settings.quote')}"
          </p>
        </div>
      </div>

      {/* 🥋 SEGURANÇA E ALTERAÇÃO DE SENHA */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-3">
            <Shield size={18} className="text-blue-600" /> {t('settings.securitySection') || 'Segurança & Credenciais'}
          </h3>
          <span className="text-[8px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/25 px-3 py-1 rounded-full uppercase tracking-widest">
            Acesso Pessoal
          </span>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual do Usuário</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder="********"
              />
            </div>
          </div>

          {pwdSuccess && (
            <p className="text-green-500 font-bold text-xs uppercase tracking-wider bg-green-500/10 p-4 border border-green-500/20 rounded-2xl">
              ✅ {pwdSuccess}
            </p>
          )}
          {pwdError && (
            <p className="text-red-500 font-bold text-xs uppercase tracking-wider bg-red-500/10 p-4 border border-red-500/20 rounded-2xl">
              ⚠️ {pwdError}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit"
              disabled={pwdLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Shield size={18} /> {pwdLoading ? 'Atualizando...' : 'Alterar Minha Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* 🥋 EXCLUSÃO SEGURA DE CONTA & LIMPEZA SUPREMA */}
      <div className="bg-red-50 dark:bg-red-950/15 rounded-[2rem] sm:rounded-[2.5rem] border border-red-200 dark:border-red-900/30 overflow-hidden transition-all shadow-md">
        <div className="p-6 sm:p-8 border-b border-red-200/50 dark:border-red-900/40 bg-red-100/10 dark:bg-red-900/10 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-[0.15em] flex items-center gap-3">
            <ShieldCheck size={18} /> Gerenciamento da Academia & Conta
          </h3>
          <span className="text-[8px] font-black text-red-600 bg-red-100 px-3 py-1 rounded-full uppercase tracking-widest">
            Zona de Segurança
          </span>
        </div>
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-left space-y-2">
            <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tight">Exclusão Definitiva de Conta</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
              Deseja remover sua academia e limpar todos os dados do tatame? Esta ação realiza a desativação imediata com exclusão em cascata irrecuperável de alunos, presenças, pagamentos e todos os dados fiscais e de faturamento associados no Neon PostgreSQL para aliviar o sistema.
            </p>
          </div>

          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Protocolo de Confirmação Dupla SYSBJJ</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-normal">
                Nota: A conta principal do Sensei Geral "pedro.honorio@gm.rio" é protegida como root do ecossistema e nunca poderá ser excluída.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="button"
              onClick={() => {
                const targetEmail = user?.email || authData.email || '';
                if (targetEmail.toLowerCase() === 'pedro.honorio@gm.rio') {
                  alert('🥋 RETORNO DO DOJO: Sensei Geral Pedro Honório, você é o administrador master do ecossistema. Suas credenciais são de segurança vitalícia e não podem ser excluídas!');
                  return;
                }
                setIsDeleteModalOpen(true);
              }}
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Excluir Minha Conta
            </button>
          </div>
        </div>
      </div>

      {/* 🥋 EXCLUSÃO DE CONTA: CONFIRMAÇÃO DUPLA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-250">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center shadow-inner">
              <Trash2 size={32} />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-full border border-red-200/30">
                Aviso Supremo do Dojo
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
                Confirmar Exclusão de Academia?
              </h3>
              <p className="text-red-600 dark:text-red-400 font-extrabold text-[12px] uppercase tracking-wider leading-snug bg-red-50 dark:bg-red-950/25 p-4 rounded-2xl border border-red-200/40">
                "ATENÇÃO:<br />Esta ação removerá permanentemente todos os dados da academia."
              </p>
            </div>

            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-normal">
              Todos os alunos, presenças, mensalidades, planos PIX e históricos fiscais serão expurgados para aliviar o banco Neon instantaneamente.
            </p>

            {deleteError && (
              <p className="text-red-600 text-[11px] font-black uppercase">{deleteError}</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="py-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
                className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
