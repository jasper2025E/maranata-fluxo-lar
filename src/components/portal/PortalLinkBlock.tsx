import { Link, useParams } from "react-router-dom";
import { FileSearch, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalLinkBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    button_text?: string;
  };
  settings?: {
    style?: "default" | "gradient" | "minimal";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function PortalLinkBlock({ content, settings, colors }: PortalLinkBlockProps) {
  const { slug } = useParams();
  const style = settings?.style || "default";

  const containerStyles = {
    default: "bg-muted/50 border",
    gradient: `bg-gradient-to-r from-[${colors.primary}] to-[${colors.secondary}] text-white`,
    minimal: "bg-transparent",
  };

  return (
    <section className="py-12 px-4">
      <div
        className={`max-w-3xl mx-auto rounded-2xl p-8 sm:p-12 text-center ${containerStyles[style]}`}
        style={
          style === "gradient"
            ? { background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }
            : undefined
        }
      >
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
            style === "gradient" ? "bg-white/20" : ""
          }`}
          style={
            style !== "gradient"
              ? { backgroundColor: `${colors.primary}20` }
              : undefined
          }
        >
          <FileSearch
            className="h-8 w-8"
            style={{ color: style === "gradient" ? "#fff" : colors.primary }}
          />
        </div>

        <h2
          className={`text-2xl sm:text-3xl font-bold mb-3 ${
            style === "gradient" ? "text-white" : ""
          }`}
        >
          {content.title || "Área do Responsável"}
        </h2>

        <p
          className={`text-lg mb-8 max-w-lg mx-auto ${
            style === "gradient" ? "text-white/90" : "text-muted-foreground"
          }`}
        >
          {content.subtitle || "Consulte suas faturas e boletos de forma rápida e prática usando apenas seu CPF"}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/escola/${slug}/portal`}>
            <Button
              size="lg"
              className={`gap-2 h-12 px-8 text-base ${
                style === "gradient" ? "bg-white text-gray-900 hover:bg-white/90" : ""
              }`}
              style={style !== "gradient" ? { backgroundColor: colors.primary } : undefined}
            >
              <FileSearch className="h-5 w-5" />
              {content.button_text || "Consultar Boletos"}
            </Button>
          </Link>

          <Link to={`/escola/${slug}/matricula`}>
            <Button
              size="lg"
              variant={style === "gradient" ? "outline" : "secondary"}
              className={`gap-2 h-12 px-8 text-base ${
                style === "gradient" ? "border-white text-white hover:bg-white/10" : ""
              }`}
            >
              <CreditCard className="h-5 w-5" />
              Fazer Matrícula
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
