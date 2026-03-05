import { Instagram, Phone, Mail, MapPin } from "lucide-react";

export function InstitucionalFooter() {
  return (
    <footer className="bg-[#0d47a1] text-white pt-16 pb-6">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <img src="/escola-logo.png" alt="Reforço Maranata" className="h-[60px] w-auto" />
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              Reforço escolar de qualidade em Barreirinhas - MA. 
              Ajudamos crianças e adolescentes a superarem dificuldades 
              escolares com dedicação e carinho.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/reforcomaranatabhs/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-[45px] h-[45px] bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#f57c00] hover:-translate-y-1 transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h5 className="text-[#ffc107] text-lg font-bold mb-6 font-[Quicksand]">Serviços</h5>
            <ul className="space-y-3">
              {["Reforço em Português", "Reforço em Matemática", "Alfabetização", "Auxílio nas Tarefas", "Preparação para Provas"].map((item) => (
                <li key={item}>
                  <a href="#servicos" className="text-white/70 hover:text-white hover:pl-1.5 transition-all inline-flex items-center gap-2 before:content-['→'] before:opacity-0 before:text-[#f57c00] before:transition-opacity hover:before:opacity-100">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h5 className="text-[#ffc107] text-lg font-bold mb-6 font-[Quicksand]">Institucional</h5>
            <ul className="space-y-3">
              {[
                { label: "Metodologia", href: "#metodologia" },
                { label: "Depoimentos", href: "#depoimentos" },
                { label: "Contato", href: "#contato" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-white/70 hover:text-white hover:pl-1.5 transition-all inline-flex items-center gap-2 before:content-['→'] before:opacity-0 before:text-[#f57c00] before:transition-opacity hover:before:opacity-100">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h5 className="text-[#ffc107] text-lg font-bold mb-6 font-[Quicksand]">Contato</h5>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-white/70">
                <Phone className="h-4 w-4 text-[#ffc107] flex-shrink-0" />
                <a href="tel:+559898828634" className="hover:text-white transition-colors">(98) 98828-6034</a>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Mail className="h-4 w-4 text-[#ffc107] flex-shrink-0" />
                <a href="mailto:jn.ney@hotmail.com" className="hover:text-white transition-colors">jn.ney@hotmail.com</a>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <MapPin className="h-4 w-4 text-[#ffc107] flex-shrink-0" />
                <span>Barreirinhas - MA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Reforço Maranata. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffc107] hover:underline"
            >
              Victor Mendys
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
