import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBR from "./locales/pt-BR";

export const languages = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": ptBR,
    },
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
