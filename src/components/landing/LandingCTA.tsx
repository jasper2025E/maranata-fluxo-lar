import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingCTAProps {
  config: LandingConfig;
}

export function LandingCTA({ config }: LandingCTAProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Venha conhecer nossa escola!
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Agende uma visita e descubra como podemos fazer a diferença na educação do seu filho. 
            Vagas limitadas para o próximo semestre.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => scrollToSection("inscricao")}
            >
              Matricule-se Agora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
              onClick={() => scrollToSection("contato")}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Agendar Visita
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
