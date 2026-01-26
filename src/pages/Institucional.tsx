import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";

// Institutional sections
import { InstitucionalNavbar } from "@/components/institucional/InstitucionalNavbar";
import { InstitucionalHero } from "@/components/institucional/InstitucionalHero";
import { InstitucionalBeneficios } from "@/components/institucional/InstitucionalBeneficios";
import { InstitucionalComoFunciona } from "@/components/institucional/InstitucionalComoFunciona";
import { InstitucionalModulos } from "@/components/institucional/InstitucionalModulos";
import { InstitucionalSeguranca } from "@/components/institucional/InstitucionalSeguranca";
import { InstitucionalMultitenant } from "@/components/institucional/InstitucionalMultitenant";
import { InstitucionalIntegracoes } from "@/components/institucional/InstitucionalIntegracoes";
import { InstitucionalPrecos } from "@/components/institucional/InstitucionalPrecos";
import { InstitucionalDepoimentos } from "@/components/institucional/InstitucionalDepoimentos";
import { InstitucionalCTA } from "@/components/institucional/InstitucionalCTA";
import { InstitucionalFooter } from "@/components/institucional/InstitucionalFooter";

export default function Institucional() {
  const { user, loading, isPlatformAdmin } = useAuth();
  const { data: branding, isLoading: brandingLoading } = usePlatformBranding();

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  // Show loading
  if (loading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Fixed Navbar */}
      <InstitucionalNavbar branding={branding} />

      {/* Hero Section */}
      <InstitucionalHero branding={branding} />

      {/* Benefits Section */}
      <InstitucionalBeneficios />

      {/* How it Works */}
      <InstitucionalComoFunciona />

      {/* Modules Section */}
      <InstitucionalModulos />

      {/* Security & Scalability */}
      <InstitucionalSeguranca />

      {/* Multi-tenant Section */}
      <InstitucionalMultitenant />

      {/* Integrations */}
      <InstitucionalIntegracoes />

      {/* Pricing */}
      <InstitucionalPrecos />

      {/* Testimonials */}
      <InstitucionalDepoimentos />

      {/* Final CTA */}
      <InstitucionalCTA branding={branding} />

      {/* Footer */}
      <InstitucionalFooter branding={branding} />
    </div>
  );
}
