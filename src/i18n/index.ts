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
      "en-US": {
        translation: enUS,
      },
      "es-ES": {
        translation: esES,
      },
    },

    lng: "pt-BR",
    fallbackLng: "pt-BR",

    supportedLngs: [
      "pt-BR",
      "en-US",
      "es-ES"
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
