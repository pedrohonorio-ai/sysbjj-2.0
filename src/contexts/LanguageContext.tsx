
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage } from '../types.js';
import i18n from '../i18n/index.js';
import { tSafe } from '../utils/t.js';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, defaultValueOrData?: string | Record<string, string | number>) => string;
  tObj: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en') return AppLanguage.ENGLISH_US;
    if (saved === 'es') return AppLanguage.SPANISH_ES;
    if (saved === 'ja') return AppLanguage.JAPANESE;
    if (saved === 'ru') return AppLanguage.RUSSIAN;
    if (saved === 'zh') return AppLanguage.CHINESE;
    return AppLanguage.PORTUGUESE_BR;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    localStorage.setItem('oss_language', language);
    
    const i18nLang = language === AppLanguage.PORTUGUESE_BR ? 'pt' : language;
    if (i18n.language !== i18nLang) {
      i18n.changeLanguage(i18nLang);
    }
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    localStorage.setItem('oss_language', lang);
    const i18nLang = lang === AppLanguage.PORTUGUESE_BR ? 'pt' : lang;
    if (i18n.language !== i18nLang) {
      i18n.changeLanguage(i18nLang);
    }
  };

  const t = (key: string, defaultValueOrData?: string | Record<string, string | number>): string => {
    const fallback = typeof defaultValueOrData === 'string' ? defaultValueOrData : undefined;
    
    if (defaultValueOrData && typeof defaultValueOrData === 'object') {
      const value = i18n.t(key, defaultValueOrData);
      if (value && value !== key) {
        return tSafe(key, value);
      }
    }
    
    return tSafe(key, fallback);
  };

  const tObj = (key: string): any => {
    const value = i18n.t(key, { returnObjects: true });
    return value && typeof value === 'object' ? value : {};
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tObj }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const useAppTranslation = () => {
  return useTranslation();
};

