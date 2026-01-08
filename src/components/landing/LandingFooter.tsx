import { GraduationCap, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingFooterProps {
  config: LandingConfig;
}

export function LandingFooter({ config }: LandingFooterProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const footerLinks = {
    institucional: [
      { label: "Sobre Nós", id: "sobre" },
      { label: "Diferenciais", id: "diferenciais" },
      { label: "Infraestrutura", id: "estrutura" },
      { label: "Depoimentos", id: "depoimentos" },
    ],
    servicos: [
      { label: "Cursos", id: "planos" },
      { label: "Como Funciona", id: "como-funciona" },
      { label: "Matrícula", id: "inscricao" },
      { label: "Contato", id: "contato" },
    ],
    legal: [
      { label: "Política de Privacidade", href: "#" },
      { label: "Termos de Uso", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2 space-y-4">
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
            <p className="text-sm text-muted-foreground max-w-xs">
              Sistema educacional comprometido com a excelência no ensino 
              e o desenvolvimento integral de cada aluno.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Institutional links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Institucional</h3>
            <ul className="space-y-2">
              {footerLinks.institucional.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Serviços</h3>
            <ul className="space-y-2">
              {footerLinks.servicos.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contato</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {config.escola.telefone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <a href={`tel:${config.escola.telefone}`} className="hover:text-primary transition-colors">
                    {config.escola.telefone}
                  </a>
                </li>
              )}
              {config.escola.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <a href={`mailto:${config.escola.email}`} className="hover:text-primary transition-colors">
                    {config.escola.email}
                  </a>
                </li>
              )}
              {config.escola.endereco && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{config.escola.endereco}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {config.escola.nome}. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
