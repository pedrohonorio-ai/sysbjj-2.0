import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json" with { type: "json" };
import enUS from "./locales/en-US.json" with { type: "json" };
import esES from "./locales/es-ES.json" with { type: "json" };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        translation: ptBR,
      },
      "pt": {
        translation: ptBR,
      },
      "en": {
        translation: enUS,
      },
      "es": {
        translation: esES,
      },
    },

    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "en",
      "es"
    ],

    load: "currentOnly",

    nonExplicitSupportedLngs: false,

    debug: false,

    returnNull: false,
    returnEmptyString: false,

    saveMissing: false,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    parseMissingKeyHandler: (key: string) => {
      const fallbackMap: Record<string, string> = {
        "dashboard.recentActivities": "Atividades Recentes",
        "dashboard.syncStatus": "Status de Sincronização",
        "dashboard.totalStudents": "Total de Alunos",
        "dashboard.financial": "Financeiro",
        "dashboard.attendance": "Presença",
        "settings.language": "Idioma",
        "settings.theme": "Tema",
        "subscription.currentPlan": "Plano Atual",
        "subscription.upgrade": "Atualizar Plano"
      };

      return fallbackMap[key] || "Informação";
    },

    detection: {
      order: [
        "localStorage",
        "navigator",
        "htmlTag"
      ],

      caches: ["localStorage"],

      lookupLocalStorage: "SYSBJJ_LANG",
    },
  });

export default i18n;
