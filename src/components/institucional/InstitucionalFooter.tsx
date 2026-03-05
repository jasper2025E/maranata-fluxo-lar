import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function InstitucionalFooter() {
  return (
    <footer className="bg-[#0d47a1] text-white pt-16 pb-6">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <img src="/escola-logo.png" alt="Maranata" className="h-[60px] w-auto" />
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              Há mais de 12 anos transformando a educação com amor, dedicação e metodologia comprovada. 
              Cada aluno é único e merece atenção especial.
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
              {["Reforço Escolar", "Preparatório ENEM", "Aulas de Inglês", "Alfabetização"].map((item) => (
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
              {["Sobre Nós", "Nossa Equipe", "Depoimentos"].map((item) => (
                <li key={item}>
                  <a href="#depoimentos" className="text-white/70 hover:text-white hover:pl-1.5 transition-all inline-flex items-center gap-2 before:content-['→'] before:opacity-0 before:text-[#f57c00] before:transition-opacity hover:before:opacity-100">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h5 className="text-[#ffc107] text-lg font-bold mb-6 font-[Quicksand]">Contato</h5>
            <ul className="space-y-3">
              {["Agende uma Visita", "Fale Conosco", "Localização"].map((item) => (
                <li key={item}>
                  <a href="#contato" className="text-white/70 hover:text-white hover:pl-1.5 transition-all inline-flex items-center gap-2 before:content-['→'] before:opacity-0 before:text-[#f57c00] before:transition-opacity hover:before:opacity-100">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Reforço Escolar Maranata. Todos os direitos reservados.</p>
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
