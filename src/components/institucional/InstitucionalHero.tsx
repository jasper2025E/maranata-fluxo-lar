import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.png";

export function InstitucionalHero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 lg:pt-0 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Plataforma de Gestão Escolar #1
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] mb-6"
          >
            Gestão Escolar Completa{" "}
            <span className="text-gradient">em um Só Lugar</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Simplifique a administração da sua escola com soluções integradas.
            Financeiro, matrículas, turmas e relatórios — tudo em uma plataforma
            intuitiva e poderosa.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#cta"
              className="w-full sm:w-auto gradient-luz-mina text-white font-semibold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              Agendar Demonstração
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#funcionalidades"
              className="w-full sm:w-auto bg-muted text-foreground font-semibold px-8 py-4 rounded-xl text-base hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 border border-border"
            >
              <Play className="h-4 w-4" />
              Ver Funcionalidades
            </a>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10 bg-card">
            <img
              src={dashboardMockup}
              alt="Dashboard do Sistema Maranata - Visão geral financeira"
              className="w-full h-auto"
              loading="eager"
            />
            {/* Overlay gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute -left-4 top-1/3 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg"
          >
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <span className="text-success text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Pagamento confirmado</p>
              <p className="text-xs text-muted-foreground">R$ 450,00 — há 2min</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute -right-4 top-1/4 hidden lg:flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-lg"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">📊</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Taxa de arrecadação</p>
              <p className="text-xs text-muted-foreground">92.5% este mês</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
