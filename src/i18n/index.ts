import i18n from "i18next"; import { initReactI18next } from "react-i18next"; import ptBR from "./locales/pt-BR.json" with { type: "json" }; import enUS from "./locales/en-US.json" with { type: "json" }; i18n .use(initReactI18next) .init({ resources: { "pt-BR": { translation: ptBR }, "en-US": { translation: enUS } }, lng: "pt-BR", fallbackLng: "pt-BR", interpolation: { escapeValue: false } }); export default i18n;

// 🥋 SYSBJJ 2.0 - DETERMINISTIC i18n CONFIGURATION
// Prioritiza o português do Brasil (pt-BR) de forma absoluta, desativando detecção randômica de idioma do navegador.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        translation: getTranslation(ptBR),
      },
      "pt": {
        translation: getTranslation(ptBR),
      },
      "en-US": {
        translation: getTranslation(enUS),
      },
      "en": {
        translation: getTranslation(enUS),
      },
      "es-ES": {
        translation: getTranslation(esES),
      },
      "es": {
        translation: getTranslation(esES),
      },
    },

    // Força português brasileiro como padrão absoluto para o dojo
    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "pt",
      "en-US",
      "en",
      "es-ES",
      "es"
    ],

    load: "currentOnly",

    nonExplicitSupportedLngs: false,

    debug: false,

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },

    react: {
      useSuspense: false,
    },

    parseMissingKeyHandler: (key: string) => {
      // Formata amigavelmente a chave faltante
      const formatFriendly = (k: string) => {
        return k
          .split(".")
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase()) || k;
      };

      const map: Record<string, string> = {
        "dashboard.recentActivities": "Atividades Recentes",
        "dashboard.syncStatus": "Status de Sincronização",
        "subscription.currentPlan": "Plano Atual",
        "settings.security": "Segurança",
        "settings.language": "Idioma",
        "belt": "Faixa",
        "stripes": "Graus",
      };

      return map[key] || formatFriendly(key);
    },
  });

export default i18n;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
   with { type: "json" };
import enUS 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts) with { type: "json" };
import esES from "./locales/es-ES.json" with { type: "json" };

// Helper to Safely Unwrap default JSON imports under ESM/CommonJS/Vite Bundling
const getTranslation = (mod: any) => {
  if (!mod) return {};
  return (mod.default ? mod.default : mod) || {};
};

// 🥋 SYSBJJ 2.0 - DETERMINISTIC i18n CONFIGURATION
// Prioritiza o português do Brasil (pt-BR) de forma absoluta, desativando detecção randômica de idioma do navegador.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        translation: getTranslation(ptBR),
      },
      "pt": {
        translation: getTranslation(ptBR),
      },
      "en-US": {
        translation: getTranslation(enUS),
      },
      "en": {
        translation: getTranslation(enUS),
      },
      "es-ES": {
        translation: getTranslation(esES),
      },
      "es": {
        translation: getTranslation(esES),
      },
    },

    // Força português brasileiro como padrão absoluto para o dojo
    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "pt",
      "en-US",
      "en",
      "es-ES",
      "es"
    ],

    load: "currentOnly",

    nonExplicitSupportedLngs: false,

    debug: false,

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },

    react: {
      useSuspense: false,
    },

    parseMissingKeyHandler: (key: string) => {
      // Formata amigavelmente a chave faltante
      const formatFriendly = (k: string) => {
        return k
          .split(".")
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase()) || k;
      };

      const map: Record<string, string> = {
        "dashboard.recentActivities": "Atividades Recentes",
        "dashboard.syncStatus": "Status de Sincronização",
        "subscription.currentPlan": "Plano Atual",
        "settings.security": "Segurança",
        "settings.language": "Idioma",
        "belt": "Faixa",
        "stripes": "Graus",
      };

      return map[key] || formatFriendly(key);
    },
  });

export default i18n;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
   with { type: "json" };
import esES 
    param($m)
    if ($m.Groups[1].Value -match '\.(js|ts) with { type: "json" };

// Helper to Safely Unwrap default JSON imports under ESM/CommonJS/Vite Bundling
const getTranslation = (mod: any) => {
  if (!mod) return {};
  return (mod.default ? mod.default : mod) || {};
};

// 🥋 SYSBJJ 2.0 - DETERMINISTIC i18n CONFIGURATION
// Prioritiza o português do Brasil (pt-BR) de forma absoluta, desativando detecção randômica de idioma do navegador.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        translation: getTranslation(ptBR),
      },
      "pt": {
        translation: getTranslation(ptBR),
      },
      "en-US": {
        translation: getTranslation(enUS),
      },
      "en": {
        translation: getTranslation(enUS),
      },
      "es-ES": {
        translation: getTranslation(esES),
      },
      "es": {
        translation: getTranslation(esES),
      },
    },

    // Força português brasileiro como padrão absoluto para o dojo
    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "pt",
      "en-US",
      "en",
      "es-ES",
      "es"
    ],

    load: "currentOnly",

    nonExplicitSupportedLngs: false,

    debug: false,

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },

    react: {
      useSuspense: false,
    },

    parseMissingKeyHandler: (key: string) => {
      // Formata amigavelmente a chave faltante
      const formatFriendly = (k: string) => {
        return k
          .split(".")
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase()) || k;
      };

      const map: Record<string, string> = {
        "dashboard.recentActivities": "Atividades Recentes",
        "dashboard.syncStatus": "Status de Sincronização",
        "subscription.currentPlan": "Plano Atual",
        "settings.security": "Segurança",
        "settings.language": "Idioma",
        "belt": "Faixa",
        "stripes": "Graus",
      };

      return map[key] || formatFriendly(key);
    },
  });

export default i18n;
) {
      $m.Value
    } else {
      $m.Groups[1].Value + '.js' + $m.Groups[2].Value
    }
   with { type: "json" };

// Helper to Safely Unwrap default JSON imports under ESM/CommonJS/Vite Bundling
const getTranslation = (mod: any) => {
  if (!mod) return {};
  return (mod.default ? mod.default : mod) || {};
};

// 🥋 SYSBJJ 2.0 - DETERMINISTIC i18n CONFIGURATION
// Prioritiza o português do Brasil (pt-BR) de forma absoluta, desativando detecção randômica de idioma do navegador.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        translation: getTranslation(ptBR),
      },
      "pt": {
        translation: getTranslation(ptBR),
      },
      "en-US": {
        translation: getTranslation(enUS),
      },
      "en": {
        translation: getTranslation(enUS),
      },
      "es-ES": {
        translation: getTranslation(esES),
      },
      "es": {
        translation: getTranslation(esES),
      },
    },

    // Força português brasileiro como padrão absoluto para o dojo
    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "pt",
      "en-US",
      "en",
      "es-ES",
      "es"
    ],

    load: "currentOnly",

    nonExplicitSupportedLngs: false,

    debug: false,

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },

    react: {
      useSuspense: false,
    },

    parseMissingKeyHandler: (key: string) => {
      // Formata amigavelmente a chave faltante
      const formatFriendly = (k: string) => {
        return k
          .split(".")
          .pop()
          ?.replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (s) => s.toUpperCase()) || k;
      };

      const map: Record<string, string> = {
        "dashboard.recentActivities": "Atividades Recentes",
        "dashboard.syncStatus": "Status de Sincronização",
        "subscription.currentPlan": "Plano Atual",
        "settings.security": "Segurança",
        "settings.language": "Idioma",
        "belt": "Faixa",
        "stripes": "Graus",
      };

      return map[key] || formatFriendly(key);
    },
  });

export default i18n;

