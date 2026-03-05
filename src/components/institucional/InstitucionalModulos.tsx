import { BookOpen, Calculator, FlaskConical, ClipboardCheck, GraduationCap, Target } from "lucide-react";

const services = [
  { icon: BookOpen, title: "Português", description: "Leitura, interpretação, gramática e redação com exercícios práticos." },
  { icon: Calculator, title: "Matemática", description: "Das operações básicas à matemática avançada, no ritmo do aluno." },
  { icon: FlaskConical, title: "Ciências", description: "Explicações claras e experimentos simples para fixar o conteúdo." },
  { icon: ClipboardCheck, title: "Auxílio nas Tarefas", description: "Acompanhamento nos deveres de casa e trabalhos escolares." },
  { icon: GraduationCap, title: "Alfabetização", description: "Método fônico com paciência e carinho para ler e escrever." },
  { icon: Target, title: "Preparação para Provas", description: "Revisão e simulados antes das avaliações escolares." },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#2196F3" }}>Serviços</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Tudo que seu filho precisa para evoluir
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div key={i} className="inst-card inst-card-accent p-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.15)" }}>
                  <Icon className="h-5 w-5" style={{ color: "#2196F3" }} />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-1.5">{service.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
