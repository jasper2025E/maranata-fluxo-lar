import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

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
        <title>Reforço Escolar Maranata — Excelência no Ensino Personalizado</title>
        <meta name="description" content="Reforço escolar com ensino de qualidade, turmas reduzidas e acompanhamento individualizado. Matrículas abertas para Fundamental e Ensino Médio." />
        <link rel="canonical" href="https://maranata-fluxo-lar.lovable.app" />
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden font-[Nunito]">
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
