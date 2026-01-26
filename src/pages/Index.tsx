import { Link } from "react-router-dom";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, GraduationCap, CreditCard, Users, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const features = [
  { icon: GraduationCap, text: "Gestão completa de alunos e matrículas" },
  { icon: CreditCard, text: "Financeiro integrado com múltiplos gateways" },
  { icon: Users, text: "RH e controle de funcionários" },
  { icon: BarChart3, text: "Relatórios e dashboards avançados" },
  { icon: Shield, text: "Segurança e controle de acesso" },
  { icon: Zap, text: "Automações e integrações" },
];

export default function Index() {
  const { user, loading, isPlatformAdmin } = useAuth();
  const { data: platformSettings, isLoading: settingsLoading } = usePlatformSettings();

  // Show loading while checking auth
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 via-40% via-pink-400 via-60% to-orange-300">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
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

  const platformName = platformSettings?.platform_name || "Sistema de Gestão";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 via-40% via-pink-400 via-60% to-orange-300 to-90%" />
      
      {/* Mesh Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 40% 20%, hsla(280, 80%, 60%, 0.3) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(320, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(260, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(340, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(280, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(20, 80%, 60%, 0.2) 0px, transparent 50%)
          `
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">{platformName}</span>
          </div>
          <Link to="/auth">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Hero Section */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Gerencie sua escola com simplicidade
              </h1>
              <p className="text-lg text-gray-600 max-w-lg mx-auto">
                Plataforma completa para gestão escolar. Alunos, financeiro, RH e muito mais em um só lugar.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-sm text-gray-700">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto md:min-w-[200px] bg-violet-600 hover:bg-violet-700 text-white font-semibold py-6 text-lg"
                >
                  Entrar na Plataforma
                </Button>
              </Link>
              <p className="mt-4 text-sm text-gray-500">
                Ainda não tem conta?{" "}
                <Link to="/cadastro" className="text-violet-600 hover:text-violet-700 font-medium">
                  Cadastre sua escola
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} {platformName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
