import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // Inicializa i18next

// Fix de refresh em rotas profundas quando o host redireciona 404 -> /?/<rota>
// (padrão comum em SPAs). Isso precisa rodar ANTES do React Router montar.
(() => {
  const l = window.location;
  // Ex: /?/faturas&foo=1  => /faturas?foo=1
  if (l.search.startsWith("?/") || l.search.startsWith("?%2F")) {
    const normalized = decodeURIComponent(l.search);
    if (normalized.startsWith("?/")) {
      const decoded = normalized
        .slice(1)
        .split("&")
        .map((s) => s.replace(/~and~/g, "&"))
        .join("?");

      window.history.replaceState(null, "", decoded + l.hash);
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
