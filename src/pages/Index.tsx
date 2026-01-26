import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, GraduationCap, CreditCard, Users, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { usePlatformBranding, usePlatformAnnouncements } from "@/hooks/usePlatformBranding";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { AnnouncementBanner } from "@/components/landing/AnnouncementBanner";
import { PlatformNavbar } from "@/components/landing/PlatformNavbar";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Zap,
};

export default function Index() {
  const { user, loading, isPlatformAdmin } = useAuth();
  const { data: branding, isLoading: brandingLoading } = usePlatformBranding();
  const { data: announcements = [] } = usePlatformAnnouncements("landing");

  // Show loading while checking auth
  if (loading || brandingLoading) {
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
    if (isPlatformAdmin()) {
      return <Navigate to="/platform" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const features = branding?.features || [];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <GradientBackground
        gradientFrom={branding?.gradientFrom}
        gradientVia={branding?.gradientVia}
        gradientTo={branding?.gradientTo}
      />

      {/* Stripe-style Navbar */}
      <PlatformNavbar />

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="relative z-10 px-6 max-w-2xl mx-auto w-full">
          <AnnouncementBanner announcements={announcements} />
        </div>
      )}

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
                {branding?.heroTitle}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                {branding?.heroSubtitle}
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
                  {branding?.ctaPrimary}
                </Button>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link to="/cadastro" className="text-primary hover:text-primary/80 font-medium">
                  {branding?.ctaSecondary}
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
            © {new Date().getFullYear()} {branding?.platformName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
