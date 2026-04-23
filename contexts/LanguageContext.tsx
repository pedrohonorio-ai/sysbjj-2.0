
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppLanguage } from '../types';
import { translations } from '../locales';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved && Object.values(AppLanguage).includes(saved as AppLanguage)) {
      return saved as AppLanguage;
    }
    const systemLang = navigator.language.split('-')[0];
    const found = Object.values(AppLanguage).find(l => l === systemLang);
    return (found as AppLanguage) || AppLanguage.ENGLISH_US;
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (path: string): string => {
    if (!path) return '';
    const keys = path.split('.');
    let result: any = translations[language];
    
    for (const key of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        result = result[key];
      } else {
        // Fallback to English if translation is missing in current language
        if (language !== AppLanguage.ENGLISH_US) {
           let fallbackResult: any = translations[AppLanguage.ENGLISH_US];
           for (const fallbackKey of keys) {
             if (fallbackResult && Object.prototype.hasOwnProperty.call(fallbackResult, fallbackKey)) {
               fallbackResult = fallbackResult[fallbackKey];
             } else {
               return path;
             }
           }
           return typeof fallbackResult === 'string' ? fallbackResult : path;
        }
        return path;
      }
    }
    return typeof result === 'string' ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
