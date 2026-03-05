import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function InstitucionalFooter() {
  return (
    <footer className="bg-card border-t border-border py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl gradient-luz-mina flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                Maranata
              </span>
            </div>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
              Plataforma completa de gestão escolar. Simplifique a administração,
              controle suas finanças e foque no que realmente importa: a educação.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/reforcomaranatabhs/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
              <li><a href="#diferenciais" className="hover:text-foreground transition-colors">Diferenciais</a></li>
              <li><a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a></li>
              <li><a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contato@maranata.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>(00) 0000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sistema Maranata. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Victor Mendys
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
