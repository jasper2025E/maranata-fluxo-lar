import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { PlatformBranding } from "@/hooks/usePlatformBranding";
import { GRADIENT_MAIN, INSTITUCIONAL_COLORS } from "./colors";

interface InstitucionalCTAProps {
  branding?: PlatformBranding | null;
}

const benefits = [
  "14 dias grátis",
  "Sem cartão de crédito",
  "Migração assistida",
  "Suporte incluído",
];

export function InstitucionalCTA({ branding }: InstitucionalCTAProps) {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{ background: GRADIENT_MAIN }}
      />

      {/* Mesh overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 20% 80%, hsla(${INSTITUCIONAL_COLORS.gradient.from}, 0.5) 0px, transparent 50%),
            radial-gradient(at 80% 20%, hsla(${INSTITUCIONAL_COLORS.gradient.to}, 0.4) 0px, transparent 50%)
          `,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
            Pronto para transformar
            <br />
            sua gestão escolar?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Junte-se a mais de 500 escolas que já economizam tempo, 
            reduzem inadimplência e crescem com segurança.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/cadastro">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-white text-foreground hover:bg-white/90 shadow-xl gap-2 group"
              >
                Começar gratuitamente
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="ghost"
                className="h-14 px-8 text-base font-semibold text-white hover:bg-white/10 border border-white/30"
              >
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-white/90 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                {benefit}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
