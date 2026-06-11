import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json" with { type: "json" };
import enUS from "./locales/en-US.json" with { type: "json" };
import esES from "./locales/es-ES.json" with { type: "json" };

const getTranslation = (mod: any) => {
  if (!mod) return {};
  return (mod.default ? mod.default : mod) || {};
};

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
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    supportedLngs: ["pt-BR", "pt", "en-US", "en", "es-ES", "es"],
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
