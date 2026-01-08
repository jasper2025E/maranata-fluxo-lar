import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  BookOpen, 
  Dumbbell, 
  FlaskConical, 
  Monitor, 
  Music,
  Palette,
  TreePine
} from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingEstruturaProps {
  config: LandingConfig;
}

const estruturas = [
  {
    icon: Building2,
    title: "Salas de Aula Modernas",
    description: "Ambientes climatizados com mobiliário ergonômico e recursos audiovisuais.",
  },
  {
    icon: Monitor,
    title: "Laboratório de Informática",
    description: "Computadores de última geração e internet de alta velocidade.",
  },
  {
    icon: FlaskConical,
    title: "Laboratório de Ciências",
    description: "Espaço equipado para experimentos práticos e descobertas científicas.",
  },
  {
    icon: BookOpen,
    title: "Biblioteca",
    description: "Acervo diversificado com milhares de títulos para todas as idades.",
  },
  {
    icon: Dumbbell,
    title: "Quadra Poliesportiva",
    description: "Espaço coberto para educação física e atividades esportivas.",
  },
  {
    icon: Music,
    title: "Sala de Música",
    description: "Instrumentos musicais e recursos para desenvolvimento artístico.",
  },
  {
    icon: Palette,
    title: "Ateliê de Artes",
    description: "Espaço dedicado à expressão artística e criatividade dos alunos.",
  },
  {
    icon: TreePine,
    title: "Área Verde",
    description: "Jardins e espaços ao ar livre para atividades recreativas.",
  },
];

export function LandingEstrutura({ config }: LandingEstruturaProps) {
  return (
    <section id="estrutura" className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Infraestrutura
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Nossa Estrutura
          </h2>
          <p className="text-lg text-muted-foreground">
            Ambientes pensados para proporcionar a melhor experiência de aprendizado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {estruturas.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="group border bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "15+", label: "Anos de Experiência" },
            { value: "500+", label: "Alunos Formados" },
            { value: "98%", label: "Satisfação dos Pais" },
            { value: "30+", label: "Profissionais" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-card border"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
