import { Instagram, Phone, Mail, MapPin } from "lucide-react";

export function InstitucionalFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img src="/escola-logo.png" alt="Reforço Maranata" className="h-12 w-auto mb-4" />
            <p className="text-sm leading-relaxed">
              Reforço escolar de qualidade em Barreirinhas&nbsp;–&nbsp;MA.
            </p>
          </div>

          {/* Serviços */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Serviços</h5>
            <ul className="space-y-2 text-sm">
              {["Português", "Matemática", "Ciências", "Alfabetização", "Tarefas"].map((item) => (
                <li key={item}>
                  <a href="#servicos" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Institucional</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#metodologia" className="hover:text-white transition-colors">Sobre</a></li>
              <li><a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a></li>
              <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4">Contato</h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <a href="tel:+559898828634" className="hover:text-white transition-colors">(98) 98828-6034</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <a href="mailto:jn.ney@hotmail.com" className="hover:text-white transition-colors">jn.ney@hotmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Barreirinhas – MA</span>
              </li>
            </ul>
            <div className="mt-4">
              <a
                href="https://www.instagram.com/reforcomaranatabhs/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm hover:text-white transition-colors"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Reforço Maranata. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Victor Mendys
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
