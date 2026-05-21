
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
    const saved = (localStorage.getItem('language') || localStorage.getItem('oss_language')) as AppLanguage;
    const validLangs = [AppLanguage.PORTUGUESE_BR, AppLanguage.ENGLISH_US, AppLanguage.SPANISH_ES];
    if (saved && validLangs.includes(saved)) {
      return saved;
    }
    return AppLanguage.PORTUGUESE_BR;
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || localStorage.getItem('oss_language') || 'pt';
    const validLangs = ['pt', 'en', 'es'];
    const activeLang = validLangs.includes(savedLanguage) ? savedLanguage : 'pt';
    
    // Force PT-BR as priority if invalid or general cleanup
    localStorage.setItem('language', activeLang);
    localStorage.setItem('oss_language', activeLang);
    
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    const validLangs = [AppLanguage.PORTUGUESE_BR, AppLanguage.ENGLISH_US, AppLanguage.SPANISH_ES];
    const targetLang = validLangs.includes(lang) ? lang : AppLanguage.PORTUGUESE_BR;
    
    setLanguageState(targetLang);
    localStorage.setItem('language', targetLang);
    localStorage.setItem('oss_language', targetLang);
    i18n.changeLanguage(targetLang);
  };

  const t = (key: string, defaultValueOrData?: string | Record<string, string | number>): string => {
    const fallback = typeof defaultValueOrData === 'string' ? defaultValueOrData : undefined;
    const value = tSafe(key, fallback);
    
    if (defaultValueOrData && typeof defaultValueOrData === 'object') {
      return i18n.t(key, defaultValueOrData) || value;
    }
    return value;
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

