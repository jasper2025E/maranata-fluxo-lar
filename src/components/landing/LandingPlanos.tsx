import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
  duracao_meses: number;
}

interface LandingPlanosProps {
  config: LandingConfig;
  cursos: Curso[];
}

export function LandingPlanos({ config, cursos }: LandingPlanosProps) {
  const scrollToInscricao = () => {
    document.getElementById("inscricao")?.scrollIntoView({ behavior: "smooth" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Features por nível (pode ser customizado)
  const featuresByNivel: Record<string, string[]> = {
    "Fundamental I": [
      "Material didático incluso",
      "Aulas presenciais",
      "Atividades extracurriculares",
      "Acompanhamento pedagógico",
    ],
    "Fundamental II": [
      "Material didático incluso",
      "Aulas presenciais",
      "Laboratório de ciências",
      "Orientação educacional",
      "Preparação para o Ensino Médio",
    ],
    "Ensino Médio": [
      "Material didático completo",
      "Aulas presenciais",
      "Simulados e avaliações",
      "Preparação para vestibular",
      "Orientação profissional",
      "Monitorias extras",
    ],
    default: [
      "Material didático",
      "Aulas presenciais",
      "Acompanhamento pedagógico",
      "Suporte ao aluno",
    ],
  };

  if (cursos.length === 0) {
    return (
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {config.planos.titulo}
            </h2>
            <p className="text-lg text-muted-foreground">
              Em breve disponibilizaremos nossos planos. Entre em contato para mais informações.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="planos" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {config.planos.titulo}
          </h2>
          <p className="text-lg text-muted-foreground">
            {config.planos.subtitulo}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {cursos.map((curso, index) => {
            const isPopular = index === Math.floor(cursos.length / 2);
            const features = featuresByNivel[curso.nivel] || featuresByNivel.default;

            return (
              <Card 
                key={curso.id}
                className={`relative flex flex-col ${
                  isPopular 
                    ? 'border-primary shadow-xl scale-105 z-10' 
                    : 'border-border hover:border-primary/50'
                } transition-all duration-300`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{curso.nome}</CardTitle>
                  <CardDescription>{curso.nivel}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-foreground">
                      {formatCurrency(curso.mensalidade)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      por mês • {curso.duracao_meses} meses
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button 
                    className="w-full" 
                    variant={isPopular ? "default" : "outline"}
                    onClick={scrollToInscricao}
                  >
                    Inscrever Agora
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            * Valores sujeitos a condições especiais de pagamento.
            Desconto de pontualidade disponível.
          </p>
        </div>
      </div>
    </section>
  );
}
