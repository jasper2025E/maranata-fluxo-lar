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
    <section className="relative min-h-screen overflow-hidden bg-white">
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
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                           linear-gradient(to bottom, #000 1px, transparent 1px)`,
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
            <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-semibold leading-[1.1] tracking-tight text-slate-900 mb-6">
              Infraestrutura{" "}
              <span className="text-primary">financeira</span>{" "}
              para escolas
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
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
                className="h-12 px-4 text-base border-slate-300 bg-white focus:border-primary focus:ring-primary rounded-md"
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
            {/* Main Dashboard Card */}
            <div className="absolute top-0 right-0 w-[320px] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Dashboard header */}
              <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">E</span>
                  </div>
                  <span className="text-white text-sm font-medium">ESCOLA DEMO</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-700 rounded px-2 py-1">
                  <span className="text-slate-400 text-xs">🔍 Pesquisar</span>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-4">
                <div className="text-sm text-slate-500 mb-1">Hoje</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Volume líquido ↓</div>
                    <div className="text-xl font-semibold text-slate-900">R$ 52.198,72</div>
                    <div className="text-xs text-slate-400">14:00</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Ontem ↓</div>
                    <div className="text-xl font-semibold text-slate-900">R$ 48.931,34</div>
                  </div>
                </div>
                
                {/* Mini chart */}
                <div className="h-20 flex items-end gap-1 mb-4">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 70].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-primary/20 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">Receita mensal</span>
                      <span className="text-xs text-green-600 font-medium">+12,8%</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-900">R$ 89.274,29</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">Novos alunos</span>
                      <span className="text-xs text-green-600 font-medium">+8</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-900">127</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Card - overlapping */}
            <div className="absolute top-32 left-0 w-[280px] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Product info */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📚</span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Mensalidade Maio</div>
                    <div className="text-sm text-slate-500">R$ 450 por mês</div>
                  </div>
                </div>
              </div>
              
              {/* Payment button */}
              <div className="p-4 space-y-3">
                <button className="w-full bg-slate-900 text-white py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2">
                  <span>Pay</span>
                </button>
                <div className="text-center text-xs text-slate-400">Ou pague com cartão</div>
                
                {/* Card form preview */}
                <div className="space-y-2">
                  <div className="h-9 bg-slate-50 rounded border border-slate-200 px-3 flex items-center">
                    <span className="text-sm text-slate-400">E-mail</span>
                  </div>
                  <div className="h-9 bg-slate-50 rounded border border-slate-200 px-3 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Número do cartão</span>
                    <div className="flex gap-1">
                      <div className="w-6 h-4 bg-blue-600 rounded-sm" />
                      <div className="w-6 h-4 bg-red-500 rounded-sm" />
                      <div className="w-6 h-4 bg-yellow-500 rounded-sm" />
                    </div>
                  </div>
                </div>
                
                <button className="w-full bg-primary text-white py-2.5 rounded-md text-sm font-medium">
                  Pagar
                </button>
              </div>
            </div>

            {/* Small floating chart card */}
            <div className="absolute bottom-10 right-10 w-[200px] bg-white rounded-xl shadow-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Taxa de adimplência</span>
                <span className="text-xs text-green-600 font-medium">+5,2%</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-2">97,8%</div>
              {/* Mini line chart */}
              <svg className="w-full h-12" viewBox="0 0 200 50">
                <path
                  d="M0,40 Q30,35 50,30 T100,25 T150,15 T200,10"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
                <circle cx="200" cy="10" r="4" fill="hsl(var(--primary))" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
