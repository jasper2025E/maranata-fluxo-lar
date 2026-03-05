import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { InstitucionalNavbar } from "@/components/institucional/InstitucionalNavbar";
import { InstitucionalHero } from "@/components/institucional/InstitucionalHero";
import { InstitucionalModulos } from "@/components/institucional/InstitucionalModulos";
import { InstitucionalBeneficios } from "@/components/institucional/InstitucionalBeneficios";
import { InstitucionalComoFunciona } from "@/components/institucional/InstitucionalComoFunciona";
import { InstitucionalDepoimentos } from "@/components/institucional/InstitucionalDepoimentos";
import { InstitucionalCTA } from "@/components/institucional/InstitucionalCTA";
import { InstitucionalFooter } from "@/components/institucional/InstitucionalFooter";

export default function Institucional() {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Sistema Maranata — Gestão Escolar Completa</title>
        <meta name="description" content="Plataforma completa de gestão escolar. Controle financeiro, matrículas, turmas e relatórios em um só lugar. Simplifique a administração da sua escola." />
        <link rel="canonical" href="https://maranata-fluxo-lar.lovable.app" />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <InstitucionalNavbar />
        <InstitucionalHero />
        <InstitucionalModulos />
        <InstitucionalBeneficios />
        <InstitucionalComoFunciona />
        <InstitucionalDepoimentos />
        <InstitucionalCTA />
        <InstitucionalFooter />
      </div>
    </>
  );
}
