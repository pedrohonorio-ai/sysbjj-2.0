
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage } from '../types.js';
import i18n from '../i18n/index.js';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, defaultValueOrData?: string | Record<string, string | number>) => string;
  tObj: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('oss_language') as AppLanguage;
    return saved || AppLanguage.PORTUGUESE_BR;
  });

  useEffect(() => {
    const currentLang = language === 'pt' ? 'pt-BR' : language;
    if (i18n.language !== currentLang) {
      i18n.changeLanguage(currentLang);
    }
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('oss_language', lang);
    const i18nLang = lang === 'pt' ? 'pt-BR' : lang;
    i18n.changeLanguage(i18nLang);
  };

  const t = (key: string, defaultValueOrData?: string | Record<string, string | number>): string => {
    if (typeof defaultValueOrData === 'string') {
      return i18n.t(key, { defaultValue: defaultValueOrData }) || defaultValueOrData;
    }
    return i18n.t(key, defaultValueOrData) || key;
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

