import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptCommon from './locales/pt-BR/common.json' with { type: 'json' };
import ptDashboard from './locales/pt-BR/dashboard.json' with { type: 'json' };
import ptStudents from './locales/pt-BR/students.json' with { type: 'json' };
import ptPayments from './locales/pt-BR/payments.json' with { type: 'json' };
import ptAuth from './locales/pt-BR/auth.json' with { type: 'json' };
import ptSettings from './locales/pt-BR/settings.json' with { type: 'json' };
import ptSubscription from './locales/pt-BR/subscription.json' with { type: 'json' };
import ptErrors from './locales/pt-BR/errors.json' with { type: 'json' };

import enCommon from './locales/en/common.json' with { type: 'json' };
import enDashboard from './locales/en/dashboard.json' with { type: 'json' };
import enStudents from './locales/en/students.json' with { type: 'json' };
import enPayments from './locales/en/payments.json' with { type: 'json' };
import enAuth from './locales/en/auth.json' with { type: 'json' };
import enSettings from './locales/en/settings.json' with { type: 'json' };
import enSubscription from './locales/en/subscription.json' with { type: 'json' };
import enErrors from './locales/en/errors.json' with { type: 'json' };

import esCommon from './locales/es/common.json' with { type: 'json' };
import esDashboard from './locales/es/dashboard.json' with { type: 'json' };
import esStudents from './locales/es/students.json' with { type: 'json' };
import esPayments from './locales/es/payments.json' with { type: 'json' };
import esAuth from './locales/es/auth.json' with { type: 'json' };
import esSettings from './locales/es/settings.json' with { type: 'json' };
import esSubscription from './locales/es/subscription.json' with { type: 'json' };
import esErrors from './locales/es/errors.json' with { type: 'json' };

const resources = {
  'pt-BR': {
    common: ptCommon,
    dashboard: ptDashboard,
    students: ptStudents,
    payments: ptPayments,
    auth: ptAuth,
    settings: ptSettings,
    subscription: ptSubscription,
    errors: ptErrors
  },
  'en': {
    common: enCommon,
    dashboard: enDashboard,
    students: enStudents,
    payments: enPayments,
    auth: enAuth,
    settings: enSettings,
    subscription: enSubscription,
    errors: enErrors
  },
  'es': {
    common: esCommon,
    dashboard: esDashboard,
    students: esStudents,
    payments: esPayments,
    auth: esAuth,
    settings: esSettings,
    subscription: esSubscription,
    errors: esErrors
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en', 'es'],
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    cleanCode: true,
    lowerCaseLng: false,
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'students', 'payments', 'auth', 'settings', 'subscription', 'errors'],
    fallbackNS: ['common'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
