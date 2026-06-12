
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext.js';
import { AppLanguage } from '../types.js';
import { Check, Globe } from 'lucide-react';

const languages = [
  { code: AppLanguage.PORTUGUESE_BR, name: 'Português', native: 'Português (Brasil)', flag: '🇧🇷', active: true, reason: 'Idioma padrão e recomendado do ecossistema SYSBJJ' },
  { code: AppLanguage.ENGLISH_US, name: 'English', native: 'English (US)', flag: '🇺🇸', active: true, reason: 'English localization for international students' },
  { code: AppLanguage.SPANISH_ES, name: 'Spanish', native: 'Español', flag: '🇪🇸', active: true, reason: 'Traducción oficial para practicantes de habla hispana' },
  { code: AppLanguage.JAPANESE, name: '日本語', native: '日本語', flag: '🇯🇵', active: true, reason: '日本国内の生徒および道場向け日本語版' },
  { code: AppLanguage.RUSSIAN, name: 'Русский', native: 'Русский', flag: '🇷🇺', active: true, reason: 'Русская локализация для додзё' },
  { code: AppLanguage.CHINESE, name: '中文', native: '简体中文', flag: '🇨🇳', active: true, reason: '为中文武道及道场提供的汉化翻译' }
];

const LanguageSelection: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
          <Globe size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Idioma do Sistema</h1>
          <p className="text-slate-500">Configurações • Diretriz de Idioma</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {languages.map((lang) => {
            const isSelected = lang.active && language === lang.code;
            return (
              <button
                key={lang.code}
                disabled={!lang.active}
                onClick={() => {
                  if (lang.active) {
                    setLanguage(lang.code);
                  }
                }}
                className={`w-full p-6 flex items-center justify-between transition-colors text-left group ${
                  lang.active 
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/10'
                }`}
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl filter grayscale-[40%]">{lang.flag}</span>
                  <div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                      {lang.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{lang.reason}</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'
                }`}>
                  {isSelected && <Check size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-[10px]">
          🥋 DIRETRIZ SENSEI:
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          De acordo com as diretrizes do Master Sensei do SYSBJJ 2.0, o sistema foi padronizado e otimizado integralmente para o Português (Brasil). Isso garante que toda a terminologia técnica, de graduação, chamada, controle de mensalidades e fluxo financeiro dos dojos funcione perfeitamente sem falhas de tradução. OSS!
        </p>
      </div>
    </div>
  );
};

export default LanguageSelection;
