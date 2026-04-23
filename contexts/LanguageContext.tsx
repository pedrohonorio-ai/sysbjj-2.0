
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppLanguage } from '../types';
import { translations } from '../locales';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, variables?: Record<string, any>) => string;
  tObj: (key: string) => any;
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

  const getTranslation = (path: string, lang: AppLanguage): any => {
    if (!path) return undefined;
    const keys = path.split('.');
    let result: any = translations[lang];
    
    for (const key of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return result;
  };

  const t = (path: string, variables?: Record<string, any>): string => {
    let result = getTranslation(path, language);
    
    // Fallback to English
    if ((result === undefined || typeof result !== 'string') && language !== AppLanguage.ENGLISH_US) {
      result = getTranslation(path, AppLanguage.ENGLISH_US);
    }
    
    if (result === undefined || typeof result !== 'string') return path;

    if (variables) {
      Object.keys(variables).forEach(key => {
        result = result.replace(`{{${key}}}`, String(variables[key]));
      });
    }

    return result;
  };

  const tObj = (path: string): any => {
    const result = getTranslation(path, language);
    if (result !== undefined) return result;

    // Fallback to English
    if (language !== AppLanguage.ENGLISH_US) {
      const fallback = getTranslation(path, AppLanguage.ENGLISH_US);
      if (fallback !== undefined) return fallback;
    }

    return null;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tObj }}>
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
