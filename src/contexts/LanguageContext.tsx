
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage } from '../types.js';
import { translations } from '../locales.js';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, data?: Record<string, string | number>) => string;
  tObj: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('oss_language') as AppLanguage) || AppLanguage.PORTUGUESE_BR;
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('oss_language', lang);
  };

  const t = (key: string, data?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English if key not found in current language
        let fallback = translations[AppLanguage.ENGLISH_US];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key; // Return the key itself as last resort
          }
        }
        value = fallback;
        break;
      }
    }

    if (typeof value !== 'string') return key;

    if (data) {
      let result = value;
      Object.entries(data).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      });
      return result;
    }

    return value;
  };

  const tObj = (key: string): any => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return {};
      }
    }
    return value;
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
