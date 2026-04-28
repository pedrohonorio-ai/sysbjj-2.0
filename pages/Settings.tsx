
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useProfile } from '../contexts/ProfileContext';
import { useData } from '../contexts/DataContext';
import { AppLanguage } from '../types';
import { Check, Globe, User, Save, Shield, Database, Download, Upload, Trash2, CreditCard, Mail, BookOpen, MapPin } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({
    ...profile,
    pixKey: profile.pixKey || '',
    pixName: profile.pixName || '',
    pixCity: profile.pixCity || ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

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
      }, (error) => {
        alert("Erro ao obter localização: " + error.message);
        setIsCapturing(false);
      }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } else {
      alert("Geolocalização não é suportada por este navegador.");
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
            <Globe size={18} className="text-blue-600" /> Identidade Visual
          </h3>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-700 transition-all">
            <Save size={14} /> Salvar
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo da Academia</label>
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
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escolher nos arquivos</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({ ...formData, logoUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    className="w-full text-[9px] font-bold text-red-500 uppercase tracking-tighter"
                  >
                    Remover Logo
                  </button>
                </div>
              </div>
            </div>

            {/* Background Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fundo do Sistema (Background)</label>
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
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregar Fundo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({ ...formData, backgroundImageUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => setFormData({ ...formData, backgroundImageUrl: '' })}
                    className="w-full text-[9px] font-bold text-red-500 uppercase tracking-tighter"
                  >
                    Remover Fundo
                  </button>
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
                value={formData.latitude || ''} 
                onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder={t('settings.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.longitude')}</label>
              <input 
                type="number" 
                step="any"
                value={formData.longitude || ''} 
                onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})} 
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-bold" 
                placeholder={t('settings.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.radius')}</label>
              <input 
                type="number" 
                value={formData.geofenceRadius || ''} 
                onChange={e => setFormData({...formData, geofenceRadius: parseInt(e.target.value)})} 
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
              <span className="text-blue-400 font-bold">dashfire@gmail.com</span>
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
    </div>
  );
};

export default Settings;
