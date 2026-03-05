import { BookOpen, Calculator, FlaskConical, ClipboardCheck, GraduationCap, Target } from "lucide-react";

const services = [
  {
    icon: BookOpen,
    title: "Português",
    description: "Leitura, interpretação, gramática e redação com exercícios práticos.",
    tag: "Fundamental I e II",
  },
  {
    icon: Calculator,
    title: "Matemática",
    description: "Das operações básicas à matemática avançada, no ritmo do aluno.",
    tag: "Fundamental I e II",
  },
  {
    icon: FlaskConical,
    title: "Ciências",
    description: "Ciências naturais com explicações claras e experimentos simples.",
    tag: "Fundamental I e II",
  },
  {
    icon: ClipboardCheck,
    title: "Auxílio nas Tarefas",
    description: "Acompanhamento nos deveres de casa e trabalhos escolares.",
    tag: "Todas as séries",
  },
  {
    icon: GraduationCap,
    title: "Alfabetização",
    description: "Método fônico para crianças em fase de leitura e escrita.",
    tag: "Ed. Infantil",
  },
  {
    icon: Target,
    title: "Preparação para Provas",
    description: "Revisão e simulados antes das avaliações escolares.",
    tag: "Todas as séries",
  },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Nossos serviços
          </h2>
          <p className="text-gray-500 max-w-md">
            Reforço escolar completo com atenção individualizada em Barreirinhas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <service.icon className="h-5 w-5 text-blue-800 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{service.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{service.description}</p>
              <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded">
                {service.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
