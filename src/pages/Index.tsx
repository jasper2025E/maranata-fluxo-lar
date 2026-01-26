import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, GraduationCap, CreditCard, Users, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GradientBackground } from "@/components/landing/GradientBackground";

const features = [
  { icon: "GraduationCap", text: "Gestão completa de alunos e turmas" },
  { icon: "CreditCard", text: "Controle financeiro integrado" },
  { icon: "Users", text: "Módulo de RH e folha de pagamento" },
  { icon: "BarChart3", text: "Relatórios e dashboards em tempo real" },
  { icon: "Shield", text: "Segurança e backup automático" },
  { icon: "Zap", text: "Integração com PIX e boleto" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Zap,
};

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <GradientBackground />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-white relative z-10" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <GradientBackground />
      </div>

      {/* Navbar */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">Escola Maranata</span>
          </div>
          <Link to="/auth">
            <Button variant="ghost" className="text-white hover:bg-white/10">
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Sistema de Gestão Escolar
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Gestão completa para a Escola Maranata. Controle financeiro, alunos, turmas e muito mais.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || GraduationCap;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature.text}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto md:min-w-[200px] font-semibold py-6 text-lg"
                >
                  Acessar Sistema
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} Escola Maranata. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
