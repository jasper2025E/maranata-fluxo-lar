import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronDown, Play } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingHeroProps {
  config: LandingConfig;
}

export function LandingHero({ config }: LandingHeroProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">Matrículas Abertas 2025</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              {config.hero.titulo}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              {config.hero.subtitulo}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={() => scrollToSection("inscricao")}
              >
                {config.hero.cta_primario}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 group"
                onClick={() => scrollToSection("planos")}
              >
                <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                {config.hero.cta_secundario}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
              {[
                { label: "Matrícula Online", color: "bg-green-500" },
                { label: "Pagamento Seguro", color: "bg-blue-500" },
                { label: "Suporte 24/7", color: "bg-purple-500" },
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground">
                  <div className={`w-2 h-2 ${badge.color} rounded-full`} />
                  <span className="text-sm font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Visual element */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Main card */}
              <div className="relative bg-card rounded-3xl p-8 shadow-2xl border max-w-md">
                <div className="flex items-center gap-4 mb-6">
                  {config.escola.logo_url ? (
                    <img 
                      src={config.escola.logo_url} 
                      alt={config.escola.nome}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div className="p-4 bg-primary rounded-2xl shadow-lg shadow-primary/25">
                      <GraduationCap className="h-10 w-10 text-primary-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{config.escola.nome}</h3>
                    <p className="text-sm text-muted-foreground">Excelência em Educação</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { value: "500+", label: "Alunos" },
                    { value: "98%", label: "Aprovação" },
                    { value: "15", label: "Anos" },
                  ].map((stat, index) => (
                    <div key={index} className="text-center p-3 rounded-xl bg-muted/50">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button className="w-full" onClick={() => scrollToSection("inscricao")}>
                  Agende sua Visita
                </Button>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-2xl -z-10 rotate-12" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/20 rounded-2xl -z-10 -rotate-12" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <button 
            onClick={() => scrollToSection("sobre")}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}
