import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json' with { type: 'json' };
import enUS from './locales/en-US.json' with { type: 'json' };
import esES from './locales/es-ES.json' with { type: 'json' };

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: ptBR
      },
      'pt-BR': {
        translation: ptBR
      },
      en: {
        translation: enUS
      },
      'en-US': {
        translation: enUS
      },
      es: {
        translation: esES
      },
      'es-ES': {
        translation: esES
      }
    },

    lng: localStorage.getItem('language') || localStorage.getItem('oss_language') || 'pt',

    fallbackLng: 'pt',

    supportedLngs: ['pt', 'pt-BR', 'en', 'en-US', 'es', 'es-ES'],

    interpolation: {
      escapeValue: false
    },

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    debug: false
  });

export default i18n;
