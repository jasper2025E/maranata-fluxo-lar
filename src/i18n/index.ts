import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";

export const languages = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": ptBR,
      en: en,
      es: es,
      fr: fr,
      de: de,
    },
    fallbackLng: "pt-BR",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// DEV diagnostics: log active language and missing translation keys
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info("[i18n] active:", i18n.language, "resolved:", i18n.resolvedLanguage, "languages:", i18n.languages);

  const originalT = i18n.t.bind(i18n);
  // Wrap t() to warn when the key is returned as-is (missing translation)
  // NOTE: keep dev-only to avoid console noise in production.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (i18n as any).t = (key: any, ...rest: any[]) => {
    const result = originalT(key as any, ...rest);
    if (typeof key === "string" && result === key) {
      // eslint-disable-next-line no-console
      console.warn("[i18n] missing key:", key, "lang:", i18n.language);
    }
    return result;
  };
}

export default i18n;
