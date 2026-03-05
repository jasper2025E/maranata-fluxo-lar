import { BookOpen, Calculator, FlaskConical, ClipboardCheck, GraduationCap, Target } from "lucide-react";

const services = [
  {
    icon: BookOpen,
    title: "Reforço em Português",
    description: "Leitura, interpretação de texto, gramática e redação com exercícios práticos e acompanhamento contínuo.",
    meta: "Fundamental I e II",
  },
  {
    icon: Calculator,
    title: "Reforço em Matemática",
    description: "Das operações básicas à matemática avançada, com metodologia visual e prática no ritmo do aluno.",
    meta: "Fundamental I e II",
  },
  {
    icon: FlaskConical,
    title: "Reforço em Ciências",
    description: "Ciências naturais de forma acessível com explicações claras e experimentos simples para fixar o conteúdo.",
    meta: "Fundamental I e II",
  },
  {
    icon: ClipboardCheck,
    title: "Auxílio nas Tarefas",
    description: "Acompanhamento nas tarefas de casa e trabalhos escolares. Seu filho não fica mais perdido com os deveres.",
    meta: "Todas as séries",
  },
  {
    icon: GraduationCap,
    title: "Alfabetização",
    description: "Método fônico para crianças em fase de alfabetização. Leitura e escrita com paciência e carinho.",
    meta: "Educação Infantil",
  },
  {
    icon: Target,
    title: "Preparação para Provas",
    description: "Revisão e simulados antes das avaliações escolares. Seu filho vai para a prova com segurança.",
    meta: "Todas as séries",
  },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-20 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d47a1] mb-3 font-[Quicksand]">
            Como podemos ajudar seu filho?
          </h2>
          <p className="text-[#607d8b] text-lg max-w-[550px] mx-auto">
            Reforço escolar completo com atenção individualizada em Barreirinhas
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-8 border border-[#e3f2fd] hover:border-[#1e88e5] hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-[#e3f2fd] rounded-lg flex items-center justify-center mb-4">
                <service.icon className="h-6 w-6 text-[#1e88e5]" />
              </div>
              <h3 className="text-lg font-bold text-[#0d47a1] mb-2 font-[Quicksand]">{service.title}</h3>
              <p className="text-[#607d8b] text-sm leading-relaxed mb-4">{service.description}</p>
              <span className="inline-block bg-[#e3f2fd] px-3 py-1 rounded text-xs font-semibold text-[#1e88e5]">
                {service.meta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
