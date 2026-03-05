import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import "@/components/institucional/institucional.css";
import { InstitucionalNavbar } from "@/components/institucional/InstitucionalNavbar";
import { InstitucionalHero } from "@/components/institucional/InstitucionalHero";
import { InstitucionalStats } from "@/components/institucional/InstitucionalStats";
import { InstitucionalModulos } from "@/components/institucional/InstitucionalModulos";
import { InstitucionalBeneficios } from "@/components/institucional/InstitucionalBeneficios";
import { InstitucionalDepoimentos } from "@/components/institucional/InstitucionalDepoimentos";
import { InstitucionalCTA } from "@/components/institucional/InstitucionalCTA";
import { InstitucionalFooter } from "@/components/institucional/InstitucionalFooter";

export default function Institucional() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Reforço Maranata — Reforço Escolar em Barreirinhas - MA</title>
        <meta name="description" content="Reforço escolar de qualidade em Barreirinhas - MA. Acompanhamento individualizado em todas as matérias para Fundamental I e II. Matrículas abertas!" />
        <link rel="canonical" href="https://maranata-fluxo-lar.lovable.app" />
      </Helmet>

      <div className="inst min-h-screen overflow-x-hidden">
        <InstitucionalNavbar />
        <InstitucionalHero />
        <InstitucionalStats />
        <InstitucionalModulos />
        <InstitucionalBeneficios />
        <InstitucionalDepoimentos />
        <InstitucionalCTA />
        <InstitucionalFooter />
      </div>
    </>
  );
}
