import { Instagram, Phone, Mail, MapPin } from "lucide-react";

export function InstitucionalFooter() {
  return (
    <footer className="text-white pt-16 pb-6" style={{ background: "#0d1b2a" }}>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/escola-logo-transparent-real.png?v=3" alt="Reforço Maranata" className="h-12 w-auto" />
              <h4
                className="text-2xl font-semibold text-white"
                style={{ fontFamily: "'Crimson Text', serif" }}
              >
                Reforço Maranata
              </h4>
            </div>
            <p className="text-white/60 leading-relaxed mb-5 text-sm">
              Reforço escolar de qualidade em Barreirinhas&nbsp;–&nbsp;MA.
              Ajudamos crianças e adolescentes a superarem dificuldades
              escolares com dedicação e carinho.
            </p>
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/60 transition-colors text-sm"
              style={{ color: undefined }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--inst-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            >
              <Instagram className="h-4 w-4" />
              @reforcomaranatabhs
            </a>
          </div>

          {/* Serviços */}
          <div>
            <h5
              className="text-sm font-semibold uppercase tracking-[2px] mb-5"
              style={{ color: "var(--inst-secondary)" }}
            >
              Serviços
            </h5>
            <ul className="space-y-2 text-sm">
              {["Português", "Matemática", "Ciências", "Alfabetização", "Preparação para Provas"].map((item) => (
                <li key={item}>
                  <a href="#servicos" className="text-white/60 hover:pl-1 transition-all inline-block" style={{}} onMouseEnter={(e) => e.currentTarget.style.color = "var(--inst-secondary)"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h5
              className="text-sm font-semibold uppercase tracking-[2px] mb-5"
              style={{ color: "var(--inst-secondary)" }}
            >
              Institucional
            </h5>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Sobre Nós", href: "#sobre" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "Contato", href: "#contato" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-white/60 hover:pl-1 transition-all inline-block" onMouseEnter={(e) => e.currentTarget.style.color = "var(--inst-secondary)"} onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h5
              className="text-sm font-semibold uppercase tracking-[2px] mb-5"
              style={{ color: "var(--inst-secondary)" }}
            >
              Contato
            </h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/60">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <a href="tel:+559898828634" className="hover:text-white transition-colors">(98) 98828-6034</a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <a href="mailto:jn.ney@hotmail.com" className="hover:text-white transition-colors">jn.ney@hotmail.com</a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Barreirinhas – MA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-white/40 text-sm">
          <p>© {new Date().getFullYear()} Reforço Maranata. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--inst-secondary)" }}
              className="hover:underline"
            >
              Victor Mendys
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
