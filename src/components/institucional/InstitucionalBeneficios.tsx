import { Users, MessageSquare, Gamepad2, Home } from "lucide-react";

const diferenciais = [
  {
    icon: Users,
    title: "Atenção Individualizada",
    description: "Turmas reduzidas para que cada aluno receba o acompanhamento que precisa.",
  },
  {
    icon: MessageSquare,
    title: "Acompanhamento aos Pais",
    description: "Feedback constante sobre o progresso, conquistas e pontos a melhorar do aluno.",
  },
  {
    icon: Gamepad2,
    title: "Aprendizado Divertido",
    description: "Atividades lúdicas e jogos educativos para tornar o estudo prazeroso e eficiente.",
  },
  {
    icon: Home,
    title: "Ambiente Familiar",
    description: "Espaço acolhedor em Barreirinhas onde as crianças se sentem seguras e à vontade.",
  },
];

export function InstitucionalBeneficios() {
  return (
    <section id="metodologia" className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Image */}
          <div className="relative">
            <div className="rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=800&fit=crop"
                alt="Sala de aula do Reforço Maranata"
                className="w-full h-[440px] object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#f57c00] text-white py-4 px-6 rounded-xl shadow-lg">
              <span className="block text-3xl font-bold leading-none">100%</span>
              <span className="text-sm font-medium">Dedicação</span>
            </div>
          </div>

          {/* Right: Text + items */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d47a1] mb-3 font-[Quicksand]">
              Por que escolher o Reforço Maranata?
            </h2>
            <p className="text-[#607d8b] mb-8">
              Uma metodologia que realmente funciona, com resultados comprovados.
            </p>

            <div className="space-y-4">
              {diferenciais.map((d, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 bg-[#f8fafc] rounded-xl border border-transparent hover:border-[#e3f2fd] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0d47a1] rounded-lg flex items-center justify-center flex-shrink-0">
                    <d.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0d47a1] mb-1">{d.title}</h4>
                    <p className="text-[#607d8b] text-sm leading-relaxed">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
