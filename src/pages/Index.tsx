import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { usePlatformBranding, usePlatformAnnouncements } from "@/hooks/usePlatformBranding";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { AnnouncementBanner } from "@/components/landing/AnnouncementBanner";
import { useState } from "react";

// Company logos as text (like Stripe shows them)
const companyLogos = [
  { name: "OpenAI", style: "font-bold text-2xl" },
  { name: "amazon", style: "font-bold text-2xl italic" },
  { name: "Google", style: "font-bold text-2xl text-blue-500" },
  { name: "ANTHROPIC", style: "font-bold text-xl tracking-wider" },
];

const navItems = [
  { label: "Produtos", hasDropdown: true },
  { label: "Soluções", hasDropdown: true },
  { label: "Desenvolvedores", hasDropdown: true },
  { label: "Recursos", hasDropdown: true },
  { label: "Preços", hasDropdown: false },
];

export default function Index() {
  const { user, loading, isPlatformAdmin } = useAuth();
  const { data: branding, isLoading: brandingLoading } = usePlatformBranding();
  const { data: announcements = [] } = usePlatformAnnouncements("landing");
  const [email, setEmail] = useState("");

  // Show loading while checking auth
  if (loading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    if (isPlatformAdmin()) {
      return <Navigate to="/platform" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const platformName = branding?.platformName || "Sistema";

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Announcements at top */}
      {announcements.length > 0 && (
        <div className="relative z-50 px-6 py-2 bg-primary/10">
          <AnnouncementBanner announcements={announcements} />
        </div>
      )}

      {/* Header Navigation - Stripe Style */}
      <header className="relative z-40 px-6 lg:px-12 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              {platformName}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
                {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link 
              to="/auth" 
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              Entrar
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            </Link>
            <Link to="/cadastro">
              <Button 
                size="sm" 
                className="rounded-full px-5 font-medium"
              >
                Fale com nossa equipe
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient */}
      <div className="relative">
        {/* Gradient Background - positioned behind content */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-[20%] top-0 w-[80%] h-[120%]">
            <GradientBackground
              gradientFrom={branding?.gradientFrom}
              gradientVia={branding?.gradientVia}
              gradientTo={branding?.gradientTo}
            />
          </div>
          {/* Fade to white on right side */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, transparent 30%, white 70%)'
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 lg:pt-20 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Text */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <h1 className="text-5xl lg:text-[4.5rem] font-semibold leading-[1.1] tracking-tight text-foreground mb-6">
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  {branding?.heroTitle || "Infraestrutura financeira para a internet"}
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-foreground/70 mb-8 leading-relaxed">
                {branding?.heroSubtitle || "Faça como os milhões de empresas que confiam em nossa plataforma para receber pagamentos online e presenciais, oferecer serviços financeiros integrados e aumentar os lucros nos negócios."}
              </p>

              {/* Email CTA */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-md border-border bg-white/80 backdrop-blur-sm"
                />
                <Link to={email ? `/cadastro?email=${encodeURIComponent(email)}` : "/cadastro"}>
                  <Button className="h-12 px-6 rounded-md font-medium whitespace-nowrap">
                    {branding?.ctaPrimary || "Comece agora"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Column - Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              {/* Dashboard Card */}
              <div className="bg-white rounded-xl shadow-2xl border border-border/50 p-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Dashboard Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600" />
                  <span className="font-semibold text-foreground">Dashboard</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-8 w-32 bg-muted rounded-md" />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Volume líquido</p>
                    <p className="text-xl font-semibold text-foreground">R$ 3.528.198,72</p>
                    <p className="text-xs text-muted-foreground">Hoje, 14:00</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Ontem</p>
                    <p className="text-xl font-semibold text-foreground">R$ 2.931.556,34</p>
                  </div>
                </div>

                {/* Chart Placeholder */}
                <div className="h-32 bg-gradient-to-r from-primary/5 to-primary/20 rounded-lg mb-6 flex items-end justify-around px-4 pb-2">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((h, i) => (
                    <div 
                      key={i}
                      className="w-4 bg-primary/60 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                {/* Bottom Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Volume líquido de vendas</span>
                      <span className="text-xs text-emerald-600 font-medium">+32,8%</span>
                    </div>
                    <p className="font-semibold text-foreground">R$ 39.274,29</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Novos clientes</span>
                      <span className="text-xs text-emerald-600 font-medium">+32,1%</span>
                    </div>
                    <p className="font-semibold text-foreground">37</p>
                  </div>
                </div>
              </div>

              {/* Floating Payment Card */}
              <div className="absolute -left-12 top-1/4 bg-white rounded-xl shadow-xl border border-border/50 p-5 w-64 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-lg">💳</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Revista Abstraction</p>
                    <p className="text-xs text-muted-foreground">R$ 19 por mês</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-9 bg-black rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-medium"> Pay</span>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">Ou pague com cartão</div>
                  <div className="h-9 bg-muted rounded-md" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-9 bg-muted rounded-md" />
                    <div className="h-9 bg-muted rounded-md" />
                  </div>
                  <Button className="w-full h-9 text-sm">Pagar</Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Company Logos Section */}
      <div className="relative z-10 bg-white py-16 border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-12 lg:gap-20"
          >
            {companyLogos.map((company, index) => (
              <div 
                key={company.name}
                className={`${company.style} text-foreground/40 hover:text-foreground/60 transition-colors cursor-default`}
              >
                {company.name}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section - Simplified */}
      <div className="relative z-10 bg-muted/30 py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4">
              Uma plataforma totalmente integrada
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gerencie alunos, cobranças, RH e muito mais em um só lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Gestão de Alunos", desc: "Matrículas, turmas e acompanhamento completo." },
              { title: "Financeiro Integrado", desc: "Cobranças automáticas via PIX, boleto e cartão." },
              { title: "Recursos Humanos", desc: "Controle de funcionários, folha e ponto eletrônico." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-foreground text-white py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xl font-bold">{platformName}</div>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <span>© {new Date().getFullYear()} {platformName}</span>
              <button className="hover:text-white transition-colors">Privacidade</button>
              <button className="hover:text-white transition-colors">Termos</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
