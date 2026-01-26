import { Link } from "react-router-dom";
import type { PlatformBranding } from "@/hooks/usePlatformBranding";

interface InstitucionalFooterProps {
  branding?: PlatformBranding | null;
}

const footerLinks = {
  produto: [
    { label: "Funcionalidades", href: "#modulos" },
    { label: "Preços", href: "#precos" },
    { label: "Segurança", href: "#seguranca" },
    { label: "Integrações", href: "#integracoes" },
  ],
  empresa: [
    { label: "Sobre nós", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contato", href: "#" },
  ],
  recursos: [
    { label: "Documentação", href: "#" },
    { label: "API", href: "#" },
    { label: "Status", href: "#" },
    { label: "Suporte", href: "#" },
  ],
  legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos", href: "#" },
    { label: "LGPD", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function InstitucionalFooter({ branding }: InstitucionalFooterProps) {
  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const id = href.replace("#", "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-foreground text-background py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid lg:grid-cols-5 gap-12 mb-12 pb-12 border-b border-background/10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              {branding?.platformLogo ? (
                <img
                  src={branding.platformLogo}
                  alt={branding.platformName}
                  className="h-8 w-auto brightness-0 invert"
                />
              ) : (
                <span className="text-xl font-bold">
                  {branding?.platformName || "Maranata"}
                </span>
              )}
            </Link>
            <p className="text-background/60 text-sm leading-relaxed">
              Gestão escolar simplificada para escolas que crescem.
            </p>
          </div>

          {/* Links */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-3">
                {footerLinks.produto.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-background/60 hover:text-background transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-3">
                {footerLinks.empresa.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-background/60 hover:text-background transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-3">
                {footerLinks.recursos.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-background/60 hover:text-background transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-background/60 hover:text-background transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} {branding?.platformName || "Maranata"}. 
            Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-background/60 hover:text-background transition-colors text-sm"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-background/60 hover:text-background transition-colors text-sm"
            >
              Instagram
            </a>
            <a
              href="#"
              className="text-background/60 hover:text-background transition-colors text-sm"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
