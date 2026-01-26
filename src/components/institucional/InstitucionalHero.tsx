import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { PlatformBranding } from "@/hooks/usePlatformBranding";

interface InstitucionalHeroProps {
  branding?: PlatformBranding | null;
}

export function InstitucionalHero({ branding }: InstitucionalHeroProps) {
  const [email, setEmail] = useState("");

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Gradient blob - top left */}
      <div className="absolute top-0 left-0 w-[70%] h-[90%] pointer-events-none">
        <svg
          viewBox="0 0 800 800"
          className="w-full h-full"
          preserveAspectRatio="xMinYMin slice"
        >
          <defs>
            <linearGradient id="stripe-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#80e9ff" />
              <stop offset="25%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 L800,0 L800,400 Q700,600 500,550 Q300,500 200,650 Q100,750 0,700 Z"
            fill="url(#stripe-gradient)"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left column - Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            {/* Main headline - Stripe style typography */}
            <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-semibold leading-[1.1] tracking-tight text-foreground mb-6">
              Infraestrutura{" "}
              <span className="text-primary">financeira</span>{" "}
              para escolas
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Faça como as melhores instituições de ensino: gerencie alunos, 
              cobranças e funcionários em uma plataforma completa, segura e escalável.
            </p>

            {/* Email input with CTA - Stripe style */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 text-base border-border bg-background focus:border-primary focus:ring-primary rounded-md"
              />
              <Link to="/cadastro">
                <Button 
                  size="lg" 
                  className="h-12 px-6 text-base font-medium gap-2 group whitespace-nowrap"
                >
                  Comece agora
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right column - Dashboard mockups */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] hidden lg:block"
          >
            {/* Main Dashboard Card - Gestão de Alunos */}
            <div className="absolute top-0 right-0 w-[340px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
              {/* Dashboard header */}
              <div className="bg-foreground px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-[11px] text-primary-foreground font-bold">M</span>
                  </div>
                  <span className="text-background text-sm font-medium">Maranata Gestão</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-muted-foreground text-xs">Online</span>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Visão Geral</span>
                  <span className="text-xs text-muted-foreground">Janeiro 2026</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-foreground">248</div>
                    <div className="text-[10px] text-muted-foreground">Alunos</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-foreground">12</div>
                    <div className="text-[10px] text-muted-foreground">Turmas</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-green-600">97%</div>
                    <div className="text-[10px] text-muted-foreground">Adimplência</div>
                  </div>
                </div>

                {/* Faturas recentes */}
                <div className="text-xs font-medium text-muted-foreground mb-2">Últimas faturas</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 px-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs text-foreground">Maria Silva</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">R$ 890,00</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs text-foreground">João Santos</span>
                    </div>
                    <span className="text-xs font-medium text-green-600">R$ 750,00</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 px-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span className="text-xs text-foreground">Ana Costa</span>
                    </div>
                    <span className="text-xs font-medium text-amber-600">Pendente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagamento PIX Card */}
            <div className="absolute top-44 left-0 w-[260px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground text-sm">💳</span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">Fatura #2026-001</div>
                    <div className="text-xs text-muted-foreground">Mensalidade Janeiro</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <span className="text-lg font-bold text-foreground">R$ 890,00</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-1.5 py-2 bg-[#32BCAD] text-white rounded-lg text-xs font-medium">
                    <span>◉</span> PIX
                  </button>
                  <button className="flex items-center justify-center gap-1.5 py-2 bg-muted text-foreground rounded-lg text-xs font-medium">
                    <span>▤</span> Boleto
                  </button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                  <div className="w-16 h-16 bg-background border-2 border-border rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-background'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-[10px] text-muted-foreground">
                  Escaneie o QR Code para pagar
                </div>
              </div>
            </div>

            {/* Receita Card */}
            <div className="absolute bottom-8 right-8 w-[220px] bg-card rounded-xl shadow-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Receita Mensal</span>
                <span className="text-[10px] text-green-600 font-medium bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">+18%</span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-3">R$ 124.500</div>
              {/* Mini area chart */}
              <svg className="w-full h-10" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,35 Q25,30 50,28 T100,20 T150,15 T200,8 L200,40 L0,40 Z"
                  fill="url(#areaGrad)"
                />
                <path
                  d="M0,35 Q25,30 50,28 T100,20 T150,15 T200,8"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
                <circle cx="200" cy="8" r="3" fill="hsl(var(--primary))" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
