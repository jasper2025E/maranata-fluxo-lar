import { BookOpen, Calculator, FlaskConical, ClipboardCheck, GraduationCap, Target } from "lucide-react";

const services = [
  {
    icon: BookOpen,
    title: "Reforço em Português",
    description: "Leitura, interpretação de texto, gramática e redação com exercícios práticos e acompanhamento contínuo.",
    level: "Fundamental I e II",
    schedule: "Manhã ou tarde",
  },
  {
    icon: Calculator,
    title: "Reforço em Matemática",
    description: "Das operações básicas à matemática avançada, com metodologia visual e prática no ritmo do aluno.",
    level: "Fundamental I e II",
    schedule: "Manhã ou tarde",
  },
  {
    icon: FlaskConical,
    title: "Reforço em Ciências",
    description: "Ciências naturais de forma acessível com explicações claras e experimentos simples para fixar o conteúdo.",
    level: "Fundamental I e II",
    schedule: "Manhã ou tarde",
  },
  {
    icon: ClipboardCheck,
    title: "Auxílio nas Tarefas",
    description: "Acompanhamento nas tarefas de casa e trabalhos escolares. Seu filho não fica mais perdido com os deveres.",
    level: "Todas as séries",
    schedule: "Tarde",
  },
  {
    icon: GraduationCap,
    title: "Alfabetização",
    description: "Método fônico para crianças em fase de alfabetização. Leitura e escrita com paciência e carinho.",
    level: "Educação Infantil",
    schedule: "Manhã ou tarde",
  },
  {
    icon: Target,
    title: "Preparação para Provas",
    description: "Revisão e simulados antes das avaliações escolares. Seu filho vai para a prova com segurança.",
    level: "Todas as séries",
    schedule: "Flexível",
  },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-16 lg:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h3
            className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold mb-3"
            style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
          >
            <span style={{ color: "var(--inst-secondary)" }}>•</span>{" "}
            Nossos Serviços{" "}
            <span style={{ color: "var(--inst-secondary)" }}>•</span>
          </h3>
          <p className="text-lg max-w-[600px] mx-auto" style={{ color: "var(--inst-text-light)" }}>
            Reforço escolar completo com atenção individualizada em Barreirinhas
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={i}
                className="inst-course-card p-8 border rounded-lg"
                style={{ background: "var(--inst-bg-warm)", borderColor: "var(--inst-border)" }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(21, 101, 192, 0.08)" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "var(--inst-primary)" }} />
                </div>
                <h4
                  className="text-xl font-semibold mb-3"
                  style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
                >
                  {service.title}
                </h4>
                <p className="leading-relaxed text-[0.95rem] mb-5" style={{ color: "var(--inst-text-light)" }}>
                  {service.description}
                </p>
                <div className="flex justify-between pt-4 border-t text-xs font-medium uppercase tracking-wider" style={{ borderColor: "var(--inst-border)", color: "var(--inst-text-light)" }}>
                  <span>{service.level}</span>
                  <span>{service.schedule}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
