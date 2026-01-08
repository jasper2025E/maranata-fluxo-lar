import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Shield, LineChart } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingSobreProps {
  config: LandingConfig;
}

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Users,
  Shield,
  LineChart,
};

export function LandingSobre({ config }: LandingSobreProps) {
  return (
    <section id="sobre" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {config.sobre.titulo}
          </h2>
          <p className="text-lg text-muted-foreground">
            {config.sobre.descricao}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.sobre.cards.map((card, index) => {
            const Icon = iconMap[card.icone] || GraduationCap;
            return (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-card"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {card.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {card.descricao}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
