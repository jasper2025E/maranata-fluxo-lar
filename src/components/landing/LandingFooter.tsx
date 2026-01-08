import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingFooterProps {
  config: LandingConfig;
}

export function LandingFooter({ config }: LandingFooterProps) {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {config.escola.logo_url ? (
                <img 
                  src={config.escola.logo_url} 
                  alt={config.escola.nome}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="p-2 bg-primary rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">{config.escola.nome}</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema educacional comprometido com a excelência no ensino 
              e o desenvolvimento integral de cada aluno.
            </p>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contato</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {config.escola.telefone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${config.escola.telefone}`} className="hover:text-primary transition-colors">
                    {config.escola.telefone}
                  </a>
                </li>
              )}
              {config.escola.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${config.escola.email}`} className="hover:text-primary transition-colors">
                    {config.escola.email}
                  </a>
                </li>
              )}
              {config.escola.endereco && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span>{config.escola.endereco}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#sobre" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">
                  Nossos Planos
                </a>
              </li>
              <li>
                <a href="#inscricao" className="text-muted-foreground hover:text-primary transition-colors">
                  Inscrição
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {config.escola.nome}. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-xs">
            Desenvolvido com tecnologia Maranata
          </p>
        </div>
      </div>
    </footer>
  );
}
