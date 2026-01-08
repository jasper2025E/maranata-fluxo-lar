import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronDown } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingHeroProps {
  config: LandingConfig;
}

export function LandingHero({ config }: LandingHeroProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            {config.escola.logo_url ? (
              <img 
                src={config.escola.logo_url} 
                alt={config.escola.nome}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-3 bg-primary rounded-xl">
                  <GraduationCap className="h-10 w-10 text-primary-foreground" />
                </div>
                <span className="text-3xl font-bold text-foreground">
                  {config.escola.nome}
                </span>
              </div>
            )}
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            {config.hero.titulo}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
            {config.hero.subtitulo}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => scrollToSection("inscricao")}
            >
              {config.hero.cta_primario}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => scrollToSection("planos")}
            >
              {config.hero.cta_secundario}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm">Matrícula Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm">Suporte Dedicado</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}
