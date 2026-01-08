import { Card, CardContent } from "@/components/ui/card";
import { 
  Award, 
  BookOpen, 
  Heart, 
  Lightbulb, 
  Target, 
  TrendingUp,
  Users,
  Clock
} from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingDiferenciaisProps {
  config: LandingConfig;
}

const diferenciais = [
  {
    icon: BookOpen,
    title: "Metodologia Inovadora",
    description: "Abordagem pedagógica moderna que estimula o pensamento crítico e a criatividade dos alunos.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Turmas Reduzidas",
    description: "Classes com número limitado de alunos para garantir atenção individualizada.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Award,
    title: "Corpo Docente Qualificado",
    description: "Professores especializados e em constante atualização profissional.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Lightbulb,
    title: "Projetos Interdisciplinares",
    description: "Aprendizado integrado que conecta diferentes áreas do conhecimento.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Heart,
    title: "Educação Socioemocional",
    description: "Desenvolvimento integral incluindo habilidades emocionais e sociais.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Target,
    title: "Foco em Resultados",
    description: "Acompanhamento contínuo do desenvolvimento e evolução de cada aluno.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: TrendingUp,
    title: "Preparação para o Futuro",
    description: "Formação completa preparando para os desafios do século XXI.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Opções de turnos e atividades extracurriculares para atender sua família.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
];

export function LandingDiferenciais({ config }: LandingDiferenciaisProps) {
  return (
    <section id="diferenciais" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Por que nos escolher
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Nossos Diferenciais
          </h2>
          <p className="text-lg text-muted-foreground">
            Conheça o que torna a {config.escola.nome} única na formação de cidadãos preparados para o futuro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {diferenciais.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card"
              >
                <CardContent className="p-6">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.bgColor} ${item.color} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
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
