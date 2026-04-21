
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { AppLanguage } from '../types';
import { Check, Globe } from 'lucide-react';

const languages = [
  { code: AppLanguage.PORTUGUESE_BR, name: 'Português', native: 'Português (Brasil)', flag: '🇧🇷' },
  { code: AppLanguage.ENGLISH_US, name: 'English', native: 'English (US)', flag: '🇺🇸' },
  { code: AppLanguage.SPANISH_ES, name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: AppLanguage.JAPANESE, name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: AppLanguage.RUSSIAN, name: 'Russian', native: 'Русский', flag: '🇷🇺' }
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
          <h1 className="text-2xl font-bold dark:text-white">{t('common.settings')}</h1>
          <p className="text-slate-500">{t('common.settings')} • Language Selection</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl">{lang.flag}</span>
                  <div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                      {lang.name}
                    </p>
                    <p className="text-sm text-slate-500">{lang.native}</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 group-hover:border-blue-300'
                }`}>
                  {isSelected && <Check size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
          Changing the language will update the entire interface and AI Coach reports.
        </p>
      </div>
    </div>
  );
};

export default LanguageSelection;
