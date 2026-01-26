import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Institutional sections
import { InstitucionalNavbar } from "@/components/institucional/InstitucionalNavbar";
import { InstitucionalHero } from "@/components/institucional/InstitucionalHero";
import { InstitucionalBeneficios } from "@/components/institucional/InstitucionalBeneficios";
import { InstitucionalComoFunciona } from "@/components/institucional/InstitucionalComoFunciona";
import { InstitucionalModulos } from "@/components/institucional/InstitucionalModulos";
import { InstitucionalSeguranca } from "@/components/institucional/InstitucionalSeguranca";
import { InstitucionalIntegracoes } from "@/components/institucional/InstitucionalIntegracoes";
import { InstitucionalDepoimentos } from "@/components/institucional/InstitucionalDepoimentos";
import { InstitucionalCTA } from "@/components/institucional/InstitucionalCTA";
import { InstitucionalFooter } from "@/components/institucional/InstitucionalFooter";

export default function Institucional() {
  const { user, loading } = useAuth();

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Fixed Navbar */}
      <InstitucionalNavbar />

      {/* Hero Section */}
      <InstitucionalHero />

      {/* Benefits Section */}
      <InstitucionalBeneficios />

      {/* How it Works */}
      <InstitucionalComoFunciona />

      {/* Modules Section */}
      <InstitucionalModulos />

      {/* Security & Scalability */}
      <InstitucionalSeguranca />

      {/* Integrations */}
      <InstitucionalIntegracoes />

      {/* Testimonials */}
      <InstitucionalDepoimentos />

      {/* Final CTA */}
      <InstitucionalCTA />

      {/* Footer */}
      <InstitucionalFooter />
    </div>
  );
}
