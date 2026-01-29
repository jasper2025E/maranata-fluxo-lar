import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";

interface PortalFooterProps {
  escolaNome: string;
  escolaLogo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  primaryColor?: string;
}

export function PortalFooter({
  escolaNome,
  escolaLogo,
  telefone,
  email,
  endereco,
  primaryColor,
}: PortalFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Logo e Nome */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {escolaLogo ? (
                <img
                  src={escolaLogo}
                  alt={escolaNome}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
                >
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
              )}
              <span className="text-lg font-semibold">{escolaNome}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Educação de qualidade para o futuro dos seus filhos.
            </p>
          </div>

          {/* Contato */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Contato</h3>
            {telefone && (
              <a
                href={`tel:${telefone.replace(/\D/g, "")}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                {telefone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                {email}
              </a>
            )}
            {endereco && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{endereco}</span>
              </div>
            )}
          </div>

          {/* Links rápidos */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Links Rápidos</h3>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sobre a Escola
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Estrutura
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} {escolaNome}. Todos os direitos reservados.</p>
          <p className="mt-1 text-xs">
            Powered by <span className="font-medium">Maranata Educacional</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
