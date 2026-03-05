import { Users, MessageSquare, Gamepad2, Home } from "lucide-react";

const diferenciais = [
  {
    icon: Users,
    title: "Turmas reduzidas",
    description: "Cada aluno recebe a atenção que precisa para evoluir.",
  },
  {
    icon: MessageSquare,
    title: "Acompanhamento aos pais",
    description: "Feedback constante sobre progresso e pontos a melhorar.",
  },
  {
    icon: Gamepad2,
    title: "Aprendizado lúdico",
    description: "Atividades e jogos educativos que tornam o estudo prazeroso.",
  },
  {
    icon: Home,
    title: "Ambiente acolhedor",
    description: "Espaço familiar onde as crianças se sentem seguras.",
  },
];

export function InstitucionalBeneficios() {
  return (
    <section id="metodologia" className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Por que escolher o Maranata?
            </h2>
            <p className="text-gray-500 mb-8">
              Metodologia que funciona, com resultados comprovados em Barreirinhas.
            </p>

            <div className="space-y-4">
              {diferenciais.map((d, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-9 h-9 bg-blue-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <d.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{d.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image */}
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=700&fit=crop"
              alt="Sala de aula"
              className="w-full h-80 lg:h-96 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
